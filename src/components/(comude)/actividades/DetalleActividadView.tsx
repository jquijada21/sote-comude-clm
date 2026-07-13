"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  CalendarDays,
  Users,
  UserCheck,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Check,
  Loader2,
  Shield,
  Plus,
  Pencil,
  Trash2,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActComudeConParticipantes, ActComudeRegistro } from "./lib/zod";
import { useRegistrarAsistencia, useRegistrosAsistencia, useActualizarAgenda, useEliminarActividad } from "./lib/hooks";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import DetalleUbicacionModal from "./modals/DetalleUbicacionModal";
import CrearComude from "./modals/CrearComude";
import JustificacionAsistenciaModal from "./modals/JustificacionAsistenciaModal";
import { useGlobalSettings } from "@/components/(base)/(settings)/global/hooks";

interface DetalleActividadViewProps {
  actividad: ActComudeConParticipantes | null;
  userId?: string | null;
  effectiveRole?: string;
  puedeGestionar: boolean;
  onClose?: () => void;
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

function formatHora(isoStr: string) {
  const fecha = new Date(isoStr);
  let h = fecha.getHours();
  const m = fecha.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function calcDuracion(entrada: string, salida: string) {
  const diff = (new Date(salida).getTime() - new Date(entrada).getTime()) / 1000 / 60;
  if (diff < 0) return "--";
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return `${h}h ${m}m`;
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

interface ParticipanteRowProps {
  participante: ActComudeConParticipantes["act_comude_participantes"][0];
  registros: ActComudeRegistro[];
  userId?: string | null;
  esActividadHoy: boolean;
  puedeGestionar: boolean;
  onRegistrar: (tipo: "entrada" | "salida") => void;
  onVerMapa: () => void;
  cargandoGPS: boolean;
  isMuyTemprano?: boolean;
}

function ParticipanteRow({
  participante,
  registros,
  userId,
  esActividadHoy,
  puedeGestionar,
  onRegistrar,
  onVerMapa,
  cargandoGPS,
  isMuyTemprano,
}: ParticipanteRowProps) {
  const regEntrada = registros.find(
    (r) => r.usuario_id === participante.usuario_id && r.tipo_registro === "entrada"
  );
  const regSalida = registros.find(
    (r) => r.usuario_id === participante.usuario_id && r.tipo_registro === "salida"
  );

  const esElUsuario = userId === participante.usuario_id;
  const confirmado = !!regEntrada;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/40 border border-border/40">
      {/* Info de la persona */}
      <div className="flex items-start gap-3 min-w-0">

        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {participante.profiles?.nombre ?? "Sin nombre"}
          </p>
        </div>
      </div>

      {/* Tiempos de asistencia */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-1 sm:mt-0 gap-2 sm:gap-6">
        <div className="flex gap-4 sm:gap-6 text-xs text-muted-foreground">
          {(!regEntrada && !regSalida) ? (
            <span className="text-muted-foreground/70 italic sm:mr-4">Sin registros de asistencia</span>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                <span className="font-semibold mb-0.5 sm:mb-0">Entrada:</span>
                <span className="font-mono text-[13px] font-medium text-foreground">{regEntrada ? formatHora(regEntrada.created_at) : "--:--"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                <span className="font-semibold mb-0.5 sm:mb-0">Salida:</span>
                <span className="font-mono text-[13px] font-medium text-foreground">{regSalida ? formatHora(regSalida.created_at) : "--:--"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 text-azul-trifinio">
                <span className="font-semibold mb-0.5 sm:mb-0">Duración:</span>
                <span className="font-mono text-[13px] font-medium">
                  {regEntrada && regSalida ? calcDuracion(regEntrada.created_at, regSalida.created_at) : "--h --m"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Enlace de ubicación al gestor */}
        {puedeGestionar && (regEntrada || regSalida) && (
          <button
            onClick={onVerMapa}
            title="Ver ubicación"
            className="text-azul-trifinio flex items-center justify-center bg-azul-trifinio/10 hover:bg-azul-trifinio/20 p-2.5 rounded-xl transition-colors ml-auto sm:ml-0 shrink-0"
          >
            <MapPin className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Botones para el propio usuario */}
      {esElUsuario && (!regEntrada || !regSalida) && (
        <div className="w-full sm:w-auto shrink-0 flex justify-center mt-2 sm:mt-0">
          {!regEntrada ? (
            <button
              onClick={() => onRegistrar("entrada")}
              disabled={cargandoGPS || isMuyTemprano}
              className={`flex justify-center items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors w-full sm:w-auto ${
                isMuyTemprano
                  ? "bg-gray-400 dark:bg-neutral-600 cursor-not-allowed"
                  : "bg-azul-trifinio hover:bg-azul-trifinio/90 disabled:opacity-60"
              }`}
            >
              {cargandoGPS ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <LogIn className="w-3.5 h-3.5 shrink-0" />}
              {cargandoGPS ? "Obteniendo ubicación..." : "Marcar Entrada"}
            </button>
          ) : (
            <button
              onClick={() => onRegistrar("salida")}
              disabled={cargandoGPS}
              className="flex justify-center items-center gap-1.5 text-xs font-semibold bg-orange-600 text-white px-4 py-2 sm:py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-60 transition-colors w-full sm:w-auto"
            >
              {cargandoGPS ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <LogOut className="w-3.5 h-3.5 shrink-0" />}
              {cargandoGPS ? "Obteniendo ubicación..." : "Marcar Salida"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DetalleActividadView({
  actividad,
  userId,
  effectiveRole,
  puedeGestionar,
  onClose,
}: DetalleActividadViewProps) {
  const [mounted, setMounted] = useState(false);
  const [cargandoGPS, setCargandoGPS] = useState(false);
  const [nuevoPunto, setNuevoPunto] = useState("");
  const [editandoPuntoId, setEditandoPuntoId] = useState<string | null>(null);
  const [textoEdicion, setTextoEdicion] = useState("");
  const [participanteMapa, setParticipanteMapa] = useState<{ nombre: string; entrada: ActComudeRegistro | null; salida: ActComudeRegistro | null } | null>(null);
  const [activeTab, setActiveTab] = useState<"agenda" | "participantes">("agenda");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isOpen = !!actividad;
  
  // Estado para la justificación de asistencia tardía
  const { data: globalSettings } = useGlobalSettings();
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [pendingTipoRegistro, setPendingTipoRegistro] = useState<"entrada" | "salida" | null>(null);

  // Estado optimista para la agenda para respuesta inmediata
  const [optimisticAgenda, setOptimisticAgenda] = useState(actividad?.agenda || []);

  const { mutateAsync: registrar } = useRegistrarAsistencia();
  const { mutateAsync: eliminarActividad } = useEliminarActividad();
  const { data: registros = [] } = useRegistrosAsistencia(actividad?.id ?? null);
  const { mutateAsync: actualizarAgenda, isPending: isUpdatingAgenda } = useActualizarAgenda();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setMounted(true); }, []);

  // Sincronizar agenda local con los props del servidor
  useEffect(() => {
    setOptimisticAgenda(actividad?.agenda || []);
  }, [actividad?.agenda]);

  const ejecutarRegistro = async (tipo: "entrada" | "salida", notas?: string) => {
    if (!userId || !actividad) return;
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    setCargandoGPS(true);
    try {
      const posicion = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      await registrar({
        act_comude_id: actividad.id,
        tipo_registro: tipo,
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
        accuracy: posicion.coords.accuracy,
        notas,
      });
      toast.success(tipo === "entrada" ? "✅ Entrada registrada" : "👋 Salida registrada");
      setShowJustificationModal(false);
      setPendingTipoRegistro(null);
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) toast.error("Se necesita permiso de ubicación.");
        else if (err.code === err.TIMEOUT) toast.error("No se pudo obtener la ubicación.");
        else toast.error("Error al obtener ubicación GPS.");
      } else {
        toast.error(err instanceof Error ? err.message : "Error al registrar asistencia.");
      }
    } finally {
      setCargandoGPS(false);
    }
  };

  const handleRegistrar = async (tipo: "entrada" | "salida") => {
    if (!actividad || !globalSettings) return;
    
    const ahora = new Date().getTime();
    const horaProgramada = new Date(actividad.fecha).getTime();
    const minAntes = globalSettings.minutos_antes_permitidos * 60000;
    const minDespues = globalSettings.minutos_despues_permitidos * 60000;

    if (ahora < horaProgramada - minAntes) {
      toast.error(`Es muy temprano para marcar asistencia. Podrás hacerlo ${globalSettings.minutos_antes_permitidos} minutos antes del inicio.`);
      return;
    }

    if (ahora > horaProgramada + minDespues) {
      setPendingTipoRegistro(tipo);
      setShowJustificationModal(true);
      return;
    }

    await ejecutarRegistro(tipo);
  };

  const handleToggleAgenda = async (itemId: string) => {
    if (!puedeGestionar || !actividad) return;
    
    // Optimistic Update
    const prevAgenda = optimisticAgenda;
    const nuevaAgenda = optimisticAgenda.map((item) =>
      item.id === itemId ? { ...item, completado: !item.completado } : item
    );
    setOptimisticAgenda(nuevaAgenda);

    try {
      await actualizarAgenda({ id: actividad.id, agenda: nuevaAgenda });
    } catch (error) {
      // Revert if error
      setOptimisticAgenda(prevAgenda);
      toast.error("Error al actualizar la agenda");
    }
  };

  const handleAgregarPunto = async () => {
    if (!nuevoPunto.trim() || !actividad || isUpdatingAgenda) return;
    const nuevo = { id: crypto.randomUUID(), titulo: nuevoPunto.trim(), completado: false };
    
    const prevAgenda = optimisticAgenda;
    const nuevaAgenda = [...optimisticAgenda, nuevo];
    setOptimisticAgenda(nuevaAgenda);
    setNuevoPunto("");

    try {
      await actualizarAgenda({ id: actividad.id, agenda: nuevaAgenda });
    } catch (error) {
      setOptimisticAgenda(prevAgenda);
      setNuevoPunto(nuevo.titulo);
      toast.error("Error al agregar el punto de agenda");
    }
  };

  const handleGuardarEdicion = async (itemId: string) => {
    if (!textoEdicion.trim() || !actividad || isUpdatingAgenda) return;
    
    const prevAgenda = optimisticAgenda;
    const nuevaAgenda = optimisticAgenda.map((item) =>
      item.id === itemId ? { ...item, titulo: textoEdicion.trim() } : item
    );
    setOptimisticAgenda(nuevaAgenda);
    setEditandoPuntoId(null);
    setTextoEdicion("");

    try {
      await actualizarAgenda({ id: actividad.id, agenda: nuevaAgenda });
    } catch (error) {
      setOptimisticAgenda(prevAgenda);
      toast.error("Error al editar el punto de agenda");
    }
  };

  const handleEliminarPunto = async (itemId: string) => {
    if (!actividad || isUpdatingAgenda) return;
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará este punto de la agenda. ¡Esta acción no se puede deshacer!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const prevAgenda = optimisticAgenda;
      const nuevaAgenda = optimisticAgenda.filter((item) => item.id !== itemId);
      setOptimisticAgenda(nuevaAgenda);
      
      try {
        await actualizarAgenda({ id: actividad.id, agenda: nuevaAgenda });
        toast.success("Punto eliminado");
      } catch (error) {
        setOptimisticAgenda(prevAgenda);
        toast.error("Error al eliminar el punto de agenda");
      }
    }
  };

  const handleEliminarActividad = async () => {
    if (!actividad) return;

    const result = await Swal.fire({
      title: '¿Eliminar COMUDE?',
      text: `Se eliminará permanentemente la actividad "${actividad.nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await eliminarActividad(actividad.id);
        toast.success("Actividad COMUDE eliminada");
        if (onClose) onClose();
      } catch (error) {
        toast.error("Error al eliminar la actividad");
      }
    }
  };

  if (!mounted || !actividad) return null;

  const hoy = esHoy(actividad.fecha);
  const isMuyTemprano = globalSettings 
    ? Date.now() < new Date(actividad.fecha).getTime() - (globalSettings.minutos_antes_permitidos * 60000)
    : false;
  const encargados = actividad.act_comude_participantes.filter((p) => p.encargado);
  const integrantes = actividad.act_comude_participantes.filter((p) => !p.encargado);
  const participanteYo = actividad.act_comude_participantes.find((p) => p.usuario_id === userId);

  const content = (
    <div className="w-full flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-border/50 shrink-0">
        <div className="flex items-start gap-4">
          <button
            onClick={onClose}
            className="mt-1 p-2 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-azul-trifinio dark:text-white uppercase">
              {actividad.nombre}
            </h2>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <div className="bg-muted/80 dark:bg-muted/30 rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatFecha(actividad.fecha)}
              </div>
              {hoy && (
                <span className="text-[10px] font-bold uppercase tracking-widest bg-azul-trifinio text-white px-2 py-0.5 rounded-full">
                  Hoy
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones de gestión */}
        {puedeGestionar && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 bg-muted/30 hover:bg-azul-trifinio/10 text-muted-foreground hover:text-azul-trifinio rounded-xl transition-colors"
              title="Editar actividad"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleEliminarActividad}
              className="p-2 bg-muted/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
              title="Eliminar actividad"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-center sm:justify-start px-4 sm:px-6 border-b border-border/50 bg-muted/10">
        <button
          onClick={() => setActiveTab("agenda")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm",
            activeTab === "agenda" 
              ? "border-azul-trifinio text-azul-trifinio bg-white dark:bg-black/20" 
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <ListTodo className="w-4 h-4" />
          Agenda
        </button>
        <button
          onClick={() => setActiveTab("participantes")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm",
            activeTab === "participantes" 
              ? "border-azul-trifinio text-azul-trifinio bg-white dark:bg-black/20" 
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <Users className="w-4 h-4" />
          Participantes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 sm:pb-8">
        
        {activeTab === "agenda" && (
          <div className="px-6 py-4">
            
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Agenda
            </p>
            
            {optimisticAgenda && optimisticAgenda.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {optimisticAgenda.map((item, idx) => (
                  <li key={item.id} className="flex items-start gap-2.5 text-sm group">
                    <button
                      onClick={() => handleToggleAgenda(item.id)}
                      disabled={!puedeGestionar}
                      className={cn(
                        "mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-200 shadow-sm",
                        item.completado
                          ? "bg-green-500 border-green-500 text-white shadow-green-500/30"
                          : "border-muted-foreground/30 hover:border-azul-trifinio text-transparent hover:shadow-azul-trifinio/20",
                        !isUpdatingAgenda && "hover:scale-110 active:scale-90"
                      )}
                    >
                      <Check className={cn("w-3.5 h-3.5 transition-all duration-300", item.completado ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                    </button>
                    <span className="font-semibold text-muted-foreground/70 min-w-[14px]">
                      {idx + 1}.
                    </span>
                    
                    {editandoPuntoId === item.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={textoEdicion}
                          onChange={(e) => setTextoEdicion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleGuardarEdicion(item.id);
                            }
                            if (e.key === "Escape") {
                              setEditandoPuntoId(null);
                            }
                          }}
                          className="flex-1 bg-muted/40 border border-border/50 text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-azul-trifinio/50 focus:border-azul-trifinio"
                          autoFocus
                        />
                        <button
                          onClick={() => handleGuardarEdicion(item.id)}
                          disabled={!textoEdicion.trim() || isUpdatingAgenda}
                          className="text-xs bg-azul-trifinio text-white px-2 rounded font-medium hover:bg-azul-trifinio/90"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoPuntoId(null)}
                          className="text-xs bg-muted text-muted-foreground px-2 rounded hover:bg-muted/80"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <span 
                        onClick={() => puedeGestionar && handleToggleAgenda(item.id)}
                        className={cn(
                          "flex-1 transition-colors", 
                          puedeGestionar ? "cursor-pointer hover:text-foreground" : ""
                        )}
                      >
                        {item.titulo}
                      </span>
                    )}
                    {puedeGestionar && editandoPuntoId !== item.id && (
                      <div className="flex items-center gap-1 ml-auto shrink-0 transition-opacity">
                        <button
                          onClick={() => {
                            setEditandoPuntoId(item.id);
                            setTextoEdicion(item.titulo);
                          }}
                          className="p-1 text-muted-foreground hover:text-azul-trifinio hover:bg-azul-trifinio/10 rounded"
                          title="Editar punto"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminarPunto(item.id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                          title="Eliminar punto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mb-4 italic">No hay puntos de agenda.</p>
            )}

            {/* Agregar punto */}
            {puedeGestionar && (
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Añadir nuevo punto..."
                  value={nuevoPunto}
                  onChange={(e) => setNuevoPunto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAgregarPunto();
                    }
                  }}
                  className="flex-1 bg-muted/40 border border-border/50 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-azul-trifinio/20 focus:border-azul-trifinio"
                />
                <button
                  onClick={handleAgregarPunto}
                  disabled={!nuevoPunto.trim() || isUpdatingAgenda}
                  className="bg-azul-trifinio text-white px-3 py-2 rounded-lg font-semibold flex items-center justify-center hover:bg-azul-trifinio/90 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Control personal de asistencia */}
            {participanteYo && (
              <div className="mt-8 border-t border-border/50 pt-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Mi Asistencia
                </p>
                <ParticipanteRow
                  participante={participanteYo}
                  registros={registros}
                  userId={userId}
                  esActividadHoy={hoy}
                  puedeGestionar={puedeGestionar}
                  onRegistrar={handleRegistrar}
                  cargandoGPS={cargandoGPS}
                  onVerMapa={() => setParticipanteMapa({
                    nombre: participanteYo.profiles?.nombre || "Sin nombre",
                    entrada: registros.find(r => r.usuario_id === participanteYo.usuario_id && r.tipo_registro === "entrada") || null,
                    salida: registros.find(r => r.usuario_id === participanteYo.usuario_id && r.tipo_registro === "salida") || null
                  })}
                  isMuyTemprano={isMuyTemprano}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "participantes" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Encargados */}
          {encargados.length > 0 && (
            <div className="px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-azul-trifinio" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Encargados
                </p>
              </div>
              <div className="space-y-2">
                {encargados.map((p) => (
                  <ParticipanteRow
                    key={p.usuario_id}
                    participante={p}
                    registros={registros}
                    userId={userId}
                    esActividadHoy={hoy}
                    puedeGestionar={puedeGestionar}
                    onRegistrar={handleRegistrar}
                    cargandoGPS={cargandoGPS}
                    onVerMapa={() => setParticipanteMapa({
                      nombre: p.profiles?.nombre || "Sin nombre",
                      entrada: registros.find(r => r.usuario_id === p.usuario_id && r.tipo_registro === "entrada") || null,
                      salida: registros.find(r => r.usuario_id === p.usuario_id && r.tipo_registro === "salida") || null
                    })}
                    isMuyTemprano={isMuyTemprano}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Integrantes */}
          {integrantes.length > 0 && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Integrantes
                </p>
              </div>
              <div className="space-y-2">
                {integrantes.map((p) => (
                  <ParticipanteRow
                    key={p.usuario_id}
                    participante={p}
                    registros={registros}
                    userId={userId}
                    esActividadHoy={hoy}
                    puedeGestionar={puedeGestionar}
                    onRegistrar={handleRegistrar}
                    cargandoGPS={cargandoGPS}
                    onVerMapa={() => setParticipanteMapa({
                      nombre: p.profiles?.nombre || "Sin nombre",
                      entrada: registros.find(r => r.usuario_id === p.usuario_id && r.tipo_registro === "entrada") || null,
                      salida: registros.find(r => r.usuario_id === p.usuario_id && r.tipo_registro === "salida") || null
                    })}
                    isMuyTemprano={isMuyTemprano}
                  />
                ))}
              </div>
            </div>
          )}

          {actividad.act_comude_participantes.length === 0 && (
            <div className="px-6 py-10 text-center text-muted-foreground text-sm">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No hay miembros asignados a esta actividad.</p>
            </div>
          )}
          </div>
        )}
        </div>
      </div>
  );

  return (
    <>
      {content}
      {/* Modales extras */}
      <DetalleUbicacionModal
        isOpen={!!participanteMapa}
        onClose={() => setParticipanteMapa(null)}
        participanteNombre={participanteMapa?.nombre || ""}
        registroEntrada={participanteMapa?.entrada || null}
        registroSalida={participanteMapa?.salida || null}
      />

      {isEditModalOpen && effectiveRole && (
        <CrearComude
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          actorRole={effectiveRole}
          actividad={actividad}
        />
      )}

      {pendingTipoRegistro && (
        <JustificacionAsistenciaModal
          isOpen={showJustificationModal}
          onClose={() => {
            setShowJustificationModal(false);
            setPendingTipoRegistro(null);
          }}
          onConfirm={(justificacion) => ejecutarRegistro(pendingTipoRegistro, justificacion)}
          tipo={pendingTipoRegistro}
          horaRegistrada={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        />
      )}
    </>
  );
}
