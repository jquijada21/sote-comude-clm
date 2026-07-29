"use server";

import { createClient } from "@/utils/supabase/server";
import { isSuperOrAdminRole } from "@/components/(base)/dashboard/modules";
import { getGlobalMunicipioCookie } from "@/components/(base)/layout/actions";
import {
  comunidadFormSchema,
  asignarPersonaComunidadSchema,
  type ComunidadRecord,
  type ComunidadFormValues,
  type AsignarPersonaComunidadValues,
  type NodoTerritorial,
  type TipoLugar,
  type PersonaTerritorioOption,
  type PersonaResidente,
} from "./zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ActionResult = { success: boolean; error: string | null };

async function requireAdmin(): Promise<
  | { supabase: SupabaseServerClient; municipioId: number; error: null }
  | { supabase: null; municipioId: null; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, municipioId: null, error: "UNAUTHORIZED" };

  const role = (user.user_metadata?.rol || user.role || "user") as string;
  if (!isSuperOrAdminRole(role))
    return { supabase: null, municipioId: null, error: "FORBIDDEN" };

  // Obtener municipio_id: primero de la cookie global, luego del perfil
  const cookie = await getGlobalMunicipioCookie();
  if (cookie?.id) {
    return { supabase, municipioId: cookie.id, error: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("municipio_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.municipio_id) {
    return { supabase: null, municipioId: null, error: "NO_MUNICIPIO" };
  }

  return { supabase, municipioId: profile.municipio_id as number, error: null };
}

function construirArbol(
  comunidades: ComunidadRecord[],
  residentesMap: Map<string, PersonaResidente[]>,
): NodoTerritorial[] {
  const hijosPorPadre = new Map<string | null, ComunidadRecord[]>();

  for (const c of comunidades) {
    const lista = hijosPorPadre.get(c.parent_id) ?? [];
    lista.push(c);
    hijosPorPadre.set(c.parent_id, lista);
  }

  function buildNode(c: ComunidadRecord): NodoTerritorial {
    const hijos = (hijosPorPadre.get(c.id) ?? [])
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(buildNode);

    const directResidentes = residentesMap.get(c.id) ?? [];
    const directCount = directResidentes.length;
    const hijosCount = hijos.reduce((acc, h) => acc + h.personas_count, 0);

    return {
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo as TipoLugar,
      personas_count: directCount + hijosCount,
      residentes: directResidentes,
      hijos,
    };
  }

  return (hijosPorPadre.get(null) ?? [])
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map(buildNode);
}

// ─── Server Actions (solo funciones async) ────────────────────────────────────

export async function getEstructuraTerritorial(): Promise<{
  data: NodoTerritorial[];
  municipioId: number | null;
  error: string | null;
}> {
  try {
    const { supabase, municipioId, error } = await requireAdmin();
    if (error || !supabase)
      return { data: [], municipioId: null, error };

    const [comunidadesRes, profilesRes] = await Promise.all([
      supabase
        .from("lug_comunidades")
        .select("id, municipio_id, parent_id, nombre, tipo")
        .eq("municipio_id", municipioId)
        .order("nombre"),
      supabase
        .from("profiles")
        .select("id, nombre, email, dpi, comunidad_id")
        .eq("activo", true)
        .eq("municipio_id", municipioId)
        .not("comunidad_id", "is", null),
    ]);

    if (comunidadesRes.error) return { data: [], municipioId, error: "LOAD_FAILED" };

    const residentesMap = new Map<string, PersonaResidente[]>();
    if (!profilesRes.error && profilesRes.data) {
      for (const row of profilesRes.data) {
        if (row.comunidad_id) {
          const list = residentesMap.get(row.comunidad_id) ?? [];
          list.push({
            id: String(row.id),
            nombre: String(row.nombre ?? ""),
            email: row.email ?? null,
            dpi: row.dpi ?? null,
          });
          residentesMap.set(row.comunidad_id, list);
        }
      }
    }

    const comunidades = (comunidadesRes.data ?? []) as ComunidadRecord[];
    return { data: construirArbol(comunidades, residentesMap), municipioId, error: null };
  } catch {
    return { data: [], municipioId: null, error: "LOAD_FAILED" };
  }
}

export async function getPersonasParaAsignarTerritorio(comunidadId: string): Promise<{
  personas: PersonaTerritorioOption[];
  error: string | null;
}> {
  try {
    const { supabase, municipioId, error } = await requireAdmin();
    if (error || !supabase) return { personas: [], error };

    const [profilesRes, comunidadesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, nombre, email, dpi, comunidad_id")
        .eq("activo", true)
        .eq("municipio_id", municipioId)
        .order("nombre"),
      supabase
        .from("lug_comunidades")
        .select("id, nombre")
        .eq("municipio_id", municipioId),
    ]);

    if (profilesRes.error) return { personas: [], error: "LOAD_PROFILES_FAILED" };

    const comunidadesMap = new Map<string, string>(
      (comunidadesRes.data ?? []).map((c) => [c.id, c.nombre]),
    );

    const personas: PersonaTerritorioOption[] = (profilesRes.data ?? []).map((p) => ({
      id: String(p.id),
      nombre: String(p.nombre ?? ""),
      email: p.email ?? null,
      dpi: p.dpi ?? null,
      comunidad_id: p.comunidad_id ?? null,
      comunidad_nombre: p.comunidad_id ? (comunidadesMap.get(p.comunidad_id) ?? null) : null,
    }));

    return { personas, error: null };
  } catch {
    return { personas: [], error: "LOAD_PROFILES_FAILED" };
  }
}

export async function asignarPersonaATerritorio(
  values: AsignarPersonaComunidadValues,
): Promise<ActionResult> {
  try {
    const { supabase, error } = await requireAdmin();
    if (error || !supabase) return { success: false, error };

    const parsed = asignarPersonaComunidadSchema.safeParse(values);
    if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

    const { profile_id, comunidad_id } = parsed.data;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ comunidad_id })
      .eq("id", profile_id);

    if (updateError) return { success: false, error: "ASSIGN_FAILED" };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "ASSIGN_FAILED" };
  }
}

export async function createComunidad(
  values: ComunidadFormValues,
): Promise<ActionResult> {
  try {
    const { supabase, municipioId, error } = await requireAdmin();
    if (error || !supabase) return { success: false, error };

    const parsed = comunidadFormSchema.safeParse(values);
    if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

    const id = `${parsed.data.tipo}_${Date.now()}`;

    const { error: insertError } = await supabase.from("lug_comunidades").insert({
      id,
      municipio_id: municipioId,
      parent_id: parsed.data.parent_id,
      nombre: parsed.data.nombre.trim(),
      tipo: parsed.data.tipo,
    });

    if (insertError) return { success: false, error: "SAVE_FAILED" };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function updateComunidad(
  id: string,
  values: ComunidadFormValues,
): Promise<ActionResult> {
  try {
    const { supabase, municipioId, error } = await requireAdmin();
    if (error || !supabase) return { success: false, error };

    const parsed = comunidadFormSchema.safeParse(values);
    if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

    const { error: updateError } = await supabase
      .from("lug_comunidades")
      .update({
        nombre: parsed.data.nombre.trim(),
        parent_id: parsed.data.parent_id,
      })
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (updateError) return { success: false, error: "SAVE_FAILED" };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function deleteComunidad(id: string): Promise<ActionResult> {
  try {
    const { supabase, municipioId, error } = await requireAdmin();
    if (error || !supabase) return { success: false, error };

    const { count } = await supabase
      .from("lug_comunidades")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id)
      .eq("municipio_id", municipioId);

    if ((count ?? 0) > 0) return { success: false, error: "HAS_CHILDREN" };

    const { error: deleteError } = await supabase
      .from("lug_comunidades")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (deleteError) return { success: false, error: "DELETE_FAILED" };
    return { success: true, error: null };
  } catch {
    return { success: false, error: "DELETE_FAILED" };
  }
}
