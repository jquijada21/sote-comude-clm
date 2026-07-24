import { useQuery } from "@tanstack/react-query";
import { getGlobalMunicipioTitle } from "@/components/(base)/layout/actions";
import { useEffect, useState } from "react";

export function useDynamicTitle() {
  const defaultTitle = "SISTEMA DE ORGANIZACIÓN TERRITORIAL ESTRATÉGICA";
  const [mounted, setMounted] = useState(false);
  const [localTitle, setLocalTitle] = useState(defaultTitle);

  const { data: serverTitle } = useQuery({
    queryKey: ["global-municipio-title"],
    queryFn: async () => {
      try {
        return await getGlobalMunicipioTitle();
      } catch {
        return defaultTitle;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  useEffect(() => {
    setMounted(true);
    const cached = localStorage.getItem("sote_municipio_title");
    if (cached) {
      setLocalTitle(cached);
    }
  }, []);

  useEffect(() => {
    if (serverTitle && serverTitle !== defaultTitle) {
      setLocalTitle(serverTitle);
      localStorage.setItem("sote_municipio_title", serverTitle);
    }
  }, [serverTitle]);

  if (!mounted) return defaultTitle;
  return localTitle;
}
