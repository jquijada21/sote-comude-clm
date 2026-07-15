"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Loader2, CalendarDays, ListChecks, Users } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useCrearActividad, useEditarActividad } from "../lib/hooks";
import { AgendaItem, CrearActividadValues, ActComudeConParticipantes } from "../lib/zod";
import { useUsers } from "@/components/(base)/(users)/usuarios/lib/hooks";
import { toast } from "react-toastify";

interface CrearComudeProps {
  isOpen: boolean;
  onClose: () => void;
  actorRole: string;
  actividad?: ActComudeConParticipantes;
}

type ParticipanteSeleccionado = {
  usuario_id: string;
  nombre: string;
  encargado: boolean;
};

const TABS = [
  { id: "info", label: "Información", icon: CalendarDays },
  { id: "agenda", label: "Agenda", icon: ListChecks },
  { id: "participantes", label: "Participantes", icon: Users },
] as const;
type Tab = typeof TABS[number]["id"];

export default function CrearComude({ isOpen, onClose, actorRole, actividad }: CrearComudeProps) {
  const [tab, setTab] = useState<Tab>("info");
  const [nombre, setNombre] = useState(actividad?.nombre || "");
  // Fecha from ISO to YYYY-MM-DDTHH:MM format for datetime-local
  const parseInitialDate = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const [fecha, setFecha] = useState(parseInitialDate(actividad?.fecha));
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(actividad?.agenda || []);
  const [nuevoItem, setNuevoItem] = useState("");
  const [participantes, setParticipantes] = useState<ParticipanteSeleccionado[]>(
    actividad?.act_comude_participantes.map(p => ({
      usuario_id: p.usuario_id,
      nombre: p.profiles?.nombre || "Sin nombre",
      encargado: p.encargado
    })) || []
  );
  const [busqueda, setBusqueda] = useState("");
  const [mounted, setMounted] = useState(false);

  const { mutateAsync: crear, isPending: isCreando } = useCrearActividad();
  const { mutateAsync: editar, isPending: isEditando } = useEditarActividad();
  const isPending = isCreando || isEditando;
  const isEditMode = !!actividad;

  const { data: usuarios } = useUsers(actorRole);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && actividad) {
      setNombre(actividad.nombre);
      setFecha(parseInitialDate(actividad.fecha));
      setAgendaItems(actividad.agenda || []);
      setParticipantes(
        actividad.act_comude_participantes.map(p => ({
          usuario_id: p.usuario_id,
          nombre: p.profiles?.nombre || "Sin nombre",
          encargado: p.encargado
        }))
      );
    }
  }, [isOpen, actividad]);

  // Bloquear scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const resetForm = () => {
    if (!isEditMode) {
      setNombre("");
      setFecha("");
      setAgendaItems([]);
      setNuevoItem("");
      setParticipantes([]);
    }
    setBusqueda("");
    setTab("info");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Agenda
  const addAgendaItem = () => {
    const trimmed = nuevoItem.trim();
    if (!trimmed) return;
    setAgendaItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), titulo: trimmed, completado: false },
    ]);
    setNuevoItem("");
  };

  const removeAgendaItem = (id: string) => {
    setAgendaItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Participantes
  const toggleParticipante = (usuario: { id: string; nombre: string | null }) => {
    const existe = participantes.find((p) => p.usuario_id === usuario.id);
    if (existe) {
      setParticipantes((prev) => prev.filter((p) => p.usuario_id !== usuario.id));
    } else {
      setParticipantes((prev) => [
        ...prev,
        { usuario_id: usuario.id, nombre: usuario.nombre ?? "Sin nombre", encargado: false },
      ]);
    }
  };

  const toggleEncargado = (usuario_id: string) => {
    setParticipantes((prev) =>
      prev.map((p) =>
        p.usuario_id === usuario_id ? { ...p, encargado: !p.encargado } : p
      )
    );
  };

  const usuariosFiltrados = (usuarios ?? []).filter((u) =>
    (u.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); setTab("info"); return; }
    if (!fecha) { toast.error("La fecha es obligatoria"); setTab("info"); return; }
    if (participantes.length === 0) { toast.error("Agrega al menos un participante"); setTab("participantes"); return; }

    const values: CrearActividadValues = {
      nombre: nombre.trim(),
      fecha,
      agenda: agendaItems,
      participantes: participantes.map((p) => ({ usuario_id: p.usuario_id, encargado: p.encargado })),
    };

    try {
      if (isEditMode) {
        await editar({ id: actividad.id, values });
        toast.success("✅ Actividad actualizada exitosamente");
      } else {
        await crear(values);
        toast.success("✅ Actividad COMUDE creada exitosamente");
      }
      handleClose();
    } catch (err) {
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} la actividad. Intenta de nuevo.`);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="crear-comude-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-[100dvh] sm:h-auto sm:max-w-4xl bg-white dark:bg-zinc-900 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[88vh]"
            style={{ 
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
              <div>
                <h2 className="font-black text-azul-trifinio dark:text-white text-xl sm:text-2xl">
                  {isEditMode ? "Editar Actividad COMUDE" : "Nueva Actividad COMUDE"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEditMode ? "Modifica los detalles de la actividad" : "Completa los tres pasos para crear la actividad"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex justify-center sm:justify-start border-b border-border/50 px-2 sm:px-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-2 text-sm py-3.5 px-3 sm:px-4 border-b-2 -mb-px font-semibold transition-colors flex-none",
                    tab === id
                      ? "border-azul-trifinio text-azul-trifinio"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {tab === "info" && (
                <>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Nombre de la actividad *</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: COMUDE Ordinario Julio 2025"
                      className="w-full rounded-xl border border-border px-4 py-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-azul-trifinio/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Fecha y hora *</label>
                    <input
                      type="datetime-local"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full rounded-xl border border-border px-4 py-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-azul-trifinio/30"
                    />
                  </div>
                </>
              )}

              {tab === "agenda" && (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevoItem}
                      onChange={(e) => setNuevoItem(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addAgendaItem()}
                      placeholder="Añadir punto de agenda..."
                      className="flex-1 rounded-xl border border-border px-4 py-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-azul-trifinio/30"
                    />
                    <button
                      onClick={addAgendaItem}
                      className="p-3 rounded-xl bg-azul-trifinio text-white hover:bg-azul-trifinio/90 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {agendaItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <ListChecks className="w-10 h-10 mb-3 opacity-25" />
                      <p className="text-sm">No hay puntos de agenda.</p>
                      <p className="text-xs mt-1 opacity-70">La agenda es opcional.</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {agendaItems.map((item, idx) => (
                        <li key={item.id} className="flex items-center gap-3 text-sm bg-muted/40 rounded-xl px-4 py-3">
                          <span className="text-muted-foreground w-6 shrink-0 font-bold">{idx + 1}.</span>
                          <span className="flex-1">{item.titulo}</span>
                          <button onClick={() => removeAgendaItem(item.id)} className="text-destructive hover:opacity-70 transition-opacity p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {tab === "participantes" && (
                <>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar usuario..."
                    className="w-full rounded-xl border border-border px-4 py-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-azul-trifinio/30"
                  />

                  {participantes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seleccionados ({participantes.length})</p>
                      {participantes.map((p) => (
                        <div key={p.usuario_id} className="flex items-center justify-between text-sm bg-azul-trifinio/5 border border-azul-trifinio/20 rounded-xl px-4 py-3">
                          <span className="font-semibold">{p.nombre}</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={p.encargado}
                                onChange={() => toggleEncargado(p.usuario_id)}
                                className="w-4 h-4 accent-azul-trifinio"
                              />
                              Encargado
                            </label>
                            <button onClick={() => toggleParticipante({ id: p.usuario_id, nombre: p.nombre })} className="p-1">
                              <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1 max-h-60 overflow-y-auto rounded-xl border border-border/50">
                    {usuariosFiltrados.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">No se encontraron usuarios.</p>
                    )}
                    {usuariosFiltrados.map((u) => {
                      const seleccionado = participantes.some((p) => p.usuario_id === u.id);
                      if (seleccionado) return null;
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleParticipante(u)}
                          className="w-full flex items-center justify-between text-sm px-4 py-3 hover:bg-muted/60 transition-colors text-left"
                        >
                          <span className="font-medium">{u.nombre ?? "Sin nombre"}</span>
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-border/50 flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {TABS.map(({ id }) => (
                  <div key={id} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", tab === id ? "bg-azul-trifinio scale-110" : "bg-muted")} />
                ))}
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl bg-azul-trifinio text-white hover:bg-azul-trifinio/90 disabled:opacity-60 transition-colors"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? (isEditMode ? "Guardando..." : "Creando...") : (isEditMode ? "Guardar Cambios" : "Crear COMUDE")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
