"use client";

import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ActComudeConParticipantes } from "./lib/zod";


interface ActividadesItemProps {
  actividad: ActComudeConParticipantes;
  userId?: string | null;
  puedeGestionar: boolean;
}

function formatFecha(fechaStr: string) {
  const fecha = new Date(fechaStr);
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const diaName = dias[fecha.getDay()];
  const d = fecha.getDate().toString().padStart(2, "0");
  const m = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const y = fecha.getFullYear().toString().slice(-2);
  let hours = fecha.getHours();
  const minutes = fecha.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${diaName} ${d}/${m}/${y} | ${hours}:${minutes} ${ampm}`;
}

function esHoy(fechaStr: string) {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

function diasRestantes(fechaStr: string) {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ActividadesItem({
  actividad,
  userId,
  puedeGestionar,
}: ActividadesItemProps) {
  const hoy = esHoy(actividad.fecha);
  const dias = diasRestantes(actividad.fecha);
  const totalParticipantes = actividad.act_comude_participantes?.length ?? 0;
  const encargados = actividad.act_comude_participantes?.filter((p) => p.encargado).length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-white/70 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden",
        hoy
          ? "border-azul-trifinio/40 ring-1 ring-azul-trifinio/20"
          : "border-white/30 dark:border-white/10"
      )}
    >
      <Link
        href={`/siget/comude/${actividad.id}`}
        className="w-full group flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors focus:outline-none text-left"
      >
        <div className="flex-1 min-w-0">
          {/* Fecha como pill y badges de estado */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <div className="bg-muted/80 dark:bg-muted/30 rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground w-fit shadow-sm">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatFecha(actividad.fecha)}
            </div>
            {hoy && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-azul-trifinio text-white px-2 py-0.5 rounded-full">
                Hoy
              </span>
            )}
            {!hoy && dias > 0 && (
              <span className="text-[10px] font-semibold text-muted-foreground">
                En {dias} día{dias !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Nombre */}
          <p className="font-bold text-azul-trifinio dark:text-white truncate uppercase">
            {actividad.nombre}
          </p>

          {/* Convocados */}
          {totalParticipantes > 0 && (
            <div className="mt-1 flex items-center">
              <span className="text-[10px] font-semibold text-muted-foreground">
                {totalParticipantes} convocado{totalParticipantes !== 1 ? "s" : ""}{encargados > 0 ? `, ${encargados} encargado${encargados !== 1 ? "s" : ""}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-azul-trifinio transition-colors" />
      </Link>
    </motion.div>
  );
}
