// Utilitários de data e hora

export const PT_MONTHS = {
  JANEIRO: 0,
  FEVEREIRO: 1,
  MARÇO: 2,
  MARCO: 2,
  ABRIL: 3,
  MAIO: 4,
  JUNHO: 5,
  JULHO: 6,
  AGOSTO: 7,
  SETEMBRO: 8,
  OUTUBRO: 9,
  NOVEMBRO: 10,
  DEZEMBRO: 11,
}

export function toBRDateTime(dt) {
  if (!dt) return ""
  try {
    return new Date(dt).toLocaleString("pt-BR")
  } catch {
    return dt
  }
}

export function diffIndisponibilidade(iniStr, fimStr) {
  if (!iniStr || !fimStr) return "--:--"
  const ini = new Date(iniStr)
  const fim = new Date(fimStr)
  const ms = fim - ini
  if (!isFinite(ms) || ms < 0) return "--:--"
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0")
  const m = (min % 60).toString().padStart(2, "0")
  return `${h}:${m}`
}

export function hhmmToMinutes(hhmm) {
  if (!hhmm || !/\d+:\d+/.test(hhmm)) return null
  const [h, m] = hhmm.split(":").map((n) => Number.parseInt(n, 10))
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

export function minutesToHHMM(min) {
  if (min == null || !isFinite(min)) return ""
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0")
  const m = Math.round(min % 60)
    .toString()
    .padStart(2, "0")
  return `${h}:${m}`
}

export function parsePTDateTime(dateStr = "", timeStr = "") {
  const d = String(dateStr || "").trim()
  const t = String(timeStr || "").trim()
  if (!d) return ""
  const dn = (d.match(/\d+/g) || []).map(Number)
  if (dn.length < 3) return ""
  let day, month, year
  if (d.includes("/") || d.includes("-")) {
    ;[day, month, year] = dn.slice(0, 3)
    if (String(d).startsWith("20") || String(d).startsWith("19")) {
      ;[year, month, day] = dn.slice(0, 3)
    }
  } else {
    return ""
  }
  let h = 0,
    m = 0
  const tn = (t.match(/\d+/g) || []).map(Number)
  if (tn.length >= 2) [h, m] = tn.slice(0, 2)
  const dt = new Date(year, (month || 1) - 1, day || 1, h || 0, m || 0, 0)
  return isNaN(dt) ? "" : dt.toISOString()
}

export function inferCria(ano, mes) {
  const a = Number.parseInt(String(ano || "").replace(/\D/g, ""), 10)
  const mName = String(mes || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
  const m = PT_MONTHS[mName]
  if (!isNaN(a) && m != null) {
    const d = new Date(Date.UTC(a, m, 1, 12, 0, 0))
    return d.toISOString()
  }
  return ""
}

export function ym(iso = "") {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d)) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export const ymRef = (c) => ym(c?.criadoEm || c?.dataQueda)

export function yearFrom(c) {
  const d = c?.criadoEm || c?.dataQueda
  const dt = d ? new Date(d) : null
  return dt && !isNaN(dt) ? dt.getFullYear() : "Sem Ano"
}

export function pct(n, d) {
  if (!d) return "0.0%"
  return `${((n / d) * 100).toFixed(1)}%`
}
