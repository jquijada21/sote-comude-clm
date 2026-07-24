"use client";

import { useMemo, useState } from "react";
import Tree from "react-d3-tree";
import type { CustomNodeElementProps, RawNodeDatum } from "react-d3-tree";
import { Layers, TreePine, Home, Users, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIPO_LABELS, type NodoTerritorial, type TipoLugar } from "./lib/zod";

const TIPO_STYLES: Record<
  TipoLugar,
  { icon: typeof Layers; border: string; bg: string; text: string; dot: string }
> = {
  microrregion: {
    icon: Layers,
    border: "border-blue-500/60 bg-blue-50/90 dark:bg-blue-950/80",
    bg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  aldea: {
    icon: TreePine,
    border: "border-emerald-500/60 bg-emerald-50/90 dark:bg-emerald-950/80",
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  caserio: {
    icon: Home,
    border: "border-amber-500/60 bg-amber-50/90 dark:bg-amber-950/80",
    bg: "bg-amber-100 dark:bg-amber-900/50",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

interface TerritorialNodeDatum extends RawNodeDatum {
  id: string;
  tipo: TipoLugar | "raiz";
  personas_count: number;
}

function convertToD3(nodo: NodoTerritorial): TerritorialNodeDatum {
  return {
    name: nodo.nombre,
    id: nodo.id,
    tipo: nodo.tipo,
    personas_count: nodo.personas_count,
    children: nodo.hijos.map(convertToD3),
  };
}

function renderCustomNode({
  nodeDatum,
  toggleNode,
}: CustomNodeElementProps) {
  const data = (nodeDatum as unknown) as TerritorialNodeDatum;
  const isRaiz = data.tipo === "raiz";
  const tipo = isRaiz ? "microrregion" : (data.tipo as TipoLugar);
  const styles = TIPO_STYLES[tipo];
  const Icon = isRaiz ? Layers : styles.icon;

  const cardW = 180;
  const cardH = 64;

  return (
    <g>
      <foreignObject
        width={cardW}
        height={cardH}
        x={-cardW / 2}
        y={-cardH / 2}
        className="overflow-visible"
      >
        <div
          onClick={toggleNode}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl border-2 p-2.5 shadow-md transition-all hover:scale-105 hover:shadow-lg",
            isRaiz
              ? "border-emerald-500 bg-emerald-600 text-white dark:bg-emerald-700"
              : cn(styles.border, styles.text),
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10",
            )}
          >
            <Icon className="size-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black leading-tight">
              {data.name}
            </p>
            <div className="mt-0.5 flex items-center justify-between text-[10px] opacity-80">
              <span className="font-semibold uppercase tracking-wider">
                {isRaiz ? "Municipio" : TIPO_LABELS[tipo]}
              </span>
              {data.personas_count > 0 && (
                <span className="flex items-center gap-0.5 font-bold">
                  <Users className="size-2.5" />
                  {data.personas_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

export function OrganigramaTerritorialGrafico({
  nodos,
}: {
  nodos: NodoTerritorial[];
}) {
  const [zoom, setZoom] = useState(0.8);
  const [translate, setTranslate] = useState({ x: 400, y: 100 });

  const treeData = useMemo<TerritorialNodeDatum>(() => {
    const totalPersonas = nodos.reduce((acc, n) => acc + n.personas_count, 0);
    return {
      name: "Estructura Territorial",
      id: "raiz-territorial",
      tipo: "raiz",
      personas_count: totalPersonas,
      children: nodos.map(convertToD3),
    };
  }, [nodos]);

  return (
    <div className="relative h-[550px] w-full overflow-hidden rounded-2xl border border-border/60 bg-zinc-50 dark:bg-zinc-950">
      {/* Controles de Zoom */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1.5 shadow-md">
        <button
          type="button"
          title="Acercar"
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          title="Alejar"
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          type="button"
          title="Restablecer vista"
          onClick={() => {
            setZoom(0.8);
            setTranslate({ x: 400, y: 100 });
          }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      {/* Árbol D3 */}
      <div id="territorial-d3-canvas" className="size-full">
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          translate={translate}
          zoom={zoom}
          nodeSize={{ x: 200, y: 100 }}
          separation={{ siblings: 1.1, nonSiblings: 1.3 }}
          renderCustomNodeElement={renderCustomNode}
          enableLegacyTransitions
          transitionDuration={300}
        />
      </div>
    </div>
  );
}
