import dayjs from "dayjs";
import "dayjs/locale/pt-br";
dayjs.locale("pt-br");

import { loadAll } from "./dataStore";

const hoursBetween = (a, b) => Math.abs(dayjs(b).diff(dayjs(a), "hour", true));
const inMonth = (iso, y, m) => dayjs(iso).year() === y && (dayjs(iso).month()+1) === m;

export function computeMonthlyReport({ year, month }) {
  const { dados } = loadAll();
  const monthData = dados.filter(c => inMonth(c.criadoEm, year, month));

  // KPIs
  const total = monthData.length;
  const abertos = monthData.filter(c => String(c.status).toUpperCase().includes("ABERTO")).length;
  const encerrados = monthData.filter(c => c.fechadoEm).length;

  // MTTR (só fechados)
  const mttr =
    encerrados
      ? Math.round(
          monthData
            .filter(c => c.fechadoEm)
            .reduce((acc, c) => acc + hoursBetween(c.criadoEm, c.fechadoEm), 0) / encerrados
        )
      : 0;

  // SLA (ex. 24h)
  const SLA_HOURS = 24;
  const slaEstourados = monthData.filter(c => c.fechadoEm && hoursBetween(c.criadoEm, c.fechadoEm) > SLA_HOURS).length;

  // Reincidências (por tipo de falha e por local)
  const countBy = (arr, keyFn) => {
    const m = new Map();
    for (const x of arr) {
      const k = keyFn(x) || "N/D";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  };

  const porFalha = countBy(monthData, c => c.tipoFalha);
  const porLocal = countBy(monthData, c => c.local);
  const porEquip = countBy(monthData, c => c.equipamento);
  const porSolucao = countBy(monthData, c => c.solucao);

  // Maiores ofensores (Top 5 em cada dimensão)
  const topFalhas = porFalha.slice(0, 5);
  const topLocais = porLocal.slice(0, 5);
  const topEquip = porEquip.slice(0, 5);

  // "Impacto" simples: score = (prioridade?2:1) * recorrência por local
  const impactMap = new Map();
  for (const c of monthData) {
    const k = c.local || "N/D";
    const w = c.prioridade ? 2 : 1;
    impactMap.set(k, (impactMap.get(k) || 0) + w);
  }
  const impactoPorLocal = [...impactMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 5);

  // Recomendações (texto simples com base nos top ofensores/soluções)
  const recomendacoes = [];
  if (topFalhas[0]) recomendacoes.push(`Investigar causa-raiz da falha "${topFalhas[0][0]}" (maior recorrência no mês).`);
  if (topLocais[0]) recomendacoes.push(`Executar verificação preventiva no local "${topLocais[0][0]}" (maior volume).`);
  if (porSolucao[0]) recomendacoes.push(`Padronizar procedimento da solução mais aplicada: "${porSolucao[0][0]}".`);
  if (mttr > 24) recomendacoes.push(`Reduzir MTTR médio (${mttr}h) com playbook e comunicação entre equipes.`);

  return {
    periodLabel: dayjs(`${year}-${String(month).padStart(2,"0")}-01`).format("[Mês:] MMM/YYYY").toUpperCase(),
    kpis: { total, abertos, encerrados, mttr, slaEstourados },
    tables: {
      topFalhas,
      topLocais,
      topEquip,
      porSolucao,
      impactoPorLocal,
    },
    recomendacoes,
  };
}
