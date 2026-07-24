"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { getDepartamentos, getMunicipios } from "@/components/(base)/(auth)/signup/actions";
import { setGlobalMunicipioCookie, getInitialGlobalMunicipioState } from "./actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function GlobalMunicipioSelector() {
  const { effectiveRole } = useUserContext();
  const router = useRouter();
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedMun, setSelectedMun] = useState<string>("");

  const { data: initialState } = useQuery({
    queryKey: ["global-municipio-state"],
    queryFn: () => getInitialGlobalMunicipioState(),
    enabled: effectiveRole === "super",
    staleTime: 1000 * 60 * 5,
  });

  const { data: deptosData } = useQuery({
    queryKey: ["departamentos"],
    queryFn: () => getDepartamentos(),
    enabled: effectiveRole === "super",
    staleTime: Infinity,
  });

  useEffect(() => {
    if (initialState) {
      if (initialState.departamentoId && !selectedDept) setSelectedDept(String(initialState.departamentoId));
      if (initialState.municipioId && !selectedMun) setSelectedMun(String(initialState.municipioId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  const { data: munsData } = useQuery({
    queryKey: ["municipios", selectedDept],
    queryFn: () => getMunicipios(Number(selectedDept)),
    enabled: !!selectedDept && effectiveRole === "super",
    staleTime: Infinity,
  });

  const departamentos = deptosData || [];
  const municipios = munsData || [];

  if (effectiveRole !== "super") return null;

  return (
    <div className="flex items-center gap-2 w-full max-w-[350px]">
      <div className="w-1/2 relative">
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
      <div className="w-1/2 relative">
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
