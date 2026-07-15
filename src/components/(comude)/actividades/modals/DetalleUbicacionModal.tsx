"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin } from "lucide-react";
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
  const hasEntrada = !!registroEntrada;
  const hasSalida = !!registroSalida;
  
  const [activeTab, setActiveTab] = useState<"entrada" | "salida">(hasEntrada ? "entrada" : "salida");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveTab(hasEntrada ? "entrada" : "salida");
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, hasEntrada]);

  if (!mounted || !isOpen) return null;

  const activeRegistro = activeTab === "entrada" ? registroEntrada : registroSalida;
  
  let mapUrl = "";
  if (activeRegistro) {
    const ubi = (activeRegistro as any).ubicacion;
    if (ubi?.lat && ubi?.lng) {
      mapUrl = `https://maps.google.com/maps?q=${ubi.lat},${ubi.lng}&t=k&z=18&ie=UTF8&iwloc=&output=embed`;
    }
  }

  // Get common date from active record or any available
  const referenceRecord = activeRegistro || registroEntrada || registroSalida;
  let fechaFormateada = "";
  if (referenceRecord) {
    const d = new Date(referenceRecord.created_at);
    fechaFormateada = d.toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  const renderCard = (registro: ActComudeRegistro | null, tipo: "entrada" | "salida") => {
    if (!registro) return null;
    const isActive = activeTab === tipo;
    
    const fechaObj = new Date(registro.created_at);
    const horaFormateada = fechaObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const hasLocation = !!(registro as any).ubicacion?.lat;
    
    return (
      <div 
        onClick={() => setActiveTab(tipo)}
        className={`p-4 rounded-xl cursor-pointer transition-all border ${
          isActive 
            ? "border-blue-600/50 bg-[#1c2128]/80" 
            : "border-transparent bg-[#1e1e1e]/60 hover:bg-[#252525]"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <h4 className={`font-bold text-base capitalize ${isActive ? "text-blue-400" : "text-white"}`}>{tipo}</h4>
          <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-1 rounded-md">{horaFormateada}</span>
        </div>
        
        {registro.notas && (
          <p className="text-[13px] text-gray-300 mt-2 mb-2">
            <span className="text-gray-400">{tipo === "entrada" ? "Entrada Tarde" : "Nota de Salida"}:</span> {registro.notas}
          </p>
        )}

        <div className={`flex items-center gap-2 mt-3 text-xs ${isActive ? "text-gray-400" : "text-gray-500"}`}>
          <MapPin size={14} />
          <span>{hasLocation ? "Ubicación registrada" : "Sin ubicación GPS"}</span>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex flex-col md:flex-row bg-[#111] animate-in fade-in duration-200">
      
      {/* MAP BACKGROUND (PC) / TOP MAP (MOBILE) */}
      <div className="absolute inset-0 z-0 hidden md:block bg-neutral-900">
        {mapUrl ? (
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Ubicación no disponible
          </div>
        )}
      </div>

      {/* SIDEBAR (PC) / TOP HALF (MOBILE) */}
      <div className="relative z-10 w-full md:w-[400px] flex flex-col bg-[#111111] md:bg-[#111111]/95 md:backdrop-blur-xl border-r border-neutral-800/80 shadow-2xl shrink-0">
        
        {/* Sidebar Info */}
        <div className="relative px-5 pt-12 pb-5 md:py-5 border-b border-neutral-800/60">
          {/* Header mobile (Close button) */}
          <button onClick={onClose} className="md:hidden absolute top-12 right-5 p-1.5 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>

          <p className="text-blue-500 font-bold text-[11px] tracking-wider uppercase mb-1.5">
            Asistencia
          </p>
          <h2 className="text-lg md:text-xl font-bold text-white leading-tight mb-0.5 pr-8">
            {participanteNombre}
          </h2>
          <p className="text-xs text-gray-400 capitalize">
            {fechaFormateada}
          </p>
        </div>

        {/* Cards List */}
        <div className="px-4 py-5 space-y-3">
          {hasEntrada && renderCard(registroEntrada, "entrada")}
          {hasSalida && renderCard(registroSalida, "salida")}
          
          {!hasEntrada && !hasSalida && (
            <p className="text-center text-gray-500 text-sm mt-10">
              No hay registros disponibles.
            </p>
          )}
        </div>
      </div>

      {/* Mobile Map View (fills remaining space) */}
      <div className="md:hidden flex-1 relative w-full bg-neutral-900 border-t border-neutral-800">
        {mapUrl ? (
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 bg-neutral-900">
            Ubicación no disponible
          </div>
        )}
      </div>

      {/* CLOSE BUTTON (PC) */}
      <button 
        onClick={onClose} 
        className="hidden md:flex absolute top-6 right-6 z-20 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10"
      >
        <X size={24} />
      </button>

    </div>
  );

  return createPortal(modalContent, document.body);
}
