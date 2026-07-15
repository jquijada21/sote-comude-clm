"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  CrearActividadValues,
  RegistroAsistenciaValues,
  ActComude,
  ActComudeConParticipantes,
  ActComudeRegistro,
} from "./zod";

// ----- LECTURA -----

// Helper para traer los perfiles manualmente
async function attachProfilesToActividades(actividades: any[], supabase: any) {
  const userIds = new Set<string>();
  actividades.forEach((act) => {
    (act.act_comude_participantes || []).forEach((p: any) => userIds.add(p.usuario_id));
  });

  if (userIds.size === 0) return actividades;

  const { data: perfiles } = await supabase
    .from("profiles")
    .select("id, nombre, rol")
    .in("id", Array.from(userIds));

  const mapPerfiles = new Map((perfiles || []).map((p: any) => [p.id, p]));

  return actividades.map((act) => ({
    ...act,
    act_comude_participantes: (act.act_comude_participantes || []).map((p: any) => ({
      ...p,
      profiles: mapPerfiles.get(p.usuario_id) || null,
    })),
  }));
}

/** Obtiene las actividades COMUDE de un mes específico */
export async function getActividades(year?: number, month?: number): Promise<ActComudeConParticipantes[]> {
  const supabase = await createClient();

  const currentYear = year || new Date().getFullYear();
  const currentMonth = month !== undefined ? month : new Date().getMonth();

  const startDate = month === -1 
    ? new Date(currentYear, 0, 1).toISOString()
    : new Date(currentYear, currentMonth, 1).toISOString();
    
  const endDate = month === -1
    ? new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString()
    : new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).toISOString();

  const { data, error } = await supabase
    .from("act_comude")
    .select(`
      *,
      act_comude_participantes (
        act_comude_id,
        usuario_id,
        encargado
      )
    `)
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .order("fecha", { ascending: true });

  if (error) throw new Error(error.message);
  
  const actividadesConPerfiles = await attachProfilesToActividades(data || [], supabase);
  return actividadesConPerfiles as ActComudeConParticipantes[];
}

/** Obtiene una actividad con sus participantes y perfiles */
export async function getActividadById(id: string): Promise<ActComudeConParticipantes | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("act_comude")
    .select(`
      *,
      act_comude_participantes (
        act_comude_id,
        usuario_id,
        encargado
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const res = await attachProfilesToActividades([data], supabase);
  return res[0] as ActComudeConParticipantes;
}

/** Obtiene los registros de asistencia de una actividad */
export async function getRegistrosAsistencia(actComude_id: string): Promise<ActComudeRegistro[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("act_comude_registros")
    .select("*")
    .eq("act_comude_id", actComude_id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  
  const registros = data ?? [];
  if (registros.length === 0) return [];

  // Obtener nombres manualmente para evitar error de FK en Supabase
  const userIds = [...new Set(registros.map((r) => r.usuario_id))];
  const { data: perfiles } = await supabase
    .from("profiles")
    .select("id, nombre")
    .in("id", userIds);

  const mapNombres = new Map((perfiles || []).map((p) => [p.id, p.nombre]));

  return registros.map((r) => ({
    ...r,
    profiles: { nombre: mapNombres.get(r.usuario_id) ?? "Sin nombre" }
  })) as ActComudeRegistro[];
}

// ----- CREACIÓN / EDICIÓN -----

/** Crea una nueva actividad COMUDE y asigna participantes */
export async function crearActividadComude(values: CrearActividadValues): Promise<{ id: string }> {
  const supabase = await createClient();

  // Insertar la actividad
  const { data: actividad, error: actError } = await supabase
    .from("act_comude")
    .insert({
      nombre: values.nombre,
      fecha: new Date(values.fecha).toISOString(),
      agenda: values.agenda,
    })
    .select("id")
    .single();

  if (actError || !actividad) throw new Error(actError?.message ?? "Error al crear la actividad");

  // Insertar participantes
  const participantes = values.participantes.map((p) => ({
    act_comude_id: actividad.id,
    usuario_id: p.usuario_id,
    encargado: p.encargado,
  }));

  const { error: partError } = await supabase
    .from("act_comude_participantes")
    .insert(participantes);

  if (partError) throw new Error(partError.message);

  revalidatePath("/siget");
  return { id: actividad.id };
}

/** Edita una actividad COMUDE existente */
export async function editarActividadComude(id: string, values: CrearActividadValues): Promise<void> {
  const supabase = await createClient();

  // Actualizar la actividad
  const { error: actError } = await supabase
    .from("act_comude")
    .update({
      nombre: values.nombre,
      fecha: new Date(values.fecha).toISOString(),
      agenda: values.agenda,
    })
    .eq("id", id);

  if (actError) throw new Error(actError.message);

  // Reemplazar participantes
  await supabase.from("act_comude_participantes").delete().eq("act_comude_id", id);

  const participantes = values.participantes.map((p) => ({
    act_comude_id: id,
    usuario_id: p.usuario_id,
    encargado: p.encargado,
  }));

  if (participantes.length > 0) {
    const { error: partError } = await supabase
      .from("act_comude_participantes")
      .insert(participantes);

    if (partError) throw new Error(partError.message);
  }

  revalidatePath("/siget");
}

/** Actualiza la agenda de una actividad COMUDE */
export async function actualizarAgendaActividad(id: string, agenda: any[]): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("act_comude")
    .update({ agenda })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/siget");
}

/** Actualiza o guarda la URL del acta PDF en la base de datos */
export async function actualizarActaActividad(id: string, actaUrl: string | null): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("act_comude")
    .update({ actas: actaUrl })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/siget");
}

/** Elimina una actividad COMUDE */
export async function eliminarActividadComude(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("act_comude").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/(comude)/actividades");
}

export async function actualizarImagenesActividad(id: string, imgPaths: string[] | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("act_comude")
    .update({ img: imgPaths })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/(comude)/actividades");
}

import { getGlobalSettings } from "@/components/(base)/(settings)/global/actions";

// ----- ASISTENCIA -----

/** Registra la asistencia (entrada o salida) de un usuario con su ubicación GPS */
export async function registrarAsistencia(values: RegistroAsistenciaValues): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Validación de tiempo y justificación
  const { data: actividad } = await supabase
    .from("act_comude")
    .select("fecha")
    .eq("id", values.act_comude_id)
    .single();

  if (!actividad) throw new Error("Actividad no encontrada");

  const settings = await getGlobalSettings();
  if (settings) {
    const ahora = new Date().getTime();
    const horaProgramada = new Date(actividad.fecha).getTime();
    const minDespues = settings.minutos_despues_permitidos * 60000;
    const minAntes = settings.minutos_antes_permitidos * 60000;

    if (values.tipo_registro === "entrada" && ahora < horaProgramada - minAntes) {
      throw new Error("Es muy temprano para marcar asistencia");
    }

    if (values.tipo_registro === "entrada" && ahora > horaProgramada + minDespues && (!values.notas || values.notas.trim().length < 5)) {
      throw new Error("Se requiere una justificación válida para el registro tardío");
    }
  }

  const { error } = await supabase.from("act_comude_registros").insert({
    act_comude_id: values.act_comude_id,
    usuario_id: user.id,
    tipo_registro: values.tipo_registro,
    ubicacion: {
      lat: values.latitud,
      lng: values.longitud,
      accuracy: values.accuracy,
    },
    notas: values.notas ?? null,
  });

  if (error) throw new Error(error.message);
}
