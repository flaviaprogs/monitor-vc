const KEY = "salas_obs";

/* =========================
   NORMALIZA SALA (GLOBAL)
========================= */
function normalizarSala(sala = "") {
  return sala
    .toUpperCase()
    .trim()
    // remove espaços extras
    .replace(/\s+/g, " ")
    // remove tudo depois do equipamento
    .replace(
      /-(X\d+|G\d+|TC\d*|GC\d*|C\d+(_\d+)?|MIC|MTRoW|SMARTHUB).*$/i,
      ""
    )
    // remove pontuação solta no final
    .replace(/[.\-_\s]+$/, "");
}

/* =========================
   STORAGE
========================= */
export function getSalasObs() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveSalasObs(lista) {
  localStorage.setItem(KEY, JSON.stringify(lista));
}

/* =========================
   CRUD
========================= */
export function addSalaObs(item) {
  const lista = getSalasObs();

  lista.push({
    ...item,
    sala: normalizarSala(item.sala),
    status: "ativa",
  });

  saveSalasObs(lista);
}

export function resolveSalaObs(id, reason) {
  const lista = getSalasObs().map(item =>
    item.id === id
      ? {
          ...item,
          status: "resolvida",
          resolutionReason: reason,
          resolvedAt: new Date().toISOString(),
        }
      : item
  );

  saveSalasObs(lista);
}

export function deleteSalaObs(id) {
  saveSalasObs(getSalasObs().filter(item => item.id !== id));
}

/* =========================
   🔒 REGRA GLOBAL DE BLOQUEIO
========================= */
export function hasSalaObsAtiva(salaInput) {
  if (!salaInput) return null;

  const salaBase = normalizarSala(salaInput);
  const lista = getSalasObs();

  return (
    lista.find(
      item =>
        item.status === "ativa" &&
        normalizarSala(item.sala) === salaBase
    ) || null
  );
}
