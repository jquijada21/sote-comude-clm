"use client";

import { UserRound, X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PersonaResidente, TipoLugar } from "../lib/zod";
import { TIPO_LABELS } from "../lib/zod";

const TIPO_COLORS: Record<
  TipoLugar,
  { text: string; bg: string; border: string; icon: string }
> = {
  microrregion: {
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-400/40",
    icon: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  aldea: {
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-400/40",
    icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  caserio: {
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-400/40",
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

interface VerMiembrosModalProps {
  open: boolean;
  onClose: () => void;
  nombre: string;
  tipo: TipoLugar;
  residentes: PersonaResidente[];
}

export function VerMiembrosModal({
  open,
  onClose,
  nombre,
  tipo,
  residentes,
}: VerMiembrosModalProps) {
  const colors = TIPO_COLORS[tipo];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl rounded-2xl border border-border/60 bg-background shadow-2xl">
              {/* Header */}
              <div
                className={cn(
                  "flex items-center gap-3 rounded-t-2xl border-b border-border/50 px-5 py-4",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    colors.icon,
                  )}
                >
                  <Users className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      colors.text,
                    )}
                  >
                    {TIPO_LABELS[tipo]}
                  </p>
                  <p className="truncate text-base font-black text-foreground">
                    {nombre}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                {residentes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                    <Users className="size-8 opacity-40" />
                    <p className="text-sm font-medium">Sin miembros asignados</p>
                    <p className="text-xs opacity-70">
                      No hay personas registradas en esta comunidad.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-xs font-bold text-muted-foreground">
                      {residentes.length} miembro
                      {residentes.length !== 1 ? "s" : ""} asignado
                      {residentes.length !== 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {residentes.map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                            colors.border,
                            colors.bg,
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-current/20",
                              colors.icon,
                            )}
                          >
                            <UserRound className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-foreground">
                              {r.nombre}
                            </p>
                            {r.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {r.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
