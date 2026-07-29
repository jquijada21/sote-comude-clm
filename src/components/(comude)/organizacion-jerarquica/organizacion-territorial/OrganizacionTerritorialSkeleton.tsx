"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function OrganizacionTerritorialSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border/60 bg-zinc-100 p-4 shadow-sm md:p-6 lg:p-8 dark:bg-zinc-800">
        <div className="space-y-3">
          {/* Nodo raíz */}
          <div className="h-20 w-full rounded-2xl bg-zinc-200/70 dark:bg-zinc-700/50 animate-pulse" />
          
          {/* Nodos hijos */}
          <div className="space-y-2 pl-4 md:pl-6 border-l-2 border-emerald-500/20">
            <div className="h-16 w-full rounded-2xl bg-zinc-200/50 dark:bg-zinc-700/30 animate-pulse" />
            <div className="h-16 w-full rounded-2xl bg-zinc-200/50 dark:bg-zinc-700/30 animate-pulse" />
            <div className="space-y-2 pl-4 md:pl-6 border-l-2 border-emerald-500/20">
              <div className="h-14 w-full rounded-2xl bg-zinc-200/30 dark:bg-zinc-700/20 animate-pulse" />
              <div className="h-14 w-full rounded-2xl bg-zinc-200/30 dark:bg-zinc-700/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
