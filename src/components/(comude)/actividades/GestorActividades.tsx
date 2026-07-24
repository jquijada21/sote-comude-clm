"use client";

import { useState } from "react";
import { CalendarDays, Plus, BookUser } from "lucide-react";
import { isSuperOrAdminRole } from "@/components/(base)/dashboard/modules";
import ListActividades from "./ListActividades";
import CrearComude from "./modals/CrearComude";
import DirectorioContactosModal from "./modals/DirectorioContactosModal";

interface GestorActividadesProps {
  userId?: string | null;
  effectiveRole: string;
}

export default function GestorActividades({ userId, effectiveRole }: GestorActividadesProps) {
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalContactosOpen, setModalContactosOpen] = useState(false);
  const puedeGestionar = isSuperOrAdminRole(effectiveRole);

  return (
    <section className="w-full">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-azul-trifinio shrink-0" />
          <h3 className="font-bold text-base text-azul-trifinio dark:text-white">
            Actividades COMUDE
          </h3>
        </div>
        <div className="flex items-center self-center sm:self-auto gap-2 w-full sm:w-auto mt-1 sm:mt-0">
          {/* Botón Contactos — visible para todos los roles */}
          <button
            onClick={() => setModalContactosOpen(true)}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold border border-emerald-500 text-emerald-500 bg-transparent px-4 py-2 rounded-xl hover:bg-emerald-500/20 transition-colors w-full sm:w-auto"
          >
            <BookUser className="w-4 h-4" />
            Contactos
          </button>

          {/* Botón Nuevo COMUDE — solo para admin/super */}
          {puedeGestionar && (
            <button
              onClick={() => setModalCrearOpen(true)}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold border border-azul-trifinio text-azul-trifinio bg-transparent px-4 py-2 rounded-xl hover:bg-azul-trifinio/20 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 hidden sm:block" />
              Nuevo COMUDE
            </button>
          )}
        </div>
      </div>

      <ListActividades 
        userId={userId}
        puedeGestionar={puedeGestionar}
        onCrearClick={() => setModalCrearOpen(true)}
      />

      {/* Modal de creación */}
      <CrearComude
        isOpen={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        actorRole={effectiveRole}
      />

      {/* Modal de directorio de contactos */}
      <DirectorioContactosModal
        isOpen={modalContactosOpen}
        onClose={() => setModalContactosOpen(false)}
        effectiveRole={effectiveRole}
        userId={userId}
      />
    </section>
  );
}
