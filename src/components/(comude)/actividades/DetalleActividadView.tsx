"use client";

import { useEffect, useState, useRef } from "react";
import { compressImageFile, isAllowedImageType, generateStoragePath } from "@/components/(uploads)/imgs/constants";
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
  Eye,
  Upload,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActComudeConParticipantes, ActComudeRegistro } from "./lib/zod";
import { useRegistrarAsistencia, useRegistrosAsistencia, useActualizarAgenda, useEliminarActividad, useActualizarActa, useActualizarImagenesActividad } from "./lib/hooks";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import DetalleUbicacionModal from "./modals/DetalleUbicacionModal";
import CrearComude from "./modals/CrearComude";
import JustificacionAsistenciaModal from "./modals/JustificacionAsistenciaModal";
import { JustificacionRegistro, TipoRegistro } from "./lib/types";
import ImageUploader from "@/components/(uploads)/imgs/ImageUploader";
import { useStorageDisplayUrl } from "@/components/(uploads)/imgs/useStorageDisplayUrl";
import dynamic from "next/dynamic";

const ActaVisorModal = dynamic(() => import("./modals/ActaVisorModal"), { ssr: false });
import { useGlobalSettings } from "@/components/(base)/(settings)/global/hooks";
import { createClient } from "@/utils/supabase/client";

function StorageImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUrl() {
      if (!path) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase.storage.from("portada_imagenes").createSignedUrl(path, 3600 * 24);
      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
      setLoading(false);
    }
    fetchUrl();
  }, [path]);

  if (loading) return <div className="w-full h-full bg-muted animate-pulse rounded-lg" />;
  if (!url) return <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground"><ImagePlus className="w-6 h-6 opacity-30" /></div>;
  return <img src={url} alt="Evidencia" className="w-full h-full object-contain rounded-lg transition-transform duration-500" />;
}

function EvidenciaVisorModal({
  isOpen,
  onClose,
  paths,
  initialIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  paths: string[];
  initialIndex: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const path = paths[currentIndex];

  useEffect(() => {
    if (!isOpen || !path) return;
    setLoading(true);
    let active = true;
    async function fetchUrl() {
      const supabase = createClient();
      const { data } = await supabase.storage.from("portada_imagenes").createSignedUrl(path, 3600);
      if (active && data?.signedUrl) {
        setUrl(data.signedUrl);
      }
      if (active) setLoading(false);
    }
    fetchUrl();
    return () => { active = false; };
  }, [path, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="relative w-full h-[calc(100dvh-4rem)] sm:h-auto sm:max-h-[90dvh] sm:max-w-6xl flex flex-col bg-background rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <h3 className="text-foreground font-bold text-sm tracking-wider uppercase">Visor de Evidencia</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-black/5">
          {loading || !url ? (
            <Loader2 className="w-8 h-8 text-muted-foreground/40 animate-spin" />
          ) : (
            <img src={url} alt="Evidencia ampliada" className="max-w-full max-h-[70vh] sm:max-h-[75vh] object-contain rounded-lg shadow-xl" />
          )}
        </div>

        {paths.length > 1 && (
          <div className="flex items-center justify-center gap-8 p-4 border-t border-border/50 bg-muted/30">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((i) => (i - 1 + paths.length) % paths.length);
              }}
              className="p-3 rounded-full bg-background border border-border/50 text-foreground hover:bg-muted transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold text-muted-foreground tracking-widest">
              {currentIndex + 1} / {paths.length}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((i) => (i + 1) % paths.length);
              }}
              className="p-3 rounded-full bg-background border border-border/50 text-foreground hover:bg-muted transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl bg-muted/40 border border-border/40">
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
        <div className="flex justify-between sm:justify-center w-full sm:w-auto sm:gap-6 text-xs text-muted-foreground">
          {(!regEntrada && !regSalida) ? (
            <span className="text-muted-foreground/70 italic sm:mr-4">Sin registros de asistencia</span>
          ) : (
            <>
              <div className="flex flex-col items-center sm:flex-row sm:gap-1.5">
                <span className="font-semibold mb-0.5 sm:mb-0">Entrada:</span>
                <span className="font-mono text-[13px] font-medium text-foreground text-center">{regEntrada ? formatHora(regEntrada.created_at) : "--:--"}</span>
              </div>
              <div className="flex flex-col items-center sm:flex-row sm:gap-1.5">
                <span className="font-semibold mb-0.5 sm:mb-0">Salida:</span>
                <span className="font-mono text-[13px] font-medium text-foreground text-center">{regSalida ? formatHora(regSalida.created_at) : "--:--"}</span>
              </div>
              <div className="flex flex-col items-center sm:flex-row sm:gap-1.5 text-azul-trifinio">
                <span className="font-semibold mb-0.5 sm:mb-0">Duración:</span>
                <span className="font-mono text-[13px] font-medium text-center">
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
              className={`flex justify-center items-center gap-2 sm:gap-1.5 text-sm sm:text-xs font-semibold text-white px-4 py-4 sm:py-2 rounded-lg transition-colors w-full sm:w-auto ${
                isMuyTemprano
                  ? "bg-gray-400 dark:bg-neutral-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 disabled:opacity-60"
              }`}
            >
              {cargandoGPS ? <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin shrink-0" /> : <LogIn className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />}
              {cargandoGPS ? "Obteniendo ubicación..." : "Marcar Entrada"}
            </button>
          ) : (
            <button
              onClick={() => onRegistrar("salida")}
              disabled={cargandoGPS}
              className="flex justify-center items-center gap-2 sm:gap-1.5 text-sm sm:text-xs font-semibold bg-orange-600 text-white px-4 py-4 sm:py-2 rounded-lg hover:bg-orange-700 disabled:opacity-60 transition-colors w-full sm:w-auto"
            >
              {cargandoGPS ? <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin shrink-0" /> : <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />}
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
  const [participanteMapa, setParticipanteMapa] = useState<{
    nombre: string;
    entrada: ActComudeRegistro | null;
    salida: ActComudeRegistro | null;
  } | null>(null);
  
  const [evidenciaSelectedIndex, setEvidenciaSelectedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"agenda" | "participantes">("agenda");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActaVisorOpen, setIsActaVisorOpen] = useState(false);
  const [actaUrlToView, setActaUrlToView] = useState<string | null>(null);
  const [isGenerandoUrl, setIsGenerandoUrl] = useState(false);
  
  const isOpen = !!actividad;
  
  const puedeGestionarFotos = effectiveRole === "super" || effectiveRole === "admin";
  
  // Estado para la justificación de asistencia tardía
  const { data: globalSettings } = useGlobalSettings();
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [pendingTipoRegistro, setPendingTipoRegistro] = useState<"entrada" | "salida" | null>(null);
  const [isRegistroTarde, setIsRegistroTarde] = useState(false);
  const [horaMostrar, setHoraMostrar] = useState("");

  // Estado optimista para la agenda para respuesta inmediata
  const [optimisticAgenda, setOptimisticAgenda] = useState(actividad?.agenda || []);

  const { mutateAsync: registrar } = useRegistrarAsistencia();
  const { mutateAsync: eliminarActividad } = useEliminarActividad();
  const { data: registros = [] } = useRegistrosAsistencia(actividad?.id ?? null);
  const { mutateAsync: actualizarAgenda, isPending: isUpdatingAgenda } = useActualizarAgenda();
  const { mutateAsync: actualizarActa, isPending: isUploadingActa } = useActualizarActa();
  const { mutateAsync: actualizarImagenes, isPending: isUploadingImg } = useActualizarImagenesActividad();
  
  const handleCargarActa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !actividad) return;
    
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop() || 'pdf';
      const filePath = `${actividad.id}/acta_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("actas").upload(filePath, file);
      if (uploadError) throw uploadError;

      await actualizarActa({ id: actividad.id, actaUrl: filePath });
      toast.success("Acta cargada exitosamente");
    } catch (err) {
      toast.error("Error al cargar el acta");
    }
    // reset input
    e.target.value = '';
  };

  const handleEliminarActa = async () => {
    if (!actividad || !actividad.actas) return;

    const result = await Swal.fire({
      title: '¿Eliminar Acta?',
      text: "El archivo se borrará permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const supabase = createClient();
        
        // Si no es una URL pública, extraer la ruta (como se guarda ahora)
        let filePath = actividad.actas;
        if (filePath.startsWith('http')) {
          const parts = filePath.split('/');
          filePath = parts[parts.length - 1]; // Extraer solo el nombre de archivo
        }

        // Eliminar del bucket
        const { error: storageError } = await supabase.storage.from("actas").remove([filePath]);
        if (storageError) console.error("Error al borrar del bucket:", storageError);
        
        // Actualizar la base de datos a null
        try {
          await actualizarActa({ id: actividad.id, actaUrl: null });
          toast.success("Acta eliminada correctamente.");
          setIsActaVisorOpen(false);
          setActaUrlToView(null);
        } catch (err: unknown) {
          toast.error("Error al eliminar el acta.");
        }
      } catch (err) {
        toast.error("Error al eliminar el acta");
      }
    }
  };

  const handleSubirEvidencia = async (newPath: string) => {
    try {
      const currentImages = actividad.img || [];
      if (currentImages.length >= 4) {
        toast.error("Ya se han subido 4 imágenes.");
        return;
      }
      await actualizarImagenes({ id: actividad.id, imgPaths: [...currentImages, newPath] });
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleEliminarEvidencia = async (pathToRemove: string) => {
    try {
      const currentImages = actividad.img || [];
      const newImages = currentImages.filter(p => p !== pathToRemove);
      await actualizarImagenes({ id: actividad.id, imgPaths: newImages.length > 0 ? newImages : null });
      toast.success("Imagen eliminada de la actividad.");
    } catch (err: unknown) {
      toast.error("Error al quitar la imagen de la actividad.");
    }
  };

  const handleReemplazarEvidencia = async (oldPath: string, newPath: string) => {
    try {
      const currentImages = actividad.img || [];
      const newImages = currentImages.map(p => p === oldPath ? newPath : p);
      await actualizarImagenes({ id: actividad.id, imgPaths: newImages });
    } catch (err: unknown) {
      console.error(err);
      toast.error("Error al actualizar la base de datos.");
    }
  };

  const handleVerActa = async () => {
    if (!actividad || !actividad.actas) return;
    
    // Si ya es una URL completa antigua, la usamos directo aunque falle
    if (actividad.actas.startsWith("http")) {
      setActaUrlToView(actividad.actas);
      setIsActaVisorOpen(true);
      return;
    }

    setIsGenerandoUrl(true);
    try {
      const supabase = createClient();
      // Firmar la URL por 1 hora (3600 segundos)
      const { data, error } = await supabase.storage.from("actas").createSignedUrl(actividad.actas, 3600);
      if (error || !data) throw new Error();
      
      setActaUrlToView(data.signedUrl);
      setIsActaVisorOpen(true);
    } catch (err) {
      toast.error("Error al obtener acceso al archivo. ¿Verificaste si el bucket es correcto?");
    } finally {
      setIsGenerandoUrl(false);
    }
  };

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

    if (tipo === "entrada" && ahora < horaProgramada - minAntes) {
      toast.error(`Es muy temprano para marcar asistencia. Podrás hacerlo ${globalSettings.minutos_antes_permitidos} minutos antes del inicio.`);
      return;
    }

    const esTarde = tipo === "entrada" && ahora > horaProgramada + minDespues;
    setIsRegistroTarde(esTarde);
    
    if (esTarde) {
      const fechaLimite = new Date(horaProgramada + minDespues);
      setHoraMostrar(fechaLimite.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      const fechaActividad = new Date(horaProgramada);
      setHoraMostrar(fechaActividad.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    setPendingTipoRegistro(tipo);
    setShowJustificationModal(true);
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
      <div className="px-6 py-4 sm:py-5 border-b border-border/50 shrink-0">
        <div className="flex items-start justify-between">
          {/* Main info container */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 w-full">
            
            {/* Top bar on mobile (Back + Actions) / Back button on desktop */}
            <div className="flex items-center justify-between w-full sm:w-auto relative">
              <div className="flex items-center shrink-0 z-10">
                <button
                  onClick={onClose}
                  className="p-2 sm:mt-1 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
              </div>

              {/* Botón de Acta (Mobile Only, Centrado Absoluto) */}
              <div className="flex sm:hidden absolute inset-0 items-center justify-center pointer-events-none z-10">
                <div className="pointer-events-auto">
                  {actividad.actas ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleVerActa}
                        disabled={isGenerandoUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                      >
                        {isGenerandoUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Ver acta
                      </button>
                    </div>
                  ) : ((effectiveRole === "super" || effectiveRole === "admin") && (
                    <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold cursor-pointer shadow-md transition-all active:scale-95">
                      {isUploadingActa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Cargar acta
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleCargarActa} disabled={isUploadingActa} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Acciones de gestión (Mobile Only) */}
              <div className="flex sm:hidden items-center gap-2 shrink-0 z-10">
                {puedeGestionar && (
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-2 bg-muted/30 hover:bg-azul-trifinio/10 text-muted-foreground hover:text-azul-trifinio rounded-xl transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleEliminarActividad}
                      className="p-2 bg-muted/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Title & Meta */}
            <div className="w-full">
              <h2 className="text-lg sm:text-2xl leading-tight font-bold text-azul-trifinio dark:text-white uppercase pr-2 sm:pr-0">
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

          {/* Acciones y Acta (Desktop Only) */}
          <div className="hidden sm:flex flex-row items-center gap-3 shrink-0 ml-4 mt-1">
            {/* Botón de Acta (Primero) */}
            <div>
              {actividad.actas ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleVerActa}
                    disabled={isGenerandoUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isGenerandoUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    Ver acta
                  </button>
                </div>
              ) : ((effectiveRole === "super" || effectiveRole === "admin") && (
                <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold cursor-pointer shadow-md transition-all active:scale-95">
                  {isUploadingActa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Cargar acta
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleCargarActa} disabled={isUploadingActa} />
                </label>
              ))}
            </div>

            {/* Divisor vertical si hay botones de gestión */}
            {puedeGestionar && <div className="w-px h-6 bg-border/60 mx-1"></div>}

            {/* Acciones de gestión */}
            {puedeGestionar && (
              <div className="flex items-center gap-2">
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
        </div>
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
          <div className="px-3 sm:px-6 py-4">
            
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
            {/* Evidencia / Fotos */}
            <div className="mt-8 border-t border-border/50 pt-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Evidencia / Fotos
                </p>
                <span className="text-xs font-medium text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-md">
                  {(actividad.img?.length || 0)}/4
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {actividad.img?.map((path, idx) => (
                  <div key={idx} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-border/50 shadow-sm">
                    <button 
                      onClick={() => setEvidenciaSelectedIndex(idx)}
                      className="absolute inset-0 w-full h-full cursor-pointer z-0"
                    >
                      <StorageImage path={path} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                    {puedeGestionarFotos && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarEvidencia(path);
                        }}
                        className="absolute top-2 right-2 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer z-10"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {puedeGestionarFotos && (actividad.img?.length || 0) < 4 && (
                  <div className="relative aspect-[4/3]">
                    <ImageUploader
                      bucketName="portada_imagenes"
                      currentImagePath={null}
                      onUploadSuccess={handleSubirEvidencia}
                      onDeleteSuccess={() => {}}
                      disabled={isUploadingImg}
                      aspect={4/3}
                      aspectLabel="Horizontal 4:3"
                      maxSizeMB={0.2}
                      maxDimension={1920}
                      folderPath={actividad.id}
                      compact={true}
                      compactClassName="w-full h-full rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-azul-trifinio/50 transition-colors"
                    />
                  </div>
                )}
              </div>
              
              {!puedeGestionarFotos && (!actividad.img || actividad.img.length === 0) && (
                <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                  <ImagePlus className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  No hay evidencia fotográfica disponible.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "participantes" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Encargados */}
          {encargados.length > 0 && (
            <div className="px-3 sm:px-6 py-4 border-b border-border/30">
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
            <div className="px-3 sm:px-6 py-4">
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
            <div className="px-3 sm:px-6 py-10 text-center text-muted-foreground text-sm">
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

      {actividad.actas && actaUrlToView && (
        <ActaVisorModal
          isOpen={isActaVisorOpen}
          onClose={() => {
            setIsActaVisorOpen(false);
            setActaUrlToView(null);
          }}
          actividadNombre={actividad.nombre}
          actaUrl={actaUrlToView}
          puedeGestionar={effectiveRole === "super" || effectiveRole === "admin"}
          onEliminar={handleEliminarActa}
        />
      )}

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
          horaMostrar={horaMostrar}
          isTarde={isRegistroTarde}
        />
      )}

      <EvidenciaVisorModal 
        isOpen={evidenciaSelectedIndex !== null}
        paths={actividad?.img || []}
        initialIndex={evidenciaSelectedIndex ?? 0}
        onClose={() => setEvidenciaSelectedIndex(null)}
      />
    </>
  );
}
