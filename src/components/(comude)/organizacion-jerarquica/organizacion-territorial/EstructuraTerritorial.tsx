"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Layers,
  TreePine,
  Home,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  MapPin,
  RefreshCw,
  Users,
  UserPlus,
  UserMinus,
  Search,
  ListTree,
  Network,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useEstructuraTerritorial,
  useCrearComunidad,
  useEditarComunidad,
  useEliminarComunidad,
  usePersonasParaAsignarTerritorio,
  useAsignarPersonaATerritorio,
} from "./lib/hooks";
import {
  TIPO_LABELS,
  TIPOS_HIJOS,
  type NodoTerritorial,
  type TipoLugar,
  type ComunidadFormValues,
} from "./lib/zod";
import {
  ModalShell,
  ModalLabel,
  ModalInput,
  ModalFooter,
  ModalSubmit,
  ModalConfirmDelete,
  modalActionMessage,
} from "@/components/ui/general-modal";
import { OrganigramaTerritorialGrafico } from "./OrganigramaTerritorialGrafico";
import { exportTerritorialToPng, exportTerritorialToPdf } from "./lib/export";

// ─── Colores por tipo ─────────────────────────────────────────────────────────

const TIPO_STYLES: Record<
  TipoLugar,
  { icon: typeof Layers; border: string; bg: string; text: string; badge: string; dot: string }
> = {
  microrregion: {
    icon: Layers,
    border: "border-blue-400/40 dark:border-blue-500/30",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  aldea: {
    icon: TreePine,
    border: "border-emerald-400/40 dark:border-emerald-500/30",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  caserio: {
    icon: Home,
    border: "border-amber-400/40 dark:border-amber-500/30",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

// ─── Modal de crear/editar ───────────────────────────────────────────────────

function ComunidadModal({
  open,
  onClose,
  tipo,
  parentId,
  editando,
}: {
  open: boolean;
  onClose: () => void;
  tipo: TipoLugar;
  parentId: string | null;
  editando?: { id: string; nombre: string } | null;
}) {
  const [nombre, setNombre] = useState(editando?.nombre ?? "");
  const crear = useCrearComunidad();
  const editar = useEditarComunidad();
  const guardando = crear.isPending || editar.isPending;

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNombre(e.target.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.warn("Escribe un nombre válido.");
      return;
    }

    const values: ComunidadFormValues = {
      nombre: nombre.trim(),
      tipo,
      parent_id: parentId,
    };

    if (editando) {
      const res = await editar.mutateAsync({ id: editando.id, values });
      if (res.success) {
        toast.success("Lugar actualizado.");
        onClose();
      } else {
        toast.error(modalActionMessage(res.error ?? undefined, "No se pudo actualizar."));
      }
    } else {
      const res = await crear.mutateAsync(values);
      if (res.success) {
        toast.success(`${TIPO_LABELS[tipo]} creado.`);
        onClose();
      } else {
        toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
      }
    }
  };

  const styles = TIPO_STYLES[tipo];
  const Icon = styles.icon;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={editando ? `Editar ${TIPO_LABELS[tipo]}` : `Nueva ${TIPO_LABELS[tipo]}`}
      subtitle={
        editando
          ? `Cambia el nombre de "${editando.nombre}"`
          : parentId
          ? `Dentro de un nivel superior`
          : "Nivel raíz del municipio"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
              styles.badge,
            )}
          >
            <Icon className="size-3" />
            {TIPO_LABELS[tipo]}
          </span>
        </div>

        <div className="grid gap-1.5">
          <ModalLabel htmlFor="nombre-lugar">Nombre</ModalLabel>
          <ModalInput
            id="nombre-lugar"
            value={nombre}
            onChange={handleNombreChange}
            placeholder={`Ej: ${tipo === "microrregion" ? "Microrregión Norte" : tipo === "aldea" ? "Aldea Las Flores" : "Caserío El Río"}`}
            autoFocus
          />
        </div>

        <ModalFooter>
          <ModalSubmit disabled={guardando}>
            {guardando ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
          </ModalSubmit>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}

// ─── Modal de Asignar Personas al Territorio ──────────────────────────────────

function AsignarPersonasTerritorioModal({
  open,
  onClose,
  nodo,
}: {
  open: boolean;
  onClose: () => void;
  nodo: NodoTerritorial;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, isLoading } = usePersonasParaAsignarTerritorio(nodo.id, open);
  const asignar = useAsignarPersonaATerritorio();

  const personas = data?.personas ?? [];
  const asignadosActualmente = personas.filter((p) => p.comunidad_id === nodo.id);

  const filtrados = personas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.dpi && p.dpi.includes(busqueda)) ||
      (p.email && p.email.toLowerCase().includes(busqueda.toLowerCase())),
  );

  const handleAsignar = async (profileId: string, comunidadId: string | null) => {
    const res = await asignar.mutateAsync({
      profile_id: profileId,
      comunidad_id: comunidadId,
    });
    if (res.success) {
      toast.success(
        comunidadId
          ? "Persona asignada al territorio."
          : "Persona desvinculada del territorio.",
      );
    } else {
      toast.error("No se pudo actualizar la asignación.");
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={`Residentes / Personas — ${nodo.nombre}`}
      subtitle={`${TIPO_LABELS[nodo.tipo]} · ${asignadosActualmente.length} persona(s) asignada(s)`}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <ModalInput
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, DPI o correo..."
            className="pl-9"
            autoFocus
          />
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-emerald-500" />
            <p className="mt-2 text-xs text-muted-foreground">Cargando personas…</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No se encontraron personas con ese criterio.
          </div>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {filtrados.map((p) => {
              const estaEnEstaComunidad = p.comunidad_id === nodo.id;
              const estaEnOtraComunidad =
                p.comunidad_id && p.comunidad_id !== nodo.id;

              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors",
                    estaEnEstaComunidad
                      ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border/60 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  )}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-foreground truncate">{p.nombre}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      {p.dpi && <span>DPI: {p.dpi}</span>}
                      {p.email && <span>{p.email}</span>}
                    </div>
                    {estaEnOtraComunidad && (
                      <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        📍 Asignado a: {p.comunidad_nombre ?? "Otro territorio"}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={asignar.isPending}
                    onClick={() =>
                      handleAsignar(p.id, estaEnEstaComunidad ? null : nodo.id)
                    }
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors",
                      estaEnEstaComunidad
                        ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-300"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700",
                    )}
                  >
                    {estaEnEstaComunidad ? (
                      <>
                        <UserMinus className="size-3" />
                        Quitar
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-3" />
                        {estaEnOtraComunidad ? "Mover aquí" : "Asignar"}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Menu Exportar ────────────────────────────────────────────────────────────

function ExportMenu({ elementId }: { elementId: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExportPng = async () => {
    setExporting(true);
    try {
      await exportTerritorialToPng(elementId);
      toast.success("Imagen PNG exportada.");
    } catch {
      toast.error("No se pudo exportar la imagen.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportTerritorialToPdf(elementId);
      toast.success("Documento PDF exportado.");
    } catch {
      toast.error("No se pudo exportar el PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={exporting}
        onClick={handleExportPng}
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-card px-3 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
      >
        {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
        PNG
      </button>
      <button
        type="button"
        disabled={exporting}
        onClick={handleExportPdf}
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-card px-3 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
      >
        {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
        PDF
      </button>
    </div>
  );
}

// ─── Nodo del árbol ──────────────────────────────────────────────────────────

function NodoTerritorialCard({
  nodo,
  depth = 0,
}: {
  nodo: NodoTerritorial;
  depth?: number;
}) {
  const [expandido, setExpandido] = useState(true);
  const [modalCrear, setModalCrear] = useState<TipoLugar | null>(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalPersonas, setModalPersonas] = useState(false);

  const eliminar = useEliminarComunidad();
  const styles = TIPO_STYLES[nodo.tipo];
  const Icon = styles.icon;
  const tieneHijos = nodo.hijos.length > 0;
  const tipoHijo = TIPOS_HIJOS[nodo.tipo];

  const handleEliminar = async () => {
    const res = await eliminar.mutateAsync(nodo.id);
    if (res.success) {
      toast.success("Eliminado correctamente.");
      setModalEliminar(false);
    } else {
      toast.error(
        res.error === "HAS_CHILDREN"
          ? "No se puede eliminar: tiene lugares dependientes."
          : modalActionMessage(res.error ?? undefined, "No se pudo eliminar."),
      );
      setModalEliminar(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group flex items-center gap-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
          styles.border,
        )}
      >
        <div className={cn("h-full w-1 shrink-0 self-stretch", styles.dot)} />

        {tieneHijos ? (
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className={cn(
              "flex h-full min-h-11 w-10 shrink-0 cursor-pointer items-center justify-center transition-colors",
              styles.bg,
              styles.text,
              "hover:brightness-95",
            )}
            title={expandido ? "Colapsar" : "Expandir"}
          >
            {expandido ? (
              <ChevronDown className="size-3.5" strokeWidth={2.5} />
            ) : (
              <ChevronRight className="size-3.5" strokeWidth={2.5} />
            )}
          </button>
        ) : (
          <div className="w-10 shrink-0" />
        )}

        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg",
              styles.bg,
              styles.text,
            )}
          >
            <Icon className="size-3.5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-foreground">
                {nodo.nombre}
              </p>
              {nodo.personas_count > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Users className="size-2.5" />
                  {nodo.personas_count}
                </span>
              )}
            </div>
            <p className={cn("text-[10px] font-semibold uppercase tracking-wider", styles.text)}>
              {TIPO_LABELS[nodo.tipo]}
              {tieneHijos && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  · {nodo.hijos.length}{" "}
                  {nodo.hijos.length === 1
                    ? TIPO_LABELS[TIPOS_HIJOS[nodo.tipo] ?? nodo.tipo]
                    : (TIPO_LABELS[TIPOS_HIJOS[nodo.tipo] ?? nodo.tipo] + "s")}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-stretch divide-x divide-border/40 border-l border-border/40 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Gestionar Personas / Residentes"
            onClick={() => setModalPersonas(true)}
            className="flex size-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <Users className="size-3.5" strokeWidth={2.5} />
          </button>

          {tipoHijo && (
            <button
              type="button"
              title={`Agregar ${TIPO_LABELS[tipoHijo]}`}
              onClick={() => setModalCrear(tipoHijo)}
              className="flex size-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
            </button>
          )}

          <button
            type="button"
            title="Editar"
            onClick={() => setModalEditar(true)}
            className="flex size-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Pencil className="size-3.5" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            title="Eliminar"
            onClick={() => setModalEliminar(true)}
            className="flex size-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {tieneHijos && expandido && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "mt-1.5 ml-3 space-y-1.5 border-l-2 pl-3",
              styles.border,
            )}
          >
            {nodo.hijos.map((hijo) => (
              <NodoTerritorialCard key={hijo.id} nodo={hijo} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {modalCrear && (
        <ComunidadModal
          open={true}
          onClose={() => setModalCrear(null)}
          tipo={modalCrear}
          parentId={nodo.id}
        />
      )}

      <ComunidadModal
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        tipo={nodo.tipo}
        parentId={nodo.id}
        editando={{ id: nodo.id, nombre: nodo.nombre }}
      />

      {modalPersonas && (
        <AsignarPersonasTerritorioModal
          open={true}
          onClose={() => setModalPersonas(false)}
          nodo={nodo}
        />
      )}

      <ModalConfirmDelete
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        onConfirm={handleEliminar}
        title={`¿Eliminar ${TIPO_LABELS[nodo.tipo]}?`}
        description={
          tieneHijos
            ? `"${nodo.nombre}" tiene ${nodo.hijos.length} lugar(es) dependiente(s). Debes eliminarlos primero.`
            : `Se eliminará "${nodo.nombre}" permanentemente.`
        }
        loading={eliminar.isPending}
      />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function EstructuraTerritorial() {
  const { data, isLoading, isError, refetch } = useEstructuraTerritorial();
  const [modalCrearRaiz, setModalCrearRaiz] = useState(false);
  const [vistaGrafica, setVistaGrafica] = useState(false);

  const raices = data?.data ?? [];
  const municipioId = data?.municipioId;

  const totalNodos = useCallback(() => {
    let count = 0;
    function contar(nodos: NodoTerritorial[]) {
      for (const n of nodos) {
        count++;
        contar(n.hijos);
      }
    }
    contar(raices);
    return count;
  }, [raices]);

  if (isLoading) {
    return (
      <div className="px-4 md:px-0">
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <Loader2 className="mx-auto size-8 animate-spin text-emerald-500" />
          <p className="mt-3 text-sm text-muted-foreground">
            Cargando estructura territorial…
          </p>
        </div>
      </div>
    );
  }

  if (isError || data?.error === "NO_MUNICIPIO") {
    return (
      <div className="px-4 md:px-0">
        <div className="rounded-2xl border border-red-200/50 bg-red-50/50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <AlertCircle className="mx-auto size-8 text-red-500" />
          <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
            {data?.error === "NO_MUNICIPIO"
              ? "No hay un municipio asociado a tu cuenta. Configura el municipio en Ajustes."
              : "No se pudo cargar la estructura territorial."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-100 px-4 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
          >
            <RefreshCw className="size-3.5" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-0 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Estructura Territorial
          </p>
          <h2 className="text-lg font-black tracking-tight text-foreground md:text-xl">
            Mapa Geográfico del Municipio
          </h2>
          {municipioId && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              Municipio ID: {municipioId} · {totalNodos()} lugares registrados
            </p>
          )}
        </div>

        {/* Acciones principales: Selector de Vista + Exportar + Nueva Microrregión */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternar Vista */}
          <div className="flex items-center rounded-xl border border-border/60 bg-card p-1">
            <button
              type="button"
              onClick={() => setVistaGrafica(false)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                !vistaGrafica
                  ? "bg-emerald-600 text-white dark:bg-emerald-700"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ListTree className="size-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setVistaGrafica(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                vistaGrafica
                  ? "bg-emerald-600 text-white dark:bg-emerald-700"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="size-3.5" />
              Diagrama D3
            </button>
          </div>

          {/* Menú Exportar */}
          {raices.length > 0 && (
            <ExportMenu
              elementId={vistaGrafica ? "territorial-d3-canvas" : "territorial-list-container"}
            />
          )}

          {/* Nueva Microrregión */}
          <button
            type="button"
            id="btn-nueva-microrregion"
            onClick={() => setModalCrearRaiz(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
            Nueva Microrregión
          </button>
        </div>
      </div>

      {/* Contenido según la vista seleccionada */}
      {raices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Layers className="mx-auto size-10 text-emerald-500/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aún no hay microrregiones registradas.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Comienza creando la primera microrregión del municipio.
          </p>
          <button
            type="button"
            onClick={() => setModalCrearRaiz(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
            Crear primera Microrregión
          </button>
        </div>
      ) : vistaGrafica ? (
        <OrganigramaTerritorialGrafico nodos={raices} />
      ) : (
        <div id="territorial-list-container" className="space-y-2 p-1">
          {raices.map((nodo) => (
            <NodoTerritorialCard key={nodo.id} nodo={nodo} />
          ))}
        </div>
      )}

      {/* Modal crear microrregión raíz */}
      <ComunidadModal
        open={modalCrearRaiz}
        onClose={() => setModalCrearRaiz(false)}
        tipo="microrregion"
        parentId={null}
      />
    </div>
  );
}
