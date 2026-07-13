"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const MESES = [
  "Ene", "Feb", "Mar",
  "Abr", "May", "Jun",
  "Jul", "Ago", "Sep",
  "Oct", "Nov", "Dic"
];

const MESES_COMPLETOS = [
  "Enero", "Febrero", "Marzo",
  "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre",
  "Octubre", "Noviembre", "Diciembre"
];

interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Actualizar viewYear si cambia el year prop y el popover está cerrado
  useEffect(() => {
    if (!isOpen) {
      setViewYear(year);
    }
  }, [year, isOpen]);

  const handlePrevMonth = () => {
    if (month === 0) {
      onChange(year - 1, 11);
    } else {
      onChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onChange(year + 1, 0);
    } else {
      onChange(year, month + 1);
    }
  };

  const selectMonth = (m: number) => {
    onChange(viewYear, m);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={popoverRef}>
      {/* Botón principal */}
      <div className="flex items-center justify-between bg-black/5 dark:bg-black/20 rounded-xl border border-border/50 w-full">
        <button
          onClick={handlePrevMonth}
          className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-l-xl transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          {MESES_COMPLETOS[month]} {year}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={handleNextMonth}
          className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-r-xl transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] bg-white dark:bg-zinc-900 border border-border/50 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-4"
          >
            {/* Header del Popover (Selector de Año) */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button
                onClick={() => setViewYear((y) => y - 1)}
                className="p-1 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-foreground dark:text-white font-bold text-base">{viewYear}</span>
              <button
                onClick={() => setViewYear((y) => y + 1)}
                className="p-1 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Meses */}
            <div className="grid grid-cols-3 gap-2">
              {MESES.map((mes, index) => {
                const isSelected = viewYear === year && index === month;
                return (
                  <button
                    key={index}
                    onClick={() => selectMonth(index)}
                    className={cn(
                      "py-2.5 text-sm font-semibold rounded-xl transition-all duration-200",
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                    )}
                  >
                    {mes}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
