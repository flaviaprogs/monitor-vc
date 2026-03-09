import { useEffect, useState } from "react";

/**
 * Busca procedimentos em /api/procedures.
 * Se falhar, usa o fallbackLocal (array).
 */
export default function useProceduresAPI(fallbackLocal = []) {
  const [data, setData] = useState(Array.isArray(fallbackLocal) ? fallbackLocal : []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch("/api/procedures", { headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(String(r.status));
        const json = await r.json();
        const arr = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
        if (!cancel) setData(arr);
      } catch {
        if (!cancel) setData(Array.isArray(fallbackLocal) ? fallbackLocal : []);
      }
    })();

    return () => { cancel = true; };
  
  }, []); // não re-fetch a cada render

  return data;
}
