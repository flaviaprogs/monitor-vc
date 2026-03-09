export const STORAGE_KEY = "chamados:v1";

export function normalizeChamado(c = {}) {
  const prioridadeRaw = c.prioridade ?? c.isPrioridade ?? c.prioritario ?? c.priority ?? false;
  const criadoRaw =
    c.criadoEm ?? c.dataQueda ?? c.dataCriacao ?? c.createdAt ?? c.abertura ?? c.data;

  return {
    id: c.id || `${(c.local||c.sala||c.site||"")}|${(c.equipamento||c.device||"")}|${(c.tipoFalha||c.tipo||"")}|${new Date(criadoRaw).toISOString()}`,
    local: c.local || c.sala || c.site || "",
    equipamento: c.equipamento || c.device || c.modelo || "",
    equipeAcionada: c.equipeAcionada || c.equipe || c.equipeResponsavel || "",
    status: c.status || c.situacao || "",
    prioridade: prioridadeRaw === true || prioridadeRaw === 1 || String(prioridadeRaw).toLowerCase() === "true",
    tipoFalha: c.tipoFalha || c.tipo || c.falha || c.motivo || "OUTRO",
    solucao: c.solucao || c.resolucao || c.acao || "",
    criadoEm: new Date(criadoRaw).toISOString(),
    fechadoEm: c.fechadoEm ? new Date(c.fechadoEm).toISOString() : null,
  };
}

export function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dados: [], updatedAt: null };
    const parsed = JSON.parse(raw);
    const dados = Array.isArray(parsed?.dados) ? parsed.dados : [];
    return { dados, updatedAt: parsed.updatedAt || null };
  } catch {
    return { dados: [], updatedAt: null };
  }
}

export function saveAll(dados) {
  const payload = { dados, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function mergeChamados(novos = []) {
  const { dados: atuais } = loadAll();
  const map = new Map();
  for (const x of atuais) map.set(x.id, x);
  for (const r of novos.map(normalizeChamado)) map.set(r.id, r);
  const merged = Array.from(map.values()).sort((a,b)=> new Date(a.criadoEm)-new Date(b.criadoEm));
  saveAll(merged);
  return merged;
}
