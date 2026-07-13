"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, CalendarDays } from "lucide-react";
import { useActividades } from "./lib/hooks";
import ActividadesItem from "./ActividadesItem";
import MonthPicker from "./modals/MonthPicker";

interface ListActividadesProps {
  userId?: string | null;
  puedeGestionar: boolean;
  onCrearClick: () => void;
}

export default function ListActividades({ userId, puedeGestionar, onCrearClick }: ListActividadesProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [searchQuery, setSearchQuery] = useState("");

  const { data: actividades, isLoading, isError, refetch } = useActividades(year, month);

  const actividadesFiltradas = (actividades || []).filter((act) => 
    act.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-black/20 border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azul-trifinio/30 transition-all"
          />
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <MonthPicker
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </div>
      </div>

      {/* Estados de carga / error / vacío */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="text-center py-6 text-sm text-destructive">
          Error al cargar las actividades.
          <button onClick={() => refetch()} className="ml-1 underline">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && actividadesFiltradas.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground text-sm"
        >
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>
            {searchQuery 
              ? "No se encontraron actividades con esa búsqueda." 
              : "No hay actividades registradas en este mes."}
          </p>
          {puedeGestionar && (
            <button
              onClick={onCrearClick}
              className="mt-3 text-azul-trifinio font-semibold underline underline-offset-2 text-xs"
            >
              Crear primera actividad
            </button>
          )}
        </motion.div>
      )}

      {/* Lista */}
      {!isLoading && !isError && actividadesFiltradas.length > 0 && (
        <div className="space-y-2.5">
          {actividadesFiltradas.map((act) => (
            <ActividadesItem
              key={act.id}
              actividad={act}
              userId={userId}
              puedeGestionar={puedeGestionar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
