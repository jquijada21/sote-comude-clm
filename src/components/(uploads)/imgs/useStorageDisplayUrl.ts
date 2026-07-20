"use client";

import { useState, useEffect } from "react";
import { getStoragePublicUrl, OBS_ORG_LOGOS_BUCKET } from "./constants";
import { createClient } from "@/utils/supabase/client";

/** URL del logo — bucket público o privado */
export function useStorageDisplayUrl(bucketName: string, path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      setLoading(false);
      return;
    }
    
    // Si es el bucket público conocido, usamos la URL síncrona directa
    if (bucketName === OBS_ORG_LOGOS_BUCKET) {
      setUrl(getStoragePublicUrl(bucketName, path));
      setLoading(false);
      return;
    }

    // De lo contrario, generamos una URL firmada de forma asíncrona
    let isMounted = true;
    setLoading(true);
    
    const fetchSignedUrl = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.storage.from(bucketName).createSignedUrl(path, 3600);
        if (isMounted) {
          setUrl(data?.signedUrl || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSignedUrl();

    return () => { isMounted = false; };
  }, [bucketName, path]);

  return { url, loading };
}
