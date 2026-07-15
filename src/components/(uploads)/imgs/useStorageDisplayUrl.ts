"use client";

import { useMemo } from "react";
import { getStoragePublicUrl } from "./constants";

/** URL del logo — bucket público, sin server action. */
export function useStorageDisplayUrl(bucketName: string, path: string | null) {
  const url = useMemo(() => getStoragePublicUrl(bucketName, path), [bucketName, path]);
  return { url, loading: false };
}
