import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGlobalSettings, updateGlobalSettings, GlobalSettings } from "./actions";
import Swal from "sweetalert2";

export function useGlobalSettings() {
  return useQuery({
    queryKey: ["global_settings"],
    queryFn: async () => {
      const data = await getGlobalSettings();
      // Provide defaults if null
      return data || { minutos_antes_permitidos: 15, minutos_despues_permitidos: 30 };
    },
  });
}

export function useUpdateGlobalSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: GlobalSettings) => updateGlobalSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global_settings"] });
      Swal.fire({
        icon: "success",
        title: "¡Guardado!",
        text: "Configuración global actualizada correctamente.",
        timer: 3000,
        showConfirmButton: false,
      });
    },
    onError: (error) => {
      console.error("Error al actualizar la configuración global:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar los cambios.",
      });
    },
  });
}
