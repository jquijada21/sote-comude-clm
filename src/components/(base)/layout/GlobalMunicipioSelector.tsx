"use client";

import { useEffect, useState } from "react";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { getDepartamentos, getMunicipios } from "@/components/(base)/(auth)/signup/actions";
import { setGlobalMunicipioCookie, getInitialGlobalMunicipioState } from "./actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function GlobalMunicipioSelector() {
  const { effectiveRole } = useUserContext();
  const router = useRouter();
  const [departamentos, setDepartamentos] = useState<{ id: number; nombre: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedMun, setSelectedMun] = useState<string>("");

  useEffect(() => {
    if (effectiveRole !== "super") return;

    // Load initial state
    getInitialGlobalMunicipioState().then((state) => {
      if (state.departamentoId) {
        setSelectedDept(String(state.departamentoId));
      }
      if (state.municipioId) {
        setSelectedMun(String(state.municipioId));
      }
    });

    getDepartamentos().then(setDepartamentos).catch(() => {});
  }, [effectiveRole]);

  useEffect(() => {
    if (selectedDept) {
      getMunicipios(Number(selectedDept)).then(setMunicipios).catch(() => {});
    } else {
      setMunicipios([]);
    }
  }, [selectedDept]);

  if (effectiveRole !== "super") return null;

  return (
    <div className="flex items-center gap-2 max-w-[300px]">
      <div className="w-32 hidden lg:block relative">
        <select
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setSelectedMun("");
          }}
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border border-input bg-transparent dark:bg-zinc-950 dark:text-zinc-50 px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          )}
        >
          <option value="" className="bg-background text-foreground">Depto...</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id} className="bg-background text-foreground">
              {d.nombre}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <div className="w-40 lg:w-48 relative">
        <select
          value={selectedMun}
          disabled={!selectedDept && municipios.length === 0}
          onChange={async (e) => {
            const val = e.target.value;
            setSelectedMun(val);
            if (val) {
              const mun = municipios.find((m) => String(m.id) === val);
              await setGlobalMunicipioCookie(Number(val), mun?.nombre || "");
            } else {
              await setGlobalMunicipioCookie(null, null);
            }
            window.location.reload();
          }}
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border border-input bg-transparent dark:bg-zinc-950 dark:text-zinc-50 px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <option value="" className="bg-background text-foreground">Ver municipio...</option>
          {municipios.map((m) => (
            <option key={m.id} value={m.id} className="bg-background text-foreground">
              {m.nombre}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
