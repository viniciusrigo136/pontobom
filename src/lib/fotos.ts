import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Novas fotos são salvas como "storage:protechos/<path>"; antigas são URLs completas.
export const FOTO_PREFIX = "storage:protechos/";
const SIGNED_TTL = 60 * 20; // 20 minutos

export const fotoRef = (path: string) => `${FOTO_PREFIX}${path}`;
export const isFotoRef = (v: string) => v.startsWith(FOTO_PREFIX);

export function useFotoUrls(values: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = values.join("|");
  useEffect(() => {
    let cancel = false;
    const paths = values.filter(isFotoRef).map((v) => v.slice(FOTO_PREFIX.length));
    if (!paths.length) return;
    supabase.storage
      .from("protechos")
      .createSignedUrls(paths, SIGNED_TTL)
      .then(({ data }) => {
        if (cancel || !data) return;
        const map: Record<string, string> = {};
        data.forEach((d) => {
          if (d.path && d.signedUrl) map[fotoRef(d.path)] = d.signedUrl;
        });
        setUrls(map);
      });
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (v: string) => (isFotoRef(v) ? urls[v] ?? "" : v);
}
