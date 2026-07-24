"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Loader2, Save, Clock } from "lucide-react";
import ImageUploader from "@/components/(uploads)/imgs/ImageUploader";
import { useConfiguracionMunicipio, useUpsertConfiguracionMunicipio } from "./hooks";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useStorageDisplayUrl } from "@/components/(uploads)/imgs/useStorageDisplayUrl";
import { getInitialGlobalMunicipioState } from "@/components/(base)/layout/actions";
import { toast } from "react-toastify";

const BUCKET = "portada_imagenes";

export default function MunicipioSettingsSection() {
  const { effectiveRole } = useUserContext();
  const [municipioId, setMunicipioId] = useState<number | null>(null);

  useEffect(() => {
    getInitialGlobalMunicipioState().then((state) => {
      setMunicipioId(state.municipioId ?? null);
    });
  }, []);

  const { data: config, isLoading } = useConfiguracionMunicipio(municipioId);
  const { mutate: upsertConfig, isPending } = useUpsertConfiguracionMunicipio(municipioId);

  const [minutosAntes, setMinutosAntes] = useState<number | "">(15);
  const [minutosDespues, setMinutosDespues] = useState<number | "">(30);

  useEffect(() => {
    if (config) {
      setMinutosAntes(config.minutos_antes_permitidos ?? 15);
      setMinutosDespues(config.minutos_despues_permitidos ?? 30);
    }
  }, [config]);

  const currentPath = config?.imagen_portada_url ?? null;
  const folderPath = municipioId ? `portadas/municipio_${municipioId}` : undefined;

  const { url: previewUrl } = useStorageDisplayUrl(BUCKET, currentPath);

  const handleUploadSuccess = async (newPath: string) => {
    upsertConfig({
      imagenPortadaUrl: newPath,
      minutosAntes: minutosAntes === "" ? 0 : minutosAntes,
      minutosDespues: minutosDespues === "" ? 0 : minutosDespues
    }, {
      onSuccess: () => {
        toast.success("Imagen de portada actualizada.");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDeleteSuccess = async () => {
    upsertConfig({
      imagenPortadaUrl: null,
      minutosAntes: minutosAntes === "" ? 0 : minutosAntes,
      minutosDespues: minutosDespues === "" ? 0 : minutosDespues
    }, {
      onSuccess: () => {
        toast.success("Imagen de portada eliminada.");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleSaveMinutes = () => {
    upsertConfig({
      imagenPortadaUrl: currentPath,
      minutosAntes: minutosAntes === "" ? 0 : minutosAntes,
      minutosDespues: minutosDespues === "" ? 0 : minutosDespues
    }, {
      onSuccess: () => {
        toast.success("Reglas de asistencia actualizadas.");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  // Only admins and supers can see this section
  if (!["admin", "super"].includes(effectiveRole)) return null;
  if (!municipioId) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Reglas de Asistencia */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-5 text-azul-trifinio dark:text-celeste-trifinio" />
            <h3 className="text-xl font-bold text-foreground">Reglas de Asistencia</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Define el tiempo mínimo y máximo permitido para que los usuarios puedan marcar su entrada o salida respecto a la hora programada.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Minutos antes */}
          <div className="space-y-2">
            <label htmlFor="mun-min-antes" className="text-sm font-semibold text-foreground">
              Minutos antes permitidos
            </label>
            <div className="flex items-center gap-2">
              <input
                id="mun-min-antes"
                type="number"
                min={0}
                value={minutosAntes}
                onChange={(e) => setMinutosAntes(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full sm:max-w-32 px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-azul-trifinio [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          </div>

          {/* Minutos despues */}
          <div className="space-y-2">
            <label htmlFor="mun-min-despues" className="text-sm font-semibold text-foreground">
              Minutos después permitidos
            </label>
            <div className="flex items-center gap-2">
              <input
                id="mun-min-despues"
                type="number"
                min={0}
                value={minutosDespues}
                onChange={(e) => setMinutosDespues(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full sm:max-w-32 px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-azul-trifinio [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            onClick={handleSaveMinutes}
            disabled={isPending || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-azul-trifinio hover:bg-azul-trifinio/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar Reglas
          </button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border/25 overflow-hidden rounded-2xl border border-border/80 bg-card">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 md:p-5">
          <div className="rounded-lg bg-indigo-500/10 p-2.5">
            <ImageIcon className="size-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">
              Imagen de portada
            </h3>
            <p className="text-xs text-muted-foreground">
              Esta imagen aparece como fondo en el inicio para todos los usuarios de este municipio.
              Máximo 1 MB · JPEG, PNG o WebP · Proporción recomendada 16:9
            </p>
          </div>
        </div>

        {/* Uploader */}
        <div className="p-4 md:p-5">
          {isLoading || !municipioId ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ImageUploader
              bucketName={BUCKET}
              currentImagePath={currentPath}
              onUploadSuccess={handleUploadSuccess}
              onDeleteSuccess={handleDeleteSuccess}
              disabled={isPending}
              aspect={16 / 9}
              aspectLabel="Horizontal 16:9"
              maxSizeMB={0.9}
              maxDimension={1920}
              folderPath={folderPath}
            />
          )}
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="px-4 pb-4 md:px-5 md:pb-5">
            <div className="relative overflow-hidden rounded-xl border border-border/60 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Vista previa de portada"
                className="w-full max-h-48 object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                <span className="text-xs text-white/80 font-medium">
                  Vista previa de portada actual
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
