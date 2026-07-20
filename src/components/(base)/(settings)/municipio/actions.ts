"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface ConfiguracionMunicipio {
  municipio_id: number;
  imagen_portada_url: string | null;
  minutos_antes_permitidos: number;
  minutos_despues_permitidos: number;
  created_at: string;
  updated_at: string;
}

export async function getConfiguracionMunicipio(
  municipioId: number
): Promise<ConfiguracionMunicipio | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuraciones_municipio")
    .select("municipio_id, imagen_portada_url, minutos_antes_permitidos, minutos_despues_permitidos, created_at, updated_at")
    .eq("municipio_id", municipioId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function upsertConfiguracionMunicipio(
  municipioId: number,
  imagenPortadaUrl: string | null,
  minutosAntes: number,
  minutosDespues: number
): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const { error } = await supabase
    .from("configuraciones_municipio")
    .upsert(
      {
        municipio_id: municipioId,
        imagen_portada_url: imagenPortadaUrl,
        minutos_antes_permitidos: minutosAntes,
        minutos_despues_permitidos: minutosDespues,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "municipio_id" }
    );

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
