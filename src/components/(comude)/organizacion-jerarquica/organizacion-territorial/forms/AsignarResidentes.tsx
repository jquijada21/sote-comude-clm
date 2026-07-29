"use client";

import { useState } from "react";
import { Loader2, Search, UserPlus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePersonasParaAsignarTerritorio,
  useAsignarPersonaATerritorio,
} from "../lib/hooks";
import { TIPO_LABELS, type TipoLugar } from "../lib/zod";
import {
  TerritorioFormShell,
  FormInput,
  toast,
} from "./TerritorioFormShell";

export function AsignarResidentes({
  open,
  onClose,
  comunidadId,
  comunidadNombre,
  tipo,
}: {
  open: boolean;
  onClose: () => void;
  comunidadId: string;
  comunidadNombre: string;
  tipo: TipoLugar;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, isLoading } = usePersonasParaAsignarTerritorio(comunidadId, open);
  const asignar = useAsignarPersonaATerritorio();

  const personas = data?.personas ?? [];
  const asignadosActualmente = personas.filter((p) => p.comunidad_id === comunidadId);

  const filtrados = personas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.dpi && p.dpi.includes(busqueda)) ||
      (p.email && p.email.toLowerCase().includes(busqueda.toLowerCase())),
  );

  const handleAsignar = async (profileId: string, targetComunidadId: string | null) => {
    const res = await asignar.mutateAsync({
      profile_id: profileId,
      comunidad_id: targetComunidadId,
    });
    if (res.success) {
      toast.success(
        targetComunidadId
          ? "Persona asignada al territorio."
          : "Persona desvinculada del territorio.",
      );
    } else {
      toast.error("No se pudo actualizar la asignación.");
    }
  };

  return (
    <TerritorioFormShell
      open={open}
      onClose={onClose}
      title={`Residentes — ${comunidadNombre}`}
      subtitle={`${TIPO_LABELS[tipo]} · ${asignadosActualmente.length} persona(s) asignada(s)`}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <FormInput
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, DPI o correo..."
            className="pl-9"
            autoFocus
          />
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-emerald-500" />
            <p className="mt-2 text-xs text-muted-foreground">Cargando personas…</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No se encontraron personas con ese criterio.
          </div>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {filtrados.map((p) => {
              const estaEnEstaComunidad = p.comunidad_id === comunidadId;
              const estaEnOtraComunidad =
                p.comunidad_id && p.comunidad_id !== comunidadId;

              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors",
                    estaEnEstaComunidad
                      ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border/60 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  )}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-foreground truncate">{p.nombre}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      {p.dpi && <span>DPI: {p.dpi}</span>}
                      {p.email && <span>{p.email}</span>}
                    </div>
                    {estaEnOtraComunidad && (
                      <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        📍 Asignado a: {p.comunidad_nombre ?? "Otro territorio"}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={asignar.isPending}
                    onClick={() =>
                      handleAsignar(p.id, estaEnEstaComunidad ? null : comunidadId)
                    }
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors",
                      estaEnEstaComunidad
                        ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-300"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700",
                    )}
                  >
                    {estaEnEstaComunidad ? (
                      <>
                        <UserMinus className="size-3" />
                        Quitar
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-3" />
                        {estaEnOtraComunidad ? "Mover aquí" : "Asignar"}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TerritorioFormShell>
  );
}
