// src/lib/normalize.js
const safeISO = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d) ? "" : d.toISOString();
};

export function normalizeChamado(c = {}) {
  const prioridadeRaw =
    c.prioridade ?? c.isPrioridade ?? c.prioritario ?? c.priority ?? false;

  const criadoRaw =
    c.criadoEm ?? c.dataQueda ?? c.dataCriacao ?? c.createdAt ?? c.abertura ?? c.data;

  return {
    ...c,
    equipeAcionada: c.equipeAcionada ?? c.equipe ?? c.equipeResponsavel ?? c.responsavel ?? "",
    status: (c.status ?? c.situacao ?? c.state ?? "").toUpperCase(),
    prioridade:
      prioridadeRaw === true ||
      prioridadeRaw === 1 ||
      String(prioridadeRaw).toLowerCase() === "true" ||
      /prior/i.test(String(prioridadeRaw)),
    criadoEm: safeISO(criadoRaw),
    tipoFalha: c.tipoFalha ?? c.falha ?? c.descricaoFalha ?? c.motivo ?? "SEM REGISTRO",
    solucao: c.solucao ?? c.resolucao ?? c.acao ?? c.acaoTomada ?? "SEM REGISTRO",
  };
}
