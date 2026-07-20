import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfiguracionMunicipio, upsertConfiguracionMunicipio, ConfiguracionMunicipio } from "./actions";

export const useConfiguracionMunicipio = (municipioId: number | null | undefined) => {
  return useQuery<ConfiguracionMunicipio | null, Error>({
    queryKey: ["configuracionMunicipio", municipioId],
    queryFn: async () => {
      if (!municipioId) return null;
      return getConfiguracionMunicipio(municipioId);
    },
    enabled: !!municipioId,
  });
};

export const useUpsertConfiguracionMunicipio = (municipioId: number | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { imagenPortadaUrl: string | null; minutosAntes: number; minutosDespues: number }>({
    mutationFn: async ({ imagenPortadaUrl, minutosAntes, minutosDespues }) => {
      if (!municipioId) throw new Error("municipio_id requerido");
      await upsertConfiguracionMunicipio(municipioId, imagenPortadaUrl, minutosAntes, minutosDespues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracionMunicipio", municipioId] });
    },
  });
};
