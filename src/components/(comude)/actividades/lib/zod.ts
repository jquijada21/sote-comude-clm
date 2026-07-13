import { z } from "zod";

// ----- Tipos de la Base de Datos -----
export type ActComude = {
  id: string;
  nombre: string;
  fecha: string;
  agenda: AgendaItem[];
  created_at: string;
};

export type ActComudeParticipante = {
  act_comude_id: string;
  usuario_id: string;
  encargado: boolean;
};

export type ActComudeRegistro = {
  id: string;
  act_comude_id: string;
  usuario_id: string;
  tipo_registro: "entrada" | "salida";
  ubicacion: { lat: number; lng: number; accuracy?: number };
  notas: string | null;
  created_at: string;
};

export type ActComudeConParticipantes = ActComude & {
  act_comude_participantes: (ActComudeParticipante & {
    profiles: { id: string; nombre: string; rol: string } | null;
  })[];
};

// ----- Tipos de Agenda -----
export type AgendaItem = {
  id: string;
  titulo: string;
  completado: boolean;
};

// ----- Schemas de validación -----
export const agendaItemSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1, "El título es obligatorio"),
  completado: z.boolean().default(false),
});

export const participanteSchema = z.object({
  usuario_id: z.string().uuid("ID de usuario inválido"),
  encargado: z.boolean().default(false),
});

export const crearActividadSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  agenda: z.array(agendaItemSchema).default([]),
  participantes: z.array(participanteSchema).min(1, "Debe asignar al menos un participante"),
});

export const registroAsistenciaSchema = z.object({
  act_comude_id: z.string().uuid("ID de actividad inválido"),
  tipo_registro: z.enum(["entrada", "salida"]),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  notas: z.string().optional(),
});

export type CrearActividadValues = z.infer<typeof crearActividadSchema>;
export type RegistroAsistenciaValues = z.infer<typeof registroAsistenciaSchema>;
