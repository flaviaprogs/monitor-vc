// 📁 src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import "./Dashboard.css";

dayjs.locale("pt-br");
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/** ========================= Utils robustos ========================= */
const STORAGE_KEYS = [
  "chamadosInternosComExp",
  "chamadosInternos",
  "listaChamados",
];

/** Busca case-insensitive num objeto, aceitando várias chaves candidatas */
function pick(obj, candidates) {
  if (!obj) return undefined;
  const map = new Map(
    Object.keys(obj).map((k) => [k.toLowerCase(), { k, v: obj[k] }])
  );
  for (const c of candidates) {
    const hit = map.get(String(c).toLowerCase());
    if (hit) return hit.v;
  }
  return undefined;
}

/** Converte várias formas de data para ISO seguro */
function toISO(v) {
  if (!v) return "";
  const d = new Date(v);
  if (!isNaN(d)) return d.toISOString();
  // tenta DD/MM/YYYY HH:mm:ss
  const m = String(v).match(
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:[ T,]+(\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (m) {
    const [_, dd, MM, yyyy, hh = "00", mm = "00", ss = "00"] = m;
    const iso = `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
    const d2 = new Date(iso);
    if (!isNaN(d2)) return d2.toISOString();
  }
  return "";
}

/** Diferença entre 2 datas (ISO) em milissegundos */
function diffMs(aISO, bISO) {
  if (!aISO || !bISO) return 0;
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, b - a);
}

/** Formata ms em HH:MM (médio) */
function fmtHHMM(ms) {
  const totalMin = Math.floor(ms / 60000);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Soma segura de array de números */
const sum = (arr) => arr.reduce((acc, n) => acc + (Number(n) || 0), 0);

/** GroupBy genérico */
function groupBy(arr, keyFn) {
  const m = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!k && k !== 0) continue;
    m.set(k, (m.get(k) || []).concat(item));
  }
  return m;
}

/** Tenta montar o "nome completo" da sala, caso seus campos existam */
function salaNomeCompleto(c) {
  // Ex: JB-JB695-1AND-SL107
  const predio = c.predio || "";
  const site = c.site || c.local || "";
  const andar = c.andar || "";
  const sala = c.sala || "";
  const parts = [predio, site, andar, sala].filter(Boolean);
  return parts.length ? parts.join("-") : sala || "—";
}

/** Normaliza um registro conforme sua tabela */
function normalize(raw) {
  // Campos principais
  const predio = pick(raw, ["predio", "prédio", "localidade", "local", "siteCod", "site"]) || "";
  const falha = pick(raw, ["falha", "tipoFalha", "motivo", "descricao"]) || "";
  const status = pick(raw, ["status", "situacao", "state"]) || "";
  const equip = pick(raw, ["equip", "equipamento"]) || "";
  const equipe = pick(raw, ["equipe", "equipeAcionada", "responsavel"]) || "";

  // Datas
  const criadoEm =
    toISO(
      pick(raw, [
        "criadoEm",
        "criado",
        "dataCriacao",
        "abertura",
        "data",
        "createdAt",
      ])
    ) || "";

  const quedaISO =
    toISO(
      pick(raw, ["queda", "dataQueda", "inicio", "inicioFalha", "abertura"])
    ) || criadoEm;

  const restauradoISO =
    toISO(pick(raw, ["restaurado", "dataRestauro", "fim", "restauro"])) || "";

  // Indisponibilidade direto (ex.: "01:58") caso exista
  const indispStr = pick(raw, ["indisp", "indisponibilidade", "mttr"]) || "";
  let indispMs = 0;
  if (indispStr && /^\d{2}:\d{2}(:\d{2})?$/.test(indispStr)) {
    const [h, m, s = "0"] = indispStr.split(":").map(Number);
    indispMs = ((h * 60 + m) * 60 + (Number(s) || 0)) * 1000;
  } else if (quedaISO && restauradoISO) {
    indispMs = diffMs(quedaISO, restauradoISO);
  }

  const solucao =
    pick(raw, ["solucao", "solução", "resolucao", "acao", "acaoTomada"]) || "";

  // Campos pra montar o nome completo da sala
  const site = pick(raw, ["site", "predioDetalhe", "predioSite"]) || "";
  const andar = pick(raw, ["andar"]) || "";
  const sala = pick(raw, ["sala"]) || "";

  return {
    ...raw,
    predio,
    falha,
    status,
    equip,
    equipe,
    criadoEm,
    quedaISO,
    restauradoISO,
    indispMs,
    solucao,
    site,
    andar,
    sala,
    salaNome: salaNomeCompleto({
      predio,
      site,
      andar,
      sala,
    }),
  };
}

/** Carrega lista (API futuramente, por enquanto só localStorage) */
function loadChamados() {
  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const json = JSON.parse(raw);
      const arr = Array.isArray(json)
        ? json
        : json?.value || json?.items || json?.data || [];
      if (Array.isArray(arr) && arr.length) return arr.map(normalize);
    } catch {
      /* ignore */
    }
  }
  return [];
}

/** ========================= Página ========================= */
export default function Dashboard() {
  const [list, setList] = useState([]);

  useEffect(() => {
    setList(loadChamados());
  }, []);

  /** ===== KPIs Gerais ===== */
  const kpi = useMemo(() => {
    const total = list.length;
    const abertos = list.filter((c) =>
      String(c.status).toUpperCase().includes("ABERTO")
    ).length;
    const encerrados = list.filter((c) =>
      String(c.status).toUpperCase().includes("ENCERRA")
    ).length;
    const prioridade = list.filter((c) => !!c.prioridade || /PRIOR/i.test(c.falha)).length;

    // MTTR médio
    const encerradosComTempo = list.filter(
      (c) => c.restauradoISO && c.indispMs > 0
    );
    const mttrMs =
      encerradosComTempo.length > 0
        ? Math.round(sum(encerradosComTempo.map((c) => c.indispMs)) / encerradosComTempo.length)
        : 0;

    const pctEnc = total ? ((encerrados / total) * 100).toFixed(1) + "%" : "0%";

    return {
      total,
      abertos,
      encerrados,
      pctEncerrados: pctEnc,
      prioridade,
      mttr: fmtHHMM(mttrMs),
    };
  }, [list]);

  /** ===== Tabelas Gerenciais ===== */
  // Por Localidade (Prédio)
  const locais = useMemo(() => {
    const byLocal = groupBy(list, (c) => c.predio || "—");
    const rows = [];
    for (const [predio, arr] of byLocal.entries()) {
      const total = arr.length;
      const abertos = arr.filter((c) =>
        String(c.status).toUpperCase().includes("ABERTO")
      ).length;
      const encerrados = arr.filter((c) =>
        String(c.status).toUpperCase().includes("ENCERRA")
      ).length;
      const prioridade = arr.filter(
        (c) => !!c.prioridade || /PRIOR/i.test(c.falha)
      ).length;

      const encerradosComTempo = arr.filter(
        (c) => c.restauradoISO && c.indispMs > 0
      );
      const mttrMs =
        encerradosComTempo.length > 0
          ? Math.round(
              sum(encerradosComTempo.map((c) => c.indispMs)) /
                encerradosComTempo.length
            )
          : 0;
      rows.push({
        predio,
        total,
        abertos,
        encerrados,
        pctEnc:
          total > 0 ? ((encerrados / total) * 100).toFixed(1) + "%" : "0%",
        prioridade,
        mttr: fmtHHMM(mttrMs),
      });
    }
    // Ordena pelo maior total
    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [list]);

  // Falhas (tipo) totais
  const falhasAgg = useMemo(() => {
    const byFalha = groupBy(list, (c) => c.falha || "—");
    const rows = [];
    const total = list.length || 1;
    for (const [falha, arr] of byFalha.entries()) {
      rows.push({
        falha,
        qtd: arr.length,
        pct: ((arr.length / total) * 100).toFixed(1) + "%",
      });
    }
    rows.sort((a, b) => b.qtd - a.qtd);
    return rows;
  }, [list]);

  // Solução totais
  const solucaoAgg = useMemo(() => {
    const bySol = groupBy(list, (c) => (c.solucao || "N/D").toUpperCase());
    const rows = [];
    for (const [solucao, arr] of bySol.entries()) {
      rows.push({ solucao, qtd: arr.length });
    }
    rows.sort((a, b) => b.qtd - a.qtd);
    return rows;
  }, [list]);

  // Falha por Localidade (para gráfico e tabela)
  const falhaPorLocal = useMemo(() => {
    const byLocal = groupBy(list, (c) => c.predio || "—");
    const rows = [];
    for (const [predio, arrLocal] of byLocal.entries()) {
      const byFalha = groupBy(arrLocal, (c) => c.falha || "—");
      for (const [falha, arrFalha] of byFalha.entries()) {
        rows.push({ predio, falha, qtd: arrFalha.length });
      }
    }
    // ordenar por qtd desc
    rows.sort((a, b) => b.qtd - a.qtd);
    return rows;
  }, [list]);

  // Chamados por Sala (Top 10)
  const salasAgg = useMemo(() => {
    const bySala = groupBy(list, (c) => c.salaNome || "—");
    const rows = [];
    for (const [salaNome, arr] of bySala.entries()) {
      rows.push({ salaNome, qtd: arr.length });
    }
    rows.sort((a, b) => b.qtd - a.qtd);
    return rows.slice(0, 10);
  }, [list]);

  // Gráfico: Falhas por Site (Localidade)
  const chartFalhaPorSite = useMemo(() => {
    const byLocal = groupBy(list, (c) => c.predio || "—");
    const labels = [];
    const values = [];
    for (const [predio, arr] of byLocal.entries()) {
      labels.push(predio);
      values.push(arr.length);
    }
    return {
      labels,
      datasets: [
        {
          label: "Falhas",
          data: values,
          borderWidth: 1,
          borderRadius: 10,
          borderSkipped: false,
          backgroundColor: "rgba(64, 156, 255, 0.7)",
          hoverBackgroundColor: "rgba(64, 156, 255, 1)",
        },
      ],
    };
  }, [list]);

  // Gráfico: Falhas (Tipos)
  const chartFalhasTipo = useMemo(() => {
    const labels = falhasAgg.map((r) => r.falha);
    const values = falhasAgg.map((r) => r.qtd);
    return {
      labels,
      datasets: [
        {
          label: "Ocorrências",
          data: values,
          borderWidth: 1,
          borderRadius: 10,
          borderSkipped: false,
          backgroundColor: "rgba(255, 159, 64, 0.75)",
          hoverBackgroundColor: "rgba(255, 159, 64, 1)",
        },
      ],
    };
  }, [falhasAgg]);

  // Gráfico: Soluções
  const chartSolucoes = useMemo(() => {
    const labels = solucaoAgg.map((r) => r.solucao);
    const values = solucaoAgg.map((r) => r.qtd);
    return {
      labels,
      datasets: [
        {
          label: "Qtd",
          data: values,
          borderWidth: 1,
          borderRadius: 10,
          borderSkipped: false,
          backgroundColor: "rgba(153, 102, 255, 0.75)",
          hoverBackgroundColor: "rgba(153, 102, 255, 1)",
        },
      ],
    };
  }, [solucaoAgg]);

  // Gráfico: Salas (Top 10)
  const chartSalas = useMemo(() => {
    const labels = salasAgg.map((r) => r.salaNome);
    const values = salasAgg.map((r) => r.qtd);
    return {
      labels,
      datasets: [
        {
          label: "Chamados",
          data: values,
          borderWidth: 1,
          borderRadius: 10,
          borderSkipped: false,
          backgroundColor: "rgba(25, 192, 141, 0.75)",
          hoverBackgroundColor: "rgba(25, 192, 141, 1)",
        },
      ],
    };
  }, [salasAgg]);

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,.85)",
        cornerRadius: 6,
        padding: 10,
      },
    },
    scales: {
      x: { grid: { color: "rgba(0,0,0,.06)" }, ticks: { autoSkip: true } },
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.08)" }, ticks: { precision: 0 } },
    },
  };

  /** ========================= UI ========================= */
  return (
    <div className="container-fluid py-3">
      {/* Header + KPIs */}
      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-md-3">
          <div className="kpi kpi--info">
            <div className="kpi__label">Total de chamados</div>
            <div className="kpi__value">{kpi.total}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="kpi kpi--warn">
            <div className="kpi__label">Abertos</div>
            <div className="kpi__value">{kpi.abertos}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="kpi kpi--ok">
            <div className="kpi__label">Encerrados</div>
            <div className="kpi__value">{kpi.encerrados}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="kpi kpi--neutral">
            <div className="kpi__label">% Encerrados</div>
            <div className="kpi__value">{kpi.pctEncerrados}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="kpi kpi--dark">
            <div className="kpi__label">MTTR (média)</div>
            <div className="kpi__value">{kpi.mttr}</div>
          </div>
        </div>
      </div>

      {/* Gráficos principais */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-lg-6">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Falhas por Site</h6></div>
            <div className="dash-card__body" style={{ height: 280 }}>
              <Bar options={barOpts} data={chartFalhaPorSite} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Falhas (Tipos)</h6></div>
            <div className="dash-card__body" style={{ height: 280 }}>
              <Bar options={barOpts} data={chartFalhasTipo} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Soluções</h6></div>
            <div className="dash-card__body" style={{ height: 280 }}>
              <Bar options={barOpts} data={chartSolucoes} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Chamados por Sala (Top 10)</h6></div>
            <div className="dash-card__body" style={{ height: 280 }}>
              <Bar options={barOpts} data={chartSalas} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas Gerenciais */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Localidade — Resumo</h6></div>
            <div className="dash-card__body table-responsive">
              <table className="table table-sm align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Localidade</th>
                    <th>Total</th>
                    <th>Abertos</th>
                    <th>Encerrados</th>
                    <th>% Encerrados</th>
                    <th>Prioritário</th>
                    <th>MTTR (HH:MM)</th>
                  </tr>
                </thead>
                <tbody>
                  {locais.map((r) => (
                    <tr key={r.predio}>
                      <td>{r.predio}</td>
                      <td>{r.total}</td>
                      <td>{r.abertos}</td>
                      <td>{r.encerrados}</td>
                      <td>{r.pctEnc}</td>
                      <td>{r.prioridade}</td>
                      <td>{r.mttr}</td>
                    </tr>
                  ))}
                  {locais.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-muted">Sem dados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Falha — Detalhe</h6></div>
            <div className="dash-card__body table-responsive">
              <table className="table table-sm align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Falha</th>
                    <th>Qtde</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {falhasAgg.map((r) => (
                    <tr key={r.falha}>
                      <td>{r.falha}</td>
                      <td>{r.qtd}</td>
                      <td>{r.pct}</td>
                    </tr>
                  ))}
                  {falhasAgg.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted">Sem dados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Falha por Localidade</h6></div>
            <div className="dash-card__body table-responsive">
              <table className="table table-sm align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Localidade</th>
                    <th>Falha</th>
                    <th>Chamados</th>
                  </tr>
                </thead>
                <tbody>
                  {falhaPorLocal.map((r, i) => (
                    <tr key={`${r.predio}-${r.falha}-${i}`}>
                      <td>{r.predio}</td>
                      <td>{r.falha}</td>
                      <td>{r.qtd}</td>
                    </tr>
                  ))}
                  {falhaPorLocal.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted">Sem dados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="dash-card shadow-sm">
            <div className="dash-card__head"><h6 className="m-0">Salas (Top 10)</h6></div>
            <div className="dash-card__body table-responsive">
              <table className="table table-sm align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Sala (Nome Completo)</th>
                    <th>Chamados</th>
                  </tr>
                </thead>
                <tbody>
                  {salasAgg.map((r) => (
                    <tr key={r.salaNome}>
                      <td>{r.salaNome}</td>
                      <td>{r.qtd}</td>
                    </tr>
                  ))}
                  {salasAgg.length === 0 && (
                    <tr><td colSpan={2} className="text-center text-muted">Sem dados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
