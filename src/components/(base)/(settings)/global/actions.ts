"use server";

import { createClient } from "@/utils/supabase/server";

export interface GlobalSettings {
  id?: string;
  minutos_antes_permitidos: number;
  minutos_despues_permitidos: number;
}

export async function getGlobalSettings(): Promise<GlobalSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuraciones_globales")
    .select("id, minutos_antes_permitidos, minutos_despues_permitidos")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateGlobalSettings(settings: GlobalSettings): Promise<void> {
  const supabase = await createClient();

  if (settings.id) {
    const { error } = await supabase
      .from("configuraciones_globales")
      .update({
        minutos_antes_permitidos: settings.minutos_antes_permitidos,
        minutos_despues_permitidos: settings.minutos_despues_permitidos,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("configuraciones_globales")
      .insert({
        minutos_antes_permitidos: settings.minutos_antes_permitidos,
        minutos_despues_permitidos: settings.minutos_despues_permitidos,
      });

    if (error) throw new Error(error.message);
  }
}
