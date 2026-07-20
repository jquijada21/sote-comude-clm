import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="flex-1 w-full flex flex-col p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pt-24">
      {/* Hero / Banner skeleton */}
      <div className="w-full flex flex-col items-center justify-center space-y-4 py-12">
        <Skeleton className="h-16 w-3/4 md:w-1/2 rounded-2xl" />
        <Skeleton className="h-6 w-1/2 md:w-1/3 rounded-full" />
      </div>

      {/* Tarjetas / Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-4 p-5 border rounded-2xl bg-card/50 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="pt-2 flex justify-between items-center">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
