"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Layers,
  TreePine,
  Home,
  Users,
  Plus,
  Pencil,
  Trash2,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodoTerritorial, TipoLugar } from "./lib/zod";
import { TIPO_LABELS, TIPOS_HIJOS } from "./lib/zod";
import {
  OrgActionButton,
  type TerritorialAdminHandlers,
} from "./lib/org-actions";
import { VerMiembrosModal } from "./modals/VerMiembrosModal";

export type { TerritorialAdminHandlers };

const ACCORDION_EASE = [0.33, 1, 0.68, 1] as const;

function contarMiembrosTotal(nodo: NodoTerritorial): number {
  const directos = nodo.residentes?.length ?? 0;
  return directos + nodo.hijos.reduce((acc, h) => acc + contarMiembrosTotal(h), 0);
}

const TIPO_STYLES: Record<
  TipoLugar,
  { icon: typeof Layers; border: string; bg: string; text: string; dot: string }
> = {
  microrregion: {
    icon: Layers,
    border: "border-blue-400/40 dark:border-blue-500/30",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  aldea: {
    icon: TreePine,
    border: "border-emerald-400/40 dark:border-emerald-500/30",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  caserio: {
    icon: Home,
    border: "border-amber-400/40 dark:border-amber-500/30",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

type ExpansionContextValue = {
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  allExpanded: boolean;
  setAllExpanded: (expanded: boolean) => void;
};

const ExpansionContext = createContext<ExpansionContextValue | null>(null);

function collectExpandableIds(nodos: NodoTerritorial[]): string[] {
  const ids: string[] = [];
  for (const n of nodos) {
    if (n.hijos && n.hijos.length > 0) {
      ids.push(n.id);
      ids.push(...collectExpandableIds(n.hijos));
    }
  }
  return ids;
}

function ExpansionProvider({
  nodos,
  children,
}: {
  nodos: NodoTerritorial[];
  children: ReactNode;
}) {
  const expandableIds = useMemo(() => collectExpandableIds(nodos), [nodos]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(expandableIds),
  );

  useEffect(() => {
    setExpandedIds(new Set(expandableIds));
  }, [expandableIds]);

  const isExpanded = useCallback((id: string) => expandedIds.has(id), [expandedIds]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allExpanded =
    expandableIds.length > 0 &&
    expandableIds.every((id) => expandedIds.has(id));

  const setAllExpanded = useCallback(
    (expanded: boolean) => {
      setExpandedIds(expanded ? new Set(expandableIds) : new Set());
    },
    [expandableIds],
  );

  return (
    <ExpansionContext.Provider
      value={{ isExpanded, toggle, allExpanded, setAllExpanded }}
    >
      {children}
    </ExpansionContext.Provider>
  );
}

function useExpansion() {
  const ctx = useContext(ExpansionContext);
  if (!ctx) throw new Error("useExpansion debe usarse dentro de ExpansionProvider");
  return ctx;
}

export function ToolbarExpansionTerritorial() {
  const { allExpanded, setAllExpanded } = useExpansion();

  return (
    <button
      type="button"
      onClick={() => setAllExpanded(!allExpanded)}
      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {allExpanded ? (
        <>
          <ChevronsUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Colapsar todo</span>
        </>
      ) : (
        <>
          <ChevronsDown className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Expandir todo</span>
        </>
      )}
    </button>
  );
}

function RowAccionesNode({
  nodo,
  adminHandlers,
}: {
  nodo: NodoTerritorial;
  adminHandlers?: TerritorialAdminHandlers;
}) {
  if (!adminHandlers) return null;
  const tipoHijo = TIPOS_HIJOS[nodo.tipo];

  return (
    <div className="flex shrink-0 self-stretch items-stretch divide-x divide-emerald-500/30 overflow-visible border-l border-emerald-500/30">
      {tipoHijo && (
        <OrgActionButton
          label={`Agregar ${TIPO_LABELS[tipoHijo]}`}
          onClick={() => adminHandlers.onAddComunidad(nodo.id, tipoHijo)}
        >
          <Plus className="size-4" strokeWidth={2.25} />
        </OrgActionButton>
      )}

      <OrgActionButton
        label="Gestionar Residentes"
        onClick={() => adminHandlers.onAsignarResidentes(nodo.id)}
      >
        <Users className="size-4" strokeWidth={2.25} />
      </OrgActionButton>

      <OrgActionButton
        label="Editar"
        onClick={() => adminHandlers.onEditComunidad(nodo.id, nodo.nombre, nodo.tipo)}
      >
        <Pencil className="size-4" strokeWidth={2.25} />
      </OrgActionButton>

      <OrgActionButton
        label="Eliminar"
        onClick={() =>
          adminHandlers.onDeleteComunidad(
            nodo.id,
            nodo.nombre,
            nodo.tipo,
            nodo.hijos.length > 0,
          )
        }
      >
        <Trash2 className="size-4 text-red-500" strokeWidth={2.25} />
      </OrgActionButton>
    </div>
  );
}

function NodoItem({
  nodo,
  adminHandlers,
  depth = 0,
}: {
  nodo: NodoTerritorial;
  adminHandlers?: TerritorialAdminHandlers;
  depth?: number;
}) {
  const { isExpanded, toggle } = useExpansion();
  const tieneHijos = nodo.hijos.length > 0;
  const expanded = isExpanded(nodo.id);
  const styles = TIPO_STYLES[nodo.tipo];
  const Icon = styles.icon;
  const tieneResidentes = nodo.residentes && nodo.residentes.length > 0;
  const [modalOpen, setModalOpen] = useState(false);
  const miembrosDirectos = nodo.residentes?.length ?? 0;
  const totalMiembros = contarMiembrosTotal(nodo);
  const tieneHijosConMiembros = tieneHijos && totalMiembros > miembrosDirectos;

  const onChevronClick = (e: MouseEvent) => {
    e.stopPropagation();
    toggle(nodo.id);
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "group/node relative flex min-w-0 items-stretch overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md",
          styles.border,
        )}
      >
        {/* Toggle Expandir */}
        {tieneHijos ? (
          <button
            type="button"
            onClick={onChevronClick}
            className={cn(
              "flex h-full min-h-12 w-11 shrink-0 cursor-pointer items-center justify-center transition-colors hover:bg-emerald-500/10",
              styles.text,
            )}
            title={expanded ? "Colapsar" : "Expandir"}
          >
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.25, ease: ACCORDION_EASE }}
            >
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </motion.div>
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Info del Nodo */}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-3 pl-1">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                styles.bg,
                styles.text,
              )}
            >
              <Icon className="size-4" strokeWidth={2.25} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-foreground">
                  {nodo.nombre}
                </p>
                {totalMiembros > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Users className="size-2.5" />
                    {miembrosDirectos > 0 && tieneHijosConMiembros
                      ? `${miembrosDirectos} miembros · ${totalMiembros} total`
                      : miembrosDirectos > 0
                        ? `${miembrosDirectos} miembros`
                        : `${totalMiembros} miembros en total`}
                  </span>
                )}
              </div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", styles.text)}>
                {TIPO_LABELS[nodo.tipo]}
                {tieneHijos && (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    · {nodo.hijos.length}{" "}
                    {nodo.hijos.length === 1
                      ? TIPO_LABELS[TIPOS_HIJOS[nodo.tipo] ?? nodo.tipo]
                      : TIPO_LABELS[TIPOS_HIJOS[nodo.tipo] ?? nodo.tipo] + "s"}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Botón Ver Miembros */}
          {tieneResidentes && (
            <div className="mt-2.5 ml-12 border-t border-border/40 pt-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors",
                  styles.border,
                  styles.text,
                  "hover:opacity-80",
                )}
              >
                <Users className="size-3.5" />
                Ver miembros ({miembrosDirectos})
              </button>
            </div>
          )}

          {/* Modal Ver Miembros */}
          <VerMiembrosModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            nombre={nodo.nombre}
            tipo={nodo.tipo}
            residentes={nodo.residentes}
          />
        </div>

        {/* Acciones del Nodo */}
        <RowAccionesNode nodo={nodo} adminHandlers={adminHandlers} />
      </div>

      {/* Nodos Hijos Anidados */}
      <AnimatePresence initial={false}>
        {tieneHijos && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: ACCORDION_EASE }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 border-l-2 border-emerald-500/20 pl-3 md:pl-5">
              {nodo.hijos.map((hijo) => (
                <NodoItem
                  key={hijo.id}
                  nodo={hijo}
                  adminHandlers={adminHandlers}
                  depth={depth + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OrganizacionTerritorialTree({
  nodos,
  municipioNombre,
  adminHandlers,
}: {
  nodos: NodoTerritorial[];
  municipioNombre?: string;
  adminHandlers?: TerritorialAdminHandlers;
}) {
  return (
    <ExpansionProvider nodos={nodos}>
      <div className="space-y-4">
        {/* Contenedor principal de la estructura */}
        <div className="rounded-3xl border border-border/60 bg-zinc-100 p-4 shadow-sm md:p-6 lg:p-8 dark:bg-zinc-800">
          {/* Card Raíz del Municipio */}
          <div className="mb-4 overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4 shadow-sm dark:bg-emerald-950/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Municipio
                  </p>
                  <h3 className="text-base font-black text-foreground md:text-lg">
                    {municipioNombre ?? "Estructura Territorial del Municipio"}
                  </h3>
                </div>
              </div>

              {adminHandlers && (
                <button
                  type="button"
                  onClick={() => adminHandlers.onAddComunidad(null, "microrregion")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  <Plus className="size-3.5" />
                  Nueva Microrregión
                </button>
              )}
            </div>
          </div>

          {/* Lista de Microrregiones */}
          {nodos.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-muted-foreground">
              No hay microrregiones registradas. Crea la primera con el botón de arriba.
            </div>
          ) : (
            <div className="space-y-2">
              {nodos.map((nodo) => (
                <NodoItem
                  key={nodo.id}
                  nodo={nodo}
                  adminHandlers={adminHandlers}
                />
              ))}
            </div>
          )}
        </div>

        {/* Toolbar de expansión incorporado dentro del provider */}
        {nodos.length > 0 && (
          <div className="flex items-center justify-between">
            <ToolbarExpansionTerritorial />
          </div>
        )}
      </div>
    </ExpansionProvider>
  );
}
