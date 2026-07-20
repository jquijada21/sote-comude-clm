import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import {
  ActComude,
  ActComudeConParticipantes,
  ActComudeRegistro,
  CrearActividadValues,
  RegistroAsistenciaValues,
} from "./zod";
import {
  getActividades,
  getActividadById,
  getRegistrosAsistencia,
  crearActividadComude,
  eliminarActividadComude,
  registrarAsistencia,
  actualizarAgendaActividad,
  editarActividadComude,
  actualizarActaActividad,
  actualizarImagenesActividad,
} from "./actions";

// ----- QUERIES -----

export function useActividades(year?: number, month?: number) {
  return useQuery<ActComudeConParticipantes[], Error>({
    queryKey: ["actividades-comude", year, month],
    queryFn: () => getActividades(year, month),
    staleTime: 1000 * 60 * 5,
  });
}

export function useActividadById(id: string | null) {
  return useQuery<ActComudeConParticipantes | null, Error>({
    queryKey: ["actividad-comude", id],
    queryFn: () => getActividadById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRegistrosAsistencia(actComudeId: string | null) {
  return useQuery<ActComudeRegistro[], Error>({
    queryKey: ["registros-asistencia", actComudeId],
    queryFn: () => getRegistrosAsistencia(actComudeId!),
    enabled: !!actComudeId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Hook reactivo del cliente que escucha si el usuario actual es participante de la actividad */
export function useEsParticipante(actComudeId: string | null, userId: string | null | undefined) {
  const supabase = createClient();
  return useQuery<boolean, Error>({
    queryKey: ["es-participante", actComudeId, userId],
    queryFn: async () => {
      if (!actComudeId || !userId) return false;
      const { data } = await supabase
        .from("act_comude_participantes")
        .select("usuario_id")
        .eq("act_comude_id", actComudeId)
        .eq("usuario_id", userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!actComudeId && !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSignedUrl(path: string | null, bucket: string = "portada_imagenes") {
  const supabase = createClient();
  return useQuery<string | null, Error>({
    queryKey: ["signed-url", bucket, path],
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600 * 24);
      if (error) throw error;
      return data?.signedUrl || null;
    },
    enabled: !!path,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

// ----- MUTATIONS -----

export function useCrearActividad() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, CrearActividadValues>({
    mutationFn: (values) => crearActividadComude(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actividades-comude"] });
    },
  });
}

export function useEditarActividad() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; values: CrearActividadValues }>({
    mutationFn: ({ id, values }) => editarActividadComude(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actividades-comude"] });
      queryClient.invalidateQueries({ queryKey: ["actividad-comude"] });
    },
  });
}

export function useEliminarActividad() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => eliminarActividadComude(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actividades-comude"] });
    },
  });
}

export function useRegistrarAsistencia() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, RegistroAsistenciaValues>({
    mutationFn: (values) => registrarAsistencia(values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["registros-asistencia", variables.act_comude_id] });
    },
  });
}

export function useActualizarAgenda() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; agenda: any[] }>({
    mutationFn: ({ id, agenda }) => actualizarAgendaActividad(id, agenda),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actividades-comude"] });
    },
  });
}

export function useActualizarActa() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; actaUrl: string | null }>({
    mutationFn: ({ id, actaUrl }) => actualizarActaActividad(id, actaUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actividades-comude"] });
      queryClient.invalidateQueries({ queryKey: ["actividad-comude"] });
    },
  });
}

export function useActualizarImagenesActividad() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; imgPaths: string[] | null }>({
    mutationFn: ({ id, imgPaths }) => actualizarImagenesActividad(id, imgPaths),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["actividad-comude", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["actividades-comude"] });
    },
  });
}
