import { splitSala } from "./salas"

/* ================================
   CSV helpers
================================ */

export function csvEscape(v = "") {
  const s = String(v ?? "")
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function parseEmChamada(v) {
  const t = String(v || "").toUpperCase().trim()
  return t === "SIM" || t === "YES" || t === "TRUE" || t === "1"
}

/* ================================
   CSV parser
================================ */

export function parseCSVFlexible(text) {
  const firstLine = text.split(/\r?\n/)[0] || ""
  const counts = [
    { d: ",", n: (firstLine.match(/,/g) || []).length },
    { d: ";", n: (firstLine.match(/;/g) || []).length },
    { d: "\t", n: (firstLine.match(/\t/g) || []).length },
  ].sort((a, b) => b.n - a.n)

  const delim = counts[0].n > 0 ? counts[0].d : ","

  const rows = []
  let row = []
  let cur = ""
  let inQ = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQ = false
        }
      } else cur += ch
      continue
    }

    if (ch === '"') {
      inQ = true
      continue
    }

    if (ch === "\r") continue

    if (ch === delim) {
      row.push(cur)
      cur = ""
      continue
    }

    if (ch === "\n") {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ""
      continue
    }

    cur += ch
  }

  if (cur.length || row.length) {
    row.push(cur)
    rows.push(row)
  }

  return rows.filter((r) => r.some((c) => String(c).trim() !== ""))
}

/* ================================
   Header mapping
================================ */

export function headerIndexMap(header) {
  const norm = header.map((h) =>
    String(h || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " "),
  )

  const find = (keys) => {
    for (const k of keys) {
      const idx = norm.indexOf(k)
      if (idx !== -1) return idx
    }
    return -1
  }

  return {
    salas: find(["SALAS", "SALA"]),
    falha: find(["FALHA"]),
    chamado: find(["CHAMADO", "Nº CHAMADO"]),
    equipamento: find(["EQUIP", "EQUIPAMENTO"]),
    equipe: find(["EQUIPE"]),
    dataQueda: find(["DATA QUEDA"]),
    dataResta: find(["DATA RESTAURAÇÃO", "DATA RESTAURACAO"]),
    observacoes: find(["OBSERVAÇÕES", "OBSERVACOES", "OBS"]),
    ano: find(["ANO"]),
    mes: find(["MÊS", "MES"]),
    emChamada: find(["EM CHAMADA"]),
  }
}

/* ================================
   🔥 NORMALIZAÇÃO DO CSV (ESSENCIAL)
================================ */

export function buildChamadoFromCSV(row, map, get) {
  const nomeCompleto = get(map.salas)
  const salaParsed = splitSala(nomeCompleto)

  return {
    ...salaParsed, // 🔥 A CORREÇÃO PRINCIPAL

    numeroChamado: get(map.chamado),
    tipoFalha: get(map.falha),
    equipeAcionada: get(map.equipe),
    equipamento: get(map.equipamento) || salaParsed.equipamento,

    dataQueda: get(map.dataQueda),
    dataRestauracao: get(map.dataResta),
    observacoes: get(map.observacoes),
    emChamada: parseEmChamada(get(map.emChamada)),
  }
}
