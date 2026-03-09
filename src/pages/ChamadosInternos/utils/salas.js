// ===============================
// Utilitários de salas e localidades
// ===============================

export function normalizeSala(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * REGRA FIXA (como no código antigo que funcionava):
 * LOCAL - PRÉDIO - ANDAR - SALA - EQUIPAMENTO
 *
 * Exemplo:
 * JB-LQ303-9AND-SL902-X50
 */
export function splitSala(raw) {
  const s = normalizeSala(raw)
  const partes = s.split("-")

  return {
    nomeCompleto: s,
    local: partes[0] || "",
    predio: partes[1] || "",
    andar: partes[2] || "",
    sala: partes.length >= 5 ? partes[3] : "",
    equipamento:
      partes.length >= 5
        ? partes[4]
        : partes[partes.length - 1] || "",
  }
}

// ===============================
// Localidade / Prédio Macro
// ===============================

export function mapLocalidade(v) {
  const t = String(v || "").toUpperCase().trim()
  if (!t) return ""

  if (t === "SEDE") return "BSA"
  if (t === "BL2A") return "CITTÁ"
  if (t === "CITTA") return "CITTÁ"

  return t
}

/**
 * Base usada para prioridade
 * (LOCAL + PRÉDIO + ANDAR + SALA)
 */
export function salaBaseParaPrioridade(nomeCompleto = "") {
  const partes = normalizeSala(nomeCompleto).split("-")
  return partes.slice(0, 4).join("-")
}

export const PREDIOS_MACRO = [
  "LQ303",
  "JB695",
  "PL70",
  "ION",
  "CITTÁ",
  "SP",
  "EG",
  "DF",
  "PE",
  "POA",
  "BH",
]

export function getPredioMacro(chamado) {
  const nome = normalizeSala(chamado?.nomeCompleto || "")
  const local = mapLocalidade(chamado?.local || "")
  const predio = String(chamado?.predio || "").toUpperCase().trim()

  if (nome.includes("LQ303") || predio === "LQ303") return "LQ303"
  if (nome.includes("JB695") || predio === "JB695") return "JB695"
  if (nome.includes("PL70") || predio === "PL70") return "PL70"
  if (nome.includes("ION-") || local === "ION") return "ION"
  if (
    nome.includes("CITTA") ||
    nome.includes("CITTÁ") ||
    predio === "BL2A" ||
    local === "CITTÁ"
  )
    return "CITTÁ"

  if (local === "SP") return "SP"
  if (local === "EG") return "EG"
  if (local === "DF") return "DF"
  if (local === "PE") return "PE"
  if (local === "POA") return "POA"
  if (local === "BH") return "BH"

  return local || predio || ""
}

// ===============================
// Equipes
// ===============================

export function normalizeEquipe(s) {
  const t = String(s || "").toUpperCase().trim()
  if (!t) return ""

  if (t.includes("TELECOM")) return "FIELD TELECOM"
  if (t.includes("SUPINFRA")) return "SUPINFRA"
  if (t.includes("ENERGIA")) return "ENERGIA"
  if (t.includes("DCCM") || t.includes("NETOPS")) return "NETOPS"
  if (t.includes("MONITORACAO")) return "MONITORACAO"
  if (t.includes("VIDEOCONF")) return "VIDEOCONFERÊNCIA"

  return ""
}

export const EQUIPES = [
  "VIDEOCONFERÊNCIA",
  "NETOPS",
  "MONITORACAO",
  "FIELD TELECOM",
  "SUPINFRA",
  "ENERGIA",
]
