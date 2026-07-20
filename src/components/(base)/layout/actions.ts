"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function setGlobalMunicipioCookie(id: number | null, nombre: string | null) {
  const cookieStore = await cookies();
  
  if (id === null || nombre === null) {
    cookieStore.delete("sote_municipio_seleccionado");
  } else {
    cookieStore.set(
      "sote_municipio_seleccionado",
      JSON.stringify({ id, nombre }),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 año
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      }
    );
  }
}

export async function getGlobalMunicipioCookie() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("sote_municipio_seleccionado");
  
  if (!cookie?.value) return null;
  
  try {
    return JSON.parse(cookie.value) as { id: number; nombre: string };
  } catch (e) {
    return null;
  }
}

export async function getInitialGlobalMunicipioState() {
  const cookieState = await getGlobalMunicipioCookie();
  const supabase = await createClient();

  if (cookieState?.id) {
    // Buscar su departamento
    const { data: mun } = await supabase
      .from("lug_municipios")
      .select("departamento_id")
      .eq("id", cookieState.id)
      .maybeSingle();
      
    if (mun?.departamento_id) {
      return { municipioId: cookieState.id, departamentoId: mun.departamento_id };
    }
  }

  // Si no hay cookie o falló, buscar el del perfil del usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("municipio_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.municipio_id) {
      const { data: mun } = await supabase
        .from("lug_municipios")
        .select("departamento_id")
        .eq("id", profile.municipio_id)
        .maybeSingle();
        
      if (mun?.departamento_id) {
        // También podemos guardar la cookie por defecto para futuras lecturas
        const { data: munFull } = await supabase.from("lug_municipios").select("nombre").eq("id", profile.municipio_id).single();
        if (munFull) {
          await setGlobalMunicipioCookie(profile.municipio_id, munFull.nombre);
        }
        return { municipioId: profile.municipio_id, departamentoId: mun.departamento_id };
      }
    }
  }

  return { municipioId: null, departamentoId: null };
}

export async function getGlobalMunicipioTitle() {
  const state = await getInitialGlobalMunicipioState();
  if (!state.municipioId || !state.departamentoId) {
    return "SISTEMA DE ORGANIZACIÓN TERRITORIAL ESTRATÉGICA";
  }

  const supabase = await createClient();
  const { data: mun } = await supabase
    .from("lug_municipios")
    .select("nombre")
    .eq("id", state.municipioId)
    .single();

  const { data: dep } = await supabase
    .from("lug_departamentos")
    .select("nombre")
    .eq("id", state.departamentoId)
    .single();

  if (mun && dep) {
    return `COMUDE ${mun.nombre}, ${dep.nombre}`;
  }

  return "SISTEMA DE ORGANIZACIÓN TERRITORIAL ESTRATÉGICA";
}

export async function getServerPortada() {
  const DEFAULT_BG = "/sote/hero-background2.jpg";
  const state = await getInitialGlobalMunicipioState();
  if (!state.municipioId) return DEFAULT_BG;

  const supabase = await createClient();
  const { data } = await supabase
    .from("configuraciones_municipio")
    .select("imagen_portada_url")
    .eq("municipio_id", state.municipioId)
    .maybeSingle();

  if (data?.imagen_portada_url) {
    const { data: urlData } = await supabase.storage
      .from("portada_imagenes")
      .createSignedUrl(data.imagen_portada_url, 60 * 60); // 1 hora
    if (urlData?.signedUrl) {
      return urlData.signedUrl;
    }
  }

  return DEFAULT_BG;
}
