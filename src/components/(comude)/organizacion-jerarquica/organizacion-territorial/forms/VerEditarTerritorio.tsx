"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEditarComunidad } from "../lib/hooks";
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
import { Button } from "@/components/ui/button";

export function VerEditarTerritorio({
  open,
  onClose,
  id,
  nombreInicial,
  tipo,
  tieneHijos,
  parentId,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  nombreInicial: string;
  tipo: TipoLugar;
  tieneHijos: boolean;
  parentId: string | null;
  onDelete: () => void;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const editarComunidad = useEditarComunidad();
  const guardando = editarComunidad.isPending;

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

    const res = await editarComunidad.mutateAsync({ id, values });
    if (res.success) {
      toast.success("Actualizado correctamente.");
      onClose();
    } else {
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo actualizar."));
    }
  };

  return (
    <TerritorioFormShell
      open={open}
      onClose={onClose}
      title={`Editar ${TIPO_LABELS[tipo]}`}
      subtitle={`Cambia la información de "${nombreInicial}"`}
    >
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid gap-2">
          <FormLabel htmlFor="nombre">Nombre</FormLabel>
          <FormInput
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <FormFooter>
          <div className="flex flex-col gap-2 w-full">
            <Button
              type="button"
              variant="destructive"
              className="w-full rounded-xl font-bold"
              onClick={onDelete}
              disabled={guardando}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
            
            <FormSubmitButton disabled={guardando}>
              {guardando ? <Loader2 className="size-4 animate-spin" /> : "Guardar cambios"}
            </FormSubmitButton>
          </div>
        </FormFooter>
      </motion.form>
    </TerritorioFormShell>
  );
}
