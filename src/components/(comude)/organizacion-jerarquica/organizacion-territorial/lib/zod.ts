import { z } from "zod";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoLugar = "microrregion" | "aldea" | "caserio";

export const TIPO_LABELS: Record<TipoLugar, string> = {
  microrregion: "Microrregión",
  aldea: "Aldea",
  caserio: "Caserío",
};

export const TIPOS_HIJOS: Record<TipoLugar, TipoLugar | null> = {
  microrregion: "aldea",
  aldea: "caserio",
  caserio: null,
};

export interface ComunidadRecord {
  id: string;
  municipio_id: number;
  parent_id: string | null;
  nombre: string;
  tipo: TipoLugar;
}

export interface PersonaResidente {
  id: string;
  nombre: string;
  email: string | null;
  dpi: string | null;
}

export interface PersonaTerritorioOption {
  id: string;
  nombre: string;
  email: string | null;
  dpi: string | null;
  comunidad_id: string | null;
  comunidad_nombre?: string | null;
}

export interface NodoTerritorial {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  personas_count: number;
  residentes: PersonaResidente[];
  hijos: NodoTerritorial[];
}

// ─── Zod ─────────────────────────────────────────────────────────────────────

export const comunidadFormSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  tipo: z.enum(["microrregion", "aldea", "caserio"]),
  parent_id: z.string().nullable(),
});

export type ComunidadFormValues = z.infer<typeof comunidadFormSchema>;

export const asignarPersonaComunidadSchema = z.object({
  profile_id: z.string(),
  comunidad_id: z.string().nullable(),
});

export type AsignarPersonaComunidadValues = z.infer<typeof asignarPersonaComunidadSchema>;
