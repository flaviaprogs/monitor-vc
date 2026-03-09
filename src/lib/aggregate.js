// src/lib/aggregate.js
import dayjs from "dayjs";

const monthKey = (iso) => (iso ? dayjs(iso).format("YYYY-MM") : "");
export const last12MonthKeys = () => {
  const keys = [];
  const labels = [];
  const now = dayjs();
  for (let i = 11; i >= 0; i--) {
    const m = now.subtract(i, "month");
    keys.push(m.format("YYYY-MM"));
    labels.push(m.format("MMM").replace(".", "").toUpperCase());
  }
  return { keys, labels };
};

export function aggregate(chamados = []) {
  const porEquipe = new Map();
  const porPrioridade = new Map([["prioritárias", 0], ["comuns", 0]]);
  const porTipo = new Map();
  const porSolucao = new Map();

  const { keys: last12, labels: labels12 } = last12MonthKeys();
  const porMes12 = new Map(last12.map((k) => [k, 0]));

  let abertos = 0, encerrados = 0;
  for (const c of chamados) {
    // KPIs
    if (c.status.includes("ABERTO")) abertos++;
    if (c.status.includes("ENCERRA")) encerrados++;

    // Equipe
    porEquipe.set(c.equipeAcionada || "SEM EQUIPE", (porEquipe.get(c.equipeAcionada || "SEM EQUIPE") || 0) + 1);

    // Prioridade
    porPrioridade.set(c.prioridade ? "prioritárias" : "comuns",
      porPrioridade.get(c.prioridade ? "prioritárias" : "comuns") + 1);

    // Tipo
    porTipo.set(c.tipoFalha, (porTipo.get(c.tipoFalha) || 0) + 1);

    // Solução
    porSolucao.set(c.solucao, (porSolucao.get(c.solucao) || 0) + 1);

    // Últimos 12 meses (pela data de criação)
    const mk = monthKey(c.criadoEm);
    if (porMes12.has(mk)) porMes12.set(mk, porMes12.get(mk) + 1);
  }

  const toObj = (m) => Object.fromEntries(m.entries());
  return {
    kpi: { total: chamados.length, abertos, encerrados, prioridade: porPrioridade.get("prioritárias") },
    porEquipe: toObj(porEquipe),
    porPrioridade: toObj(porPrioridade),
    porTipo: toObj(porTipo),
    porSolucao: toObj(porSolucao),
    evolucao12: { labels: labels12, values: last12.map((k) => porMes12.get(k) || 0) },
  };
}
