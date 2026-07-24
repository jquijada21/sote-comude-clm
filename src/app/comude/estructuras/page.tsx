import { Suspense } from "react";
import { EstructurasPage } from "@/components/(comude)/organizacion-jerarquica/organizacion-jerarquica/EstructurasPage";

export default function EstructurasRoutePage() {
  return (
    <Suspense>
      <EstructurasPage />
    </Suspense>
  );
}
