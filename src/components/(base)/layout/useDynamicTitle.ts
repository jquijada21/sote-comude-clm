import { useState, useEffect } from "react";
import { getGlobalMunicipioTitle } from "@/components/(base)/layout/actions";

export function useDynamicTitle() {
  const [title, setTitle] = useState("SISTEMA DE ORGANIZACIÓN TERRITORIAL ESTRATÉGICA");

  useEffect(() => {
    // Intentar cargar de localStorage primero para que sea instantáneo
    const cachedTitle = localStorage.getItem("sote_municipio_title");
    if (cachedTitle) {
      setTitle(cachedTitle);
    }

    // Consultar el servidor por si cambió o si no hay cache
    getGlobalMunicipioTitle()
      .then((serverTitle) => {
        if (serverTitle !== cachedTitle) {
          setTitle(serverTitle);
          localStorage.setItem("sote_municipio_title", serverTitle);
        }
      })
      .catch(() => {});
  }, []);

  return title;
}
