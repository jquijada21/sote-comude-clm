"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Tree from "react-d3-tree";
import type { CustomNodeElementProps, RawNodeDatum } from "react-d3-tree";
import { AnimatePresence, motion } from "framer-motion";
import {
  Layers,
  TreePine,
  Home,
  Users,
  X,
  Eye,
  EyeOff,
  Clipboard,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPO_LABELS, type NodoTerritorial, type TipoLugar } from "./lib/zod";
import {
  OrganigramaExportMenu,
  organigramaExportIcons,
} from "../organizacion-jerarquica/OrganigramaExportMenu";
import {
  exportTerritorialToPng,
  exportTerritorialToPdf,
  copyTerritorialToClipboard,
} from "./lib/export";
import { toast } from "react-toastify";
import "../organizacion-jerarquica/organigrama.css";


const TIPO_STYLES: Record<
  TipoLugar,
  { icon: typeof Layers; border: string; bg: string; text: string; dot: string }
> = {
  microrregion: {
    icon: Layers,
    border: "border-blue-500/60 bg-zinc-100 dark:bg-zinc-800",
    bg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  aldea: {
    icon: TreePine,
    border: "border-emerald-500/60 bg-zinc-100 dark:bg-zinc-800",
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  caserio: {
    icon: Home,
    border: "border-amber-500/60 bg-zinc-100 dark:bg-zinc-800",
    bg: "bg-amber-100 dark:bg-amber-900/50",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

interface TerritorialNodeDatum extends RawNodeDatum {
  _customData: {
    id: string;
    tipo: TipoLugar | "raiz";
    personas_count: number;
  };
}

function convertToD3(nodo: NodoTerritorial): TerritorialNodeDatum {
  return {
    name: nodo.nombre,
    _customData: {
      id: nodo.id,
      tipo: nodo.tipo,
      personas_count: nodo.personas_count,
    },
    children: nodo.hijos.map(convertToD3),
  };
}

const LEYENDA_TERRITORIAL = [
  { tipo: "microrregion", color: "#3b82f6", label: "Microrregión", icon: Layers },
  { tipo: "aldea", color: "#10b981", label: "Aldea", icon: TreePine },
  { tipo: "caserio", color: "#f59e0b", label: "Caserío", icon: Home },
] as const;

export function OrganigramaTerritorialVertical({
  nodos,
  onClose,
  municipioNombre,
}: {
  nodos: NodoTerritorial[];
  onClose: () => void;
  municipioNombre?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [zoom, setZoom] = useState(0.8);
  const [translate, setTranslate] = useState({ x: 600, y: 120 });

  const stats = useMemo(() => {
    const counts = { microrregion: 0, aldea: 0, caserio: 0 };
    const traverse = (n: NodoTerritorial[]) => {
      n.forEach((nodo) => {
        if (nodo.tipo in counts) {
          counts[nodo.tipo as keyof typeof counts]++;
        }
        if (nodo.hijos) traverse(nodo.hijos);
      });
    };
    traverse(nodos);
    return counts;
  }, [nodos]);

  const treeData = useMemo<TerritorialNodeDatum>(() => {
    const totalPersonas = nodos.reduce((acc, n) => acc + n.personas_count, 0);
    return {
      name: municipioNombre ?? "Estructura Territorial",
      _customData: {
        id: "raiz-territorial",
        tipo: "raiz",
        personas_count: totalPersonas,
      },
      children: nodos.map(convertToD3),
    };
  }, [nodos, municipioNombre]);

  const handleCopiarImagen = async () => {
    try {
      await copyTerritorialToClipboard("territorial-d3-full-container");
      setCopiado(true);
      toast.success("Imagen copiada al portapapeles.");
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo copiar la imagen.";
      toast.error(message);
    }
  };

  const renderCustomNode = ({ nodeDatum, toggleNode }: CustomNodeElementProps) => {
    const data = (nodeDatum as unknown) as TerritorialNodeDatum;
    // Fallback to data itself if _customData is undefined (happens during Next.js Fast Refresh if useMemo isn't invalidated)
    const custom = data._customData || (data as any);
    const isRaiz = custom.tipo === "raiz";
    const tipo = isRaiz ? "microrregion" : (custom.tipo as TipoLugar);
    const styles = TIPO_STYLES[tipo];
    const cardW = 180;
    const cardH = 64;

    return (
      <g>
        <foreignObject
          width={cardW}
          height={cardH}
          x={-cardW / 2}
          y={-cardH / 2}
          style={{ overflow: "visible" }}
        >
          <div
            onClick={toggleNode}
            // @ts-expect-error - xmlns is required for Safari/WebKit to render foreignObject correctly
            xmlns="http://www.w3.org/1999/xhtml"
            className={cn(
              "flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 p-2.5 shadow-md text-center",
              isRaiz
                ? "border-emerald-500 bg-emerald-600 text-white dark:bg-emerald-700"
                : cn(styles.border, styles.text),
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
              <p
                className={cn(
                  "w-full truncate text-xs font-black leading-tight",
                  isRaiz ? "text-white" : "text-zinc-900 dark:text-zinc-100",
                )}
              >
                {data.name}
              </p>
              <div className="mt-1 flex w-full min-w-0 shrink-0 items-center justify-center">
                <p
                  className={cn(
                    "truncate text-[9px] font-black uppercase tracking-widest",
                    isRaiz ? "text-emerald-100" : styles.text,
                  )}
                >
                  {custom.tipo}
                </p>
              </div>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  const exportOptions = [
    {
      id: "pdf",
      label: "Exportar como PDF",
      description: "Documento con la estructura territorial completa.",
      icon: organigramaExportIcons.pdf,
      iconClass: "text-red-500",
      onSelect: async () => {
        try {
          await exportTerritorialToPdf("territorial-d3-full-container");
          toast.success("Estructura territorial exportada en PDF.");
        } catch (err) {
          const message = err instanceof Error ? err.message : "No se pudo exportar.";
          toast.error(message);
        }
      },
    },
    {
      id: "png",
      label: "Exportar como PNG",
      description: "Captura en imagen de la estructura territorial.",
      icon: organigramaExportIcons.image,
      iconClass: "text-emerald-500",
      onSelect: async () => {
        try {
          await exportTerritorialToPng("territorial-d3-full-container");
          toast.success("Estructura territorial exportada en PNG.");
        } catch (err) {
          const message = err instanceof Error ? err.message : "No se pudo exportar.";
          toast.error(message);
        }
      },
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-background text-foreground animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-border/50 bg-card/80 px-4 py-3 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Layers className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight md:text-base">
              Mapa Territorial · COMUDE
            </h2>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2">
          <OrganigramaExportMenu options={exportOptions} />

          <button
            type="button"
            onClick={handleCopiarImagen}
            className="hidden items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-bold transition-colors hover:bg-accent md:inline-flex"
          >
            {copiado ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Clipboard className="size-4" />
            )}
            <span>{copiado ? "¡Copiado!" : "Copiar imagen"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-muted-foreground transition-colors hover:bg-zinc-200 hover:text-foreground dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div id="territorial-d3-full-container" className="org-canvas org-canvas--full relative flex-1 overflow-hidden bg-zinc-900/5 dark:bg-zinc-950">
        {/* Leyenda Flotante (Esquina Superior Izquierda) */}
        <div className="absolute top-4 left-4 z-20 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-md">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Leyenda territorial
          </p>
          <div className="space-y-1.5">
            {LEYENDA_TERRITORIAL.map((item) => {
              const Icon = item.icon;
              const count = stats[item.tipo];
              return (
                <div key={item.label} className="flex items-center justify-between gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" style={{ color: item.color }} />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles de Zoom (Esquina Superior Derecha) */}
        <div className="org-export-hide absolute top-4 right-4 z-20 flex items-center gap-1 rounded-xl border border-border/60 bg-card/90 p-1.5 shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(0.8);
              setTranslate({ x: 600, y: 120 });
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {/* Canvas D3 */}
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          pathClassFunc={() => "territorial-link"}
          translate={translate}
          zoom={zoom}
          nodeSize={{ x: 200, y: 100 }}
          separation={{ siblings: 1.1, nonSiblings: 1.3 }}
          renderCustomNodeElement={renderCustomNode}
          enableLegacyTransitions
          transitionDuration={300}
        />

        {/* Guía Inferior Flotante */}
        <div className="org-export-hide hidden md:block pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/50 bg-card/80 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-md backdrop-blur-md">
          Arrastra para mover · Rueda para zoom · Clic en nodo para contraer/expandir
        </div>
      </div>
    </div>,
    document.body,
  );
}
