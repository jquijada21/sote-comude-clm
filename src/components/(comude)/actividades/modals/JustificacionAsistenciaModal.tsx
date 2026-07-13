"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";

interface JustificacionAsistenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justificacion: string) => void;
  tipo: "entrada" | "salida";
  horaRegistrada: string;
}

export default function JustificacionAsistenciaModal({
  isOpen,
  onClose,
  onConfirm,
  tipo,
  horaRegistrada,
}: JustificacionAsistenciaModalProps) {
  const [justificacion, setJustificacion] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (justificacion.trim().length < 5) return;
    onConfirm(justificacion.trim());
    setJustificacion("");
  };

  const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#111111] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 flex flex-col scale-in-center p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-orange-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
          Justificación de {tipoCapitalizado} Tarde
        </h2>
        
        <p className="text-sm text-gray-500 mb-6">
          Está marcando {tipo} tarde ({horaRegistrada}). Justificación obligatoria.
        </p>

        <textarea
          className="w-full min-h-[100px] p-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-azul-trifinio resize-none mb-6 text-sm"
          placeholder="Escriba su justificación aquí (requerido)..."
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
        />

        <div className="flex gap-3 justify-center w-full">
          <button
            onClick={handleConfirm}
            disabled={justificacion.trim().length < 5}
            className="flex-1 bg-azul-trifinio text-white font-medium py-2.5 rounded-lg hover:bg-azul-trifinio/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sí, marcar {tipoCapitalizado}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 text-white font-medium py-2.5 rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
