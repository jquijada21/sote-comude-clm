"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Clock } from "lucide-react";
import { ActComudeRegistro } from "../lib/zod";

interface DetalleUbicacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  participanteNombre: string;
  registroEntrada: ActComudeRegistro | null;
  registroSalida: ActComudeRegistro | null;
}

export default function DetalleUbicacionModal({
  isOpen,
  onClose,
  participanteNombre,
  registroEntrada,
  registroSalida,
}: DetalleUbicacionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      const handleZoom = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };

      window.addEventListener("wheel", handleZoom, { passive: false });
      return () => {
        window.removeEventListener("wheel", handleZoom);
        document.body.style.overflow = "auto";
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const hasEntrada = !!registroEntrada;
  const hasSalida = !!registroSalida;

  const renderCard = (registro: ActComudeRegistro, tipo: "entrada" | "salida") => {
    const isEntrada = tipo === "entrada";
    const accentColor = isEntrada ? "green" : "orange";

    const fechaObj = new Date(registro.created_at);

    // Formato: mar, 27/mar/26
    const diaSem = fechaObj.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
    const dia = fechaObj.getDate().toString().padStart(2, "0");
    const mes = fechaObj.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
    const anio = fechaObj.getFullYear().toString().slice(-2);
    const fechaFormateada = `${diaSem}, ${dia}/${mes}/${anio}`;

    // Formato: 10:22 AM
    const horaFormateada = fechaObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const ubi = (registro as any).ubicacion;
    const latitud = ubi?.lat;
    const longitud = ubi?.lng;
    const hasLocation = latitud && longitud;

    return (
      <div
        className={`py-5 px-4 sm:p-5 flex flex-col h-full rounded-none sm:rounded-xl border-y sm:border border-x-0 sm:border-x border-${accentColor}-100 dark:border-${accentColor}-900/40 bg-${accentColor}-50/30 dark:bg-${accentColor}-900/10 relative overflow-hidden transition-all hover:shadow-lg`}
      >
        {/* Etiqueta Superior */}
        <div
          className={`absolute top-0 right-0 px-3 py-1 font-bold uppercase tracking-widest rounded-none sm:rounded-bl-xl text-[10px] z-10
          ${
            isEntrada
              ? "bg-green-100 text-green-900 dark:bg-green-200 dark:text-green-950"
              : "bg-orange-100 text-orange-900 dark:bg-orange-200 dark:text-orange-950"
          }`}
        >
          {isEntrada ? "Entrada" : "Salida"}
        </div>

        <div className="flex flex-col pt-2 relative flex-1">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm z-10">
            <Clock size={16} className={isEntrada ? "text-green-500" : "text-orange-500"} />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">
                Hora de registro
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-gray-900 dark:text-white leading-none">
                  {horaFormateada}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase leading-none">
                  - {fechaFormateada}
                </span>
              </div>
            </div>
          </div>

          {hasLocation ? (
            <>
              {/* MAPA EMBEBIDO */}
              <div className="-mx-4 sm:mx-0 mt-4 flex-1 min-h-[240px] rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-gray-200 dark:border-neutral-800 shadow-inner bg-gray-100 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-500" style={{ touchAction: "none" }}>
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "160px", pointerEvents: "auto" }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${latitud},${longitud}&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              </div>
            </>
          ) : (
            <div className="w-full mt-4 h-40 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-dashed border-gray-200 dark:border-neutral-800 flex items-center justify-center">
              <p className="text-xs text-gray-500 text-center px-4">
                Ubicación GPS no disponible
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-[5px] sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#111111] w-full max-w-6xl h-[calc(100dvh-max(env(safe-area-inset-top),_24px))] sm:h-auto max-h-[calc(100dvh-max(env(safe-area-inset-top),_24px))] sm:max-h-[95vh] rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 flex flex-col scale-in-center overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="sticky top-0 z-20 px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-inner">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-[#f4ebc3] tracking-tight">
                Detalles de Asistencia
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Asignado a: <span className="text-gray-700 dark:text-gray-300">{participanteNombre}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all active:scale-95"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div
          className={`px-0 sm:px-6 py-4 sm:py-6 grid gap-2 sm:gap-6 flex-1 ${
            hasEntrada && hasSalida ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:max-w-sm sm:mx-auto w-full"
          }`}
        >
          {hasEntrada && renderCard(registroEntrada, "entrada")}
          {hasSalida && renderCard(registroSalida, "salida")}

          {!hasEntrada && !hasSalida && (
            <div className="col-span-full py-10 text-center text-gray-500">
              No hay registros de ubicación.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
