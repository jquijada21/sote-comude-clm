"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Layers,
  TreePine,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { isSuperOrAdminRole } from "@/components/(base)/dashboard/modules";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { OrganigramaIcon } from "../organizacion-jerarquica/OrganigramaIcon";
import {
  useEstructuraTerritorial,
  useEliminarComunidad,
} from "./lib/hooks";
import {
  OrganizacionTerritorialTree,
  type TerritorialAdminHandlers,
} from "./OrganizacionTerritorialTree";
import { OrganizacionTerritorialSkeleton } from "./OrganizacionTerritorialSkeleton";
import { OrganigramaTerritorialVertical } from "./OrganigramaTerritorialVertical";
import { CrearTerritorio } from "./forms/CrearTerritorio";
import { VerEditarTerritorio } from "./forms/VerEditarTerritorio";
import { AsignarResidentes } from "./forms/AsignarResidentes";
import {
  TIPO_LABELS,
  type NodoTerritorial,
  type TipoLugar,
} from "./lib/zod";
import {
  ModalConfirmDelete,
  modalActionMessage,
} from "@/components/ui/general-modal";

// Helper para contar tipos
function contarTiposTerritorio(nodos: NodoTerritorial[]) {
  let microrregiones = 0;
  let aldeas = 0;
  let caserios = 0;

  function walk(items: NodoTerritorial[]) {
    for (const item of items) {
      if (item.tipo === "microrregion") microrregiones++;
      else if (item.tipo === "aldea") aldeas++;
      else if (item.tipo === "caserio") caserios++;
      if (item.hijos) walk(item.hijos);
    }
  }

  walk(nodos);
  return { microrregiones, aldeas, caserios };
}

export function OrganizacionTerritorial() {
  const { effectiveRole } = useUserContext();
  const { data, isLoading, isError } = useEstructuraTerritorial();
  const eliminar = useEliminarComunidad();

  const [organigramaOpen, setOrganigramaOpen] = useState(false);

  // Modales
  const [modalCrear, setModalCrear] = useState<{
    tipo: TipoLugar;
    parentId: string | null;
  } | null>(null);

  const [modalEditar, setModalEditar] = useState<{
    id: string;
    nombre: string;
    tipo: TipoLugar;
    tieneHijos: boolean;
    parentId: string | null;
  } | null>(null);

  const [modalResidentes, setModalResidentes] = useState<{
    id: string;
    nombre: string;
    tipo: TipoLugar;
  } | null>(null);

  const [modalEliminar, setModalEliminar] = useState<{
    id: string;
    nombre: string;
    tipo: TipoLugar;
    tieneHijos: boolean;
  } | null>(null);

  const nodos = data?.data ?? [];
  const estaVacio = nodos.length === 0;
  const counts = useMemo(() => contarTiposTerritorio(nodos), [nodos]);

  const adminHandlers: TerritorialAdminHandlers = useMemo(
    () => ({
      onAddComunidad: (parentId, tipo) => setModalCrear({ parentId, tipo }),
      onAsignarResidentes: (comunidadId) => {
        function buscar(lista: NodoTerritorial[]): NodoTerritorial | null {
          for (const n of lista) {
            if (n.id === comunidadId) return n;
            const r = buscar(n.hijos);
            if (r) return r;
          }
          return null;
        }
        const encontrado = buscar(nodos);
        setModalResidentes({
          id: comunidadId,
          nombre: encontrado?.nombre ?? "Territorio",
          tipo: encontrado?.tipo ?? "caserio",
        });
      },
      onEditComunidad: (id, nombre, tipo, tieneHijos, parentId) => 
        setModalEditar({ id, nombre, tipo, tieneHijos, parentId }),
      onDeleteComunidad: (id, nombre, tipo, tieneHijos) =>
        setModalEliminar({ id, nombre, tipo, tieneHijos }),
    }),
    [nodos],
  );

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    const res = await eliminar.mutateAsync(modalEliminar.id);
    if (res.success) {
      toast.success("Eliminado correctamente.");
      setModalEliminar(null);
    } else {
      toast.error(
        res.error === "HAS_CHILDREN"
          ? "No se puede eliminar: tiene lugares dependientes."
          : modalActionMessage(res.error ?? undefined, "No se pudo eliminar."),
      );
      setModalEliminar(null);
    }
  };

  if (!isSuperOrAdminRole(effectiveRole)) {
    return null;
  }

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,1600px)] space-y-4 md:space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 min-w-0 px-4 md:gap-5 md:px-0">
            <div className="flex size-14 md:size-24 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-zinc-100 p-1.5 shadow-sm md:p-2 dark:bg-zinc-800">
              <AnimatedIcon iconKey="giblkgwf" size={56} speed={1.5} />
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                COMUDE
              </p>
              <h1 className="text-2xl font-black tracking-tight text-foreground md:text-4xl">
                Estructura Territorial
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
                Mapa geográfico del municipio · Gestión de Microrregiones, Aldeas y Caseríos.
              </p>
            </div>
          </div>

          {!isLoading && !isError && (
            <div className="flex shrink-0 w-full flex-col gap-2 px-4 sm:flex-row sm:items-center md:px-0 lg:w-auto">
              {!estaVacio && (
                <button
                  type="button"
                  onClick={() => setOrganigramaOpen(true)}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-card px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 transition-colors hover:bg-emerald-500/10 sm:w-auto"
                >
                  <OrganigramaIcon className="size-4" />
                  Ver organigrama
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tarjetas de Resumen de Jerarquía Territorial */}
        {!isLoading && !isError && (
          <div className="px-4 space-y-2 md:px-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Jerarquía Territorial
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Microrregión */}
              <div className="relative flex items-center justify-between rounded-2xl border-2 border-blue-500/40 bg-blue-50/50 p-4 dark:bg-blue-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      {counts.microrregiones === 1 ? "Microrregión" : "Microrregiones"}
                    </h3>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Nivel 1
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-blue-500/15 px-3 py-1.5 dark:bg-blue-500/20">
                  <span className="text-xl font-black tracking-tight text-blue-700 dark:text-blue-300 md:text-2xl">
                    {counts.microrregiones}
                  </span>
                </div>
              </div>

              {/* Aldea */}
              <div className="relative flex items-center justify-between rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <TreePine className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      {counts.aldeas === 1 ? "Aldea" : "Aldeas"}
                    </h3>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Nivel 2
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 dark:bg-emerald-500/20">
                  <span className="text-xl font-black tracking-tight text-emerald-700 dark:text-emerald-300 md:text-2xl">
                    {counts.aldeas}
                  </span>
                </div>
              </div>

              {/* Caserío */}
              <div className="relative flex items-center justify-between rounded-2xl border-2 border-amber-500/40 bg-amber-50/50 p-4 dark:bg-amber-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Home className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      {counts.caserios === 1 ? "Caserío" : "Caseríos"}
                    </h3>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Nivel 3
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-1.5 dark:bg-amber-500/20">
                  <span className="text-xl font-black tracking-tight text-amber-700 dark:text-amber-300 md:text-2xl">
                    {counts.caserios}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Carga */}
        {isLoading ? (
          <OrganizacionTerritorialSkeleton />
        ) : isError ? (
          <div className="mx-4 rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center md:mx-0">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              No se pudo cargar la estructura territorial.
            </p>
          </div>
        ) : (
          <OrganizacionTerritorialTree
            nodos={nodos}
            adminHandlers={adminHandlers}
          />
        )}
      </div>

      {/* Modal Organigrama Fullscreen D3 */}
      {organigramaOpen && (
        <OrganigramaTerritorialVertical
          nodos={nodos}
          onClose={() => setOrganigramaOpen(false)}
        />
      )}

      {/* Form Crear */}
      {modalCrear && (
        <CrearTerritorio
          open={true}
          onClose={() => setModalCrear(null)}
          tipo={modalCrear.tipo}
          parentId={modalCrear.parentId}
        />
      )}

      {/* Form Editar */}
      {modalEditar && (
        <VerEditarTerritorio
          open={true}
          onClose={() => setModalEditar(null)}
          id={modalEditar.id}
          nombreInicial={modalEditar.nombre}
          tipo={modalEditar.tipo}
          tieneHijos={modalEditar.tieneHijos}
          parentId={modalEditar.parentId}
          onDelete={() => {
            setModalEditar(null);
            setModalEliminar({
              id: modalEditar.id,
              nombre: modalEditar.nombre,
              tipo: modalEditar.tipo,
              tieneHijos: modalEditar.tieneHijos,
            });
          }}
        />
      )}

      {/* Form Residentes */}
      {modalResidentes && (
        <AsignarResidentes
          open={true}
          onClose={() => setModalResidentes(null)}
          comunidadId={modalResidentes.id}
          comunidadNombre={modalResidentes.nombre}
          tipo={modalResidentes.tipo}
        />
      )}

      {/* Modal Eliminar */}
      {modalEliminar && (
        <ModalConfirmDelete
          open={true}
          onClose={() => setModalEliminar(null)}
          onConfirm={handleEliminar}
          title={`¿Eliminar ${TIPO_LABELS[modalEliminar.tipo]}?`}
          description={
            modalEliminar.tieneHijos
              ? `"${modalEliminar.nombre}" tiene lugares dependientes. Debes eliminarlos primero.`
              : `Se eliminará "${modalEliminar.nombre}" permanentemente.`
          }
          loading={eliminar.isPending}
          hideConfirm={modalEliminar.tieneHijos}
        />
      )}
    </div>
  );
}
