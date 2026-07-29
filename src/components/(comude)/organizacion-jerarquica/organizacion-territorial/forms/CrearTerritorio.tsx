"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCrearComunidad } from "../lib/hooks";
import {
  TIPO_LABELS,
  type TipoLugar,
  type ComunidadFormValues,
} from "../lib/zod";
import {
  TerritorioFormShell,
  FormInput,
  FormLabel,
  FormSubmitButton,
  FormFooter,
  modalActionMessage,
  toast,
} from "./TerritorioFormShell";

export function CrearTerritorio({
  open,
  onClose,
  tipo,
  parentId = null,
}: {
  open: boolean;
  onClose: () => void;
  tipo: TipoLugar;
  parentId?: string | null;
}) {
  const [nombre, setNombre] = useState("");
  const crearComunidad = useCrearComunidad();
  const guardando = crearComunidad.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warn("Escribe un nombre válido.");
      return;
    }

    const values: ComunidadFormValues = {
      nombre: nombre.trim(),
      tipo,
      parent_id: parentId,
    };

    const res = await crearComunidad.mutateAsync(values);
    if (res.success) {
      toast.success(`${TIPO_LABELS[tipo]} creado correctamente.`);
      onClose();
    } else {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
    }
  };

  return (
    <TerritorioFormShell
      open={open}
      onClose={onClose}
      title={`Nuevo ${TIPO_LABELS[tipo]}`}
      subtitle={
        parentId
          ? "Dentro de una unidad territorial existente"
          : "En el nivel principal del municipio"
      }
    >
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid gap-2">
          <FormLabel htmlFor="nombre">Nombre del {TIPO_LABELS[tipo]}</FormLabel>
          <FormInput
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={`Ej: ${tipo === "microrregion" ? "Microrregión Norte" : tipo === "aldea" ? "Aldea Las Flores" : "Caserío El Río"}`}
            autoFocus
          />
        </div>

        <FormFooter>
          <FormSubmitButton disabled={guardando}>
            {guardando ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
          </FormSubmitButton>
        </FormFooter>
      </motion.form>
    </TerritorioFormShell>
  );
}
