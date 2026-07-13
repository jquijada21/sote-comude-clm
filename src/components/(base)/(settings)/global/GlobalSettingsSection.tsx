"use client";

import { useEffect, useState } from "react";
import { useGlobalSettings, useUpdateGlobalSettings } from "./hooks";
import { Loader2, Save, Clock } from "lucide-react";
import { GlobalSettings } from "./actions";

export default function GlobalSettingsSection() {
  const { data: settings, isLoading, isError } = useGlobalSettings();
  const { mutate: updateSettings, isPending } = useUpdateGlobalSettings();

  const [minutosAntes, setMinutosAntes] = useState<number | "">(15);
  const [minutosDespues, setMinutosDespues] = useState<number | "">(30);

  useEffect(() => {
    if (settings) {
      setMinutosAntes(settings.minutos_antes_permitidos);
      setMinutosDespues(settings.minutos_despues_permitidos);
    }
  }, [settings]);

  const handleSave = () => {
    const newSettings: GlobalSettings = {
      id: settings?.id,
      minutos_antes_permitidos: minutosAntes === "" ? 0 : minutosAntes,
      minutos_despues_permitidos: minutosDespues === "" ? 0 : minutosDespues,
    };
    updateSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="flex h-32 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4 font-medium text-red-600 dark:text-red-400">
        Error al cargar las configuraciones globales.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6 mt-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="size-5 text-azul-trifinio dark:text-celeste-trifinio" />
          <h2 className="text-xl font-bold text-foreground">Reglas Globales de Asistencia</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Define el tiempo mínimo y máximo permitido para que los usuarios puedan marcar su entrada o salida respecto a la hora programada.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Minutos antes */}
        <div className="space-y-2">
          <label htmlFor="min-antes" className="text-sm font-semibold text-foreground">
            Minutos antes permitidos
          </label>
          <div className="flex items-center gap-2">
            <input
              id="min-antes"
              type="number"
              min={0}
              value={minutosAntes}
              onChange={(e) => setMinutosAntes(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full sm:max-w-32 px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-azul-trifinio [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-muted-foreground">minutos</span>
          </div>
          <p className="text-xs text-muted-foreground">
            El usuario podrá marcar su entrada desde esta cantidad de minutos antes del inicio de la actividad.
          </p>
        </div>

        {/* Minutos despues */}
        <div className="space-y-2">
          <label htmlFor="min-despues" className="text-sm font-semibold text-foreground">
            Minutos después permitidos
          </label>
          <div className="flex items-center gap-2">
            <input
              id="min-despues"
              type="number"
              min={0}
              value={minutosDespues}
              onChange={(e) => setMinutosDespues(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full sm:max-w-32 px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-azul-trifinio [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-muted-foreground">minutos</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Límite de gracia para marcar asistencia después de la hora programada.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-azul-trifinio hover:bg-azul-trifinio/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
