// src/hooks/useChamados.js
import { useEffect, useMemo, useState } from "react";
import { fetchChamadosAny } from "../lib/fetchChamados";
import { aggregate } from "../lib/aggregate";

export function useChamados() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Filtros globais
  const [equipe, setEquipe] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [mes, setMes] = useState(""); // opcional (Resumo Mensal)

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const arr = await fetchChamadosAny();
        setRaw(arr);
      } catch (e) {
        setErr(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const equipes = useMemo(() => ["Todos", ...Array.from(new Set(raw.map(c => c.equipeAcionada).filter(Boolean))).sort()], [raw]);
  const statusList = useMemo(() => ["Todos", ...Array.from(new Set(raw.map(c => c.status).filter(Boolean))).sort()], [raw]);

  const data = useMemo(() => {
    return raw.filter((c) => {
      const okEquipe = equipe === "Todos" || c.equipeAcionada === equipe;
      const okStatus = status === "Todos" || c.status === status;
      const okMes = !mes || (new Date(c.criadoEm).getMonth() + 1) === Number(mes);
      return okEquipe && okStatus && okMes;
    });
  }, [raw, equipe, status, mes]);

  const agg = useMemo(() => aggregate(data), [data]);

  return {
    loading, err,
    data, ...agg,
    // filtros & listas
    equipe, setEquipe, equipes,
    status, setStatus, statusList,
    mes, setMes
  };
}
