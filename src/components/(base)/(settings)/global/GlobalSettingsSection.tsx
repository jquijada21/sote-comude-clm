"use client";

import { useEffect, useState } from "react";
import { useGlobalSettings, useUpdateGlobalSettings } from "./hooks";
import { Loader2, Save, Clock } from "lucide-react";
import { GlobalSettings } from "./actions";

export default function GlobalSettingsSection() {
  const { data: settings, isLoading, isError } = useGlobalSettings();
  const { mutate: updateSettings, isPending } = useUpdateGlobalSettings();

  const handleSave = () => {
    const newSettings: GlobalSettings = {
      id: settings?.id,
      minutos_antes_permitidos: 0,
      minutos_despues_permitidos: 0,
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
          <h2 className="text-xl font-bold text-foreground">Configuraciones Globales (Superadmin)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Esta sección está reservada para futuras configuraciones que apliquen a todo el sistema por igual. Las reglas de asistencia han sido trasladadas a las configuraciones municipales.
        </p>
      </div>
    </div>
  );
}
