import React, { useEffect, useMemo, useState } from "react"
import dayjs from "dayjs"
import "dayjs/locale/pt-br"
import "./Dashboard.css"

dayjs.locale("pt-br")

/* ============================================================
   HELPERS
============================================================ */

const sum = (arr) => arr.reduce((acc, n) => acc + (Number(n) || 0), 0)

function groupBy(arr, keyFn) {
  const map = new Map()
  for (const item of arr) {
    const key = keyFn(item)
    if (!key) continue
    map.set(key, (map.get(key) || []).concat(item))
  }
  return map
}

function toISO(v) {
  if (!v && v !== 0) return ""
  const d = new Date(v)
  if (!isNaN(d)) return d.toISOString()
  return ""
}

function diffMs(a, b) {
  if (!a || !b) return 0
  const x = new Date(a).getTime()
  const y = new Date(b).getTime()
  return isNaN(x) || isNaN(y) ? 0 : Math.max(0, y - x)
}

function fmtHHMM(ms) {
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/* ============================================================
   NORMALIZAÇÃO
============================================================ */

function normalize(raw) {
  const criadoEm = toISO(raw.dataQueda || raw.criadoEm)
  const restauradoISO = toISO(raw.dataRestauracao)

  const indispMs =
    raw.tempoIndisponibilidade
      ? Number(raw.tempoIndisponibilidade)
      : diffMs(criadoEm, restauradoISO)

  return {
    ...raw,
    criadoEm,
    restauradoISO,
    indispMs,
  }
}

/* ============================================================
   COMPONENTE
============================================================ */

export default function Dashboard() {

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch("http://10.22.142.57:4000/chamados")
        const data = await res.json()
        setList(data.map(normalize))
      } catch (e) {
        console.error("Erro:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const metricas = useMemo(() => {

    const total = list.length

    const abertos = list.filter(c =>
      String(c.status).toUpperCase().includes("ABERTO")
    ).length

    const encerrados = list.filter(c =>
      String(c.status).toUpperCase().includes("ENCERR")
    ).length

    const salasEmChamada = list.filter(
      c => Number(c.emChamada) === 1
    ).length

    const prioritarias = list.filter(
      c => Number(c.prioridade) === 1
    ).length

    const resetsRemotos = list.filter(c =>
      /RESET_REMOTO/i.test(String(c.solucao))
    ).length

    const resetsFisicos = list.filter(c =>
      /RESET_FISICO/i.test(String(c.solucao))
    ).length

    const tempoTotal = sum(list.map(c => c.indispMs))
    const tempoMedio = total > 0 ? fmtHHMM(tempoTotal / total) : "00:00"

    const buildRanking = (campo) =>
      Array.from(
        groupBy(list, c => c[campo] || "—"),
        ([nome, arr]) => ({ nome, qtd: arr.length })
      ).sort((a, b) => b.qtd - a.qtd)

    return {
      total,
      abertos,
      encerrados,
      salasEmChamada,
      prioritarias,
      resetsRemotos,
      resetsFisicos,
      tempoMedio,
      porEquipe: buildRanking("equipeAcionada"),
      porLocalidade: buildRanking("local"),
    }

  }, [list])

  return (
    <div className="container-fluid py-4">

      <h4 className="mb-4">Dashboard — Chamados Internos</h4>

      {/* KPIs */}
      <div className="row g-3">

        <KPI label="Total" value={metricas.total} />
        <KPI label="Abertos" value={metricas.abertos} />
        <KPI label="Encerrados" value={metricas.encerrados} />
        <KPI label="Salas em Chamada" value={metricas.salasEmChamada} />
        <KPI label="Prioritárias" value={metricas.prioritarias} />
        <KPI label="Reset Remoto" value={metricas.resetsRemotos} />
        <KPI label="Reset Físico" value={metricas.resetsFisicos} />
        <KPI label="Tempo Médio" value={metricas.tempoMedio} />

      </div>

      {/* Rankings */}
      <div className="row g-4 mt-4">

        <Tabela titulo="Chamados por Equipe" data={metricas.porEquipe} />

        <Tabela titulo="Chamados por Localidade" data={metricas.porLocalidade} />

      </div>

    </div>
  )
}

/* ============================================================
   COMPONENTES
============================================================ */

function KPI({ label, value }) {
  return (
    <div className="col-6 col-md-3 col-lg-2">
      <div className="kpi-card">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
      </div>
    </div>
  )
}

function Tabela({ titulo, data }) {
  return (
    <div className="col-12 col-lg-6">
      <div className="dash-card shadow-sm">
        <div className="dash-card__head">
          <h6>{titulo}</h6>
        </div>
        <div className="dash-card__body table-responsive">
          <table className="table table-sm">
            <thead className="table-dark">
              <tr>
                <th>Nome</th>
                <th>Qtd</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  <td>{r.nome}</td>
                  <td>{r.qtd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}