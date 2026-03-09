// 📁 src/pages/AnaliseCSV.jsx
import React, { useMemo, useState } from "react";
import { parseCSV } from "../utils/parseCSV";
import useCSVAnalyzer from "../hooks/useCSVAnalyzer";
import { exportToCSV } from "../utils/exportToCSV";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default function AnaliseCSV() {
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState(null);

  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [filtroDiagnostico, setFiltroDiagnostico] = useState("");
  const [filtroGravidade, setFiltroGravidade] = useState("");

  // análise vinda do seu hook (mantido)
  const analysis = useCSVAnalyzer(csvData);

  // ===== helpers =====
  const limparFiltros = () => {
    setFiltroEquipe("");
    setFiltroDiagnostico("");
    setFiltroGravidade("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    parseCSV(file, (dados) => {
      // Remove linhas de TEAMS do “Network Path Name”
      const filtrados = (dados || []).filter((item) => {
        const nome = (item["Network Path Name"] || "").toString().toUpperCase();
        return !nome.includes("TEAMS");
      });
      setCsvData(filtrados);
    });
  };

  // ===== coleções para selects =====
  const equipes = useMemo(() => {
    const set = new Set(analysis.map((a) => a.equipe).filter(Boolean));
    return Array.from(set).sort();
  }, [analysis]);

  const diagnosticos = useMemo(() => {
    const set = new Set(analysis.map((a) => a.diagnostico).filter(Boolean));
    return Array.from(set).sort();
  }, [analysis]);

  const gravidades = ["Leve", "Moderada", "Crítica"];

  // ===== aplica filtros =====
  const filteredAnalysis = useMemo(() => {
    return analysis.filter((item) => {
      const equipeOK = filtroEquipe ? item.equipe === filtroEquipe : true;
      const diagOK = filtroDiagnostico ? item.diagnostico === filtroDiagnostico : true;
      const gravOK = filtroGravidade ? item.gravidade === filtroGravidade : true;
      return equipeOK && diagOK && gravOK;
    });
  }, [analysis, filtroEquipe, filtroDiagnostico, filtroGravidade]);

  // ===== contagens (base para gráficos) — usando dados filtrados para refletir a tela =====
  const teamCount = useMemo(() => {
    const acc = {};
    filteredAnalysis.forEach((i) => {
      const k = i.equipe || "N/D";
      acc[k] = (acc[k] || 0) + 1;
    });
    return acc;
  }, [filteredAnalysis]);

  const diagCount = useMemo(() => {
    const acc = {};
    filteredAnalysis.forEach((i) => {
      const k = i.diagnostico || "N/D";
      acc[k] = (acc[k] || 0) + 1;
    });
    return acc;
  }, [filteredAnalysis]);

  const gravCount = useMemo(() => {
    const acc = { Leve: 0, Moderada: 0, Crítica: 0 };
    filteredAnalysis.forEach((i) => {
      if (i.gravidade && acc[i.gravidade] != null) acc[i.gravidade] += 1;
    });
    return acc;
  }, [filteredAnalysis]);

  // ===== datasets de gráficos (cores corporativas Globo-ish) =====
  const CHART_COLORS = {
    blue: "#2f80ed",
    lightBlue: "#56ccf2",
    navy: "#0b1a36",
    green: "#28a745",
    yellow: "#ffc107",
    red: "#dc3545",
    purple: "#6f42c1",
  };

  const PIE_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        backgroundColor: "rgba(11,26,54,.9)",
        padding: 10,
        displayColors: false,
      },
    },
  };

  const BAR_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(11,26,54,.9)",
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(11,26,54,.06)" },
        ticks: { autoSkip: true, maxRotation: 40, minRotation: 0 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(11,26,54,.08)" },
        ticks: { precision: 0 },
      },
    },
  };

  const pieEquipeData = useMemo(() => {
    const labels = Object.keys(teamCount);
    const values = Object.values(teamCount);
    return {
      labels,
      datasets: [
        {
          label: "Chamados por Equipe",
          data: values,
          backgroundColor: labels.map((_, idx) => {
            const COLORS = [CHART_COLORS.blue, CHART_COLORS.lightBlue, CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.yellow];
            return COLORS[idx % COLORS.length];
          }),
          borderWidth: 0,
        },
      ],
    };
  }, [teamCount]);

  const barDiagData = useMemo(() => {
    // ordena top 8 diagnósticos
    const entries = Object.entries(diagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: entries.map(([k]) => k),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: CHART_COLORS.blue,
          borderRadius: 8,
        },
      ],
    };
  }, [diagCount]);

  const barGravData = useMemo(() => {
    const labels = ["Leve", "Moderada", "Crítica"];
    const data = labels.map((k) => gravCount[k] || 0);
    const bg = [CHART_COLORS.green, CHART_COLORS.yellow, CHART_COLORS.red];
    return {
      labels,
      datasets: [{ data, backgroundColor: bg, borderRadius: 8 }],
    };
  }, [gravCount]);

  return (
    <div className="container-fluid py-3">
      {/* ===== CSS EMBUTIDO, sem arquivo separado ===== */}
      <style>{`
        .csv-hero {
          background: linear-gradient(90deg, #0b1a36 0%, #2f80ed 50%, #56ccf2 100%);
          color: #fff;
          padding: 16px 20px;
          border-radius: 14px;
          box-shadow: 0 8px 28px rgba(13, 110, 253, 0.25);
        }
        .csv-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }
        @media (max-width: 992px) {
          .csv-grid { grid-template-columns: 1fr; }
        }
        .csv-card {
          background: #fff;
          border: 1px solid rgba(13,110,253,.08);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.06);
          padding: 16px;
        }
        .csv-toolbar {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 992px) {
          .csv-toolbar { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 576px) {
          .csv-toolbar { grid-template-columns: 1fr; }
        }
        .csv-chart {
          height: 320px;
        }
        .csv-table-wrap {
          max-height: 60vh;
          overflow: auto;
        }
        .csv-btn {
          background: #2f80ed;
          border: none;
        }
        .csv-btn:hover { filter: brightness(.95); }
      `}</style>

      {/* Header */}
      <div className="csv-hero mb-3">
        <h2 className="m-0">Análise Avançada de CSV</h2>
      </div>

      {/* Upload + filtros */}
      <div className="csv-card mb-3">
        <div className="mb-3 d-flex flex-wrap align-items-center gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="form-control"
            style={{ maxWidth: 420 }}
          />
          {fileName && <small className="text-muted">Arquivo carregado: {fileName}</small>}
          {!!analysis.length && (
            <button className="btn btn-outline-secondary ms-auto" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>

        {!!analysis.length && (
          <div className="csv-toolbar">
            <div>
              <label className="form-label mb-1">Equipe</label>
              <select
                className="form-select"
                value={filtroEquipe}
                onChange={(e) => setFiltroEquipe(e.target.value)}
              >
                <option value="">Todas</option>
                {equipes.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label mb-1">Diagnóstico</label>
              <select
                className="form-select"
                value={filtroDiagnostico}
                onChange={(e) => setFiltroDiagnostico(e.target.value)}
              >
                <option value="">Todos</option>
                {diagnosticos.map((diag) => (
                  <option key={diag} value={diag}>{diag}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label mb-1">Gravidade</label>
              <select
                className="form-select"
                value={filtroGravidade}
                onChange={(e) => setFiltroGravidade(e.target.value)}
              >
                <option value="">Todas</option>
                {gravidades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-end">
              <button
                className="btn csv-btn text-white w-100"
                onClick={() => exportToCSV(filteredAnalysis, "analise_avancada.csv")}
              >
                📤 Exportar (filtrado)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      {!!analysis.length && (
        <div className="csv-grid mb-3">
          <div className="csv-card">
            <h5 className="mb-3">Distribuição por Equipe (após filtros)</h5>
            <div className="csv-chart">
              <Pie data={pieEquipeData} options={PIE_OPTIONS} />
            </div>
          </div>

          <div className="csv-card">
            <h5 className="mb-3">Gravidade</h5>
            <div className="csv-chart">
              <Bar data={barGravData} options={BAR_OPTIONS} />
            </div>
          </div>
        </div>
      )}

      {!!analysis.length && (
        <div className="csv-card mb-3">
          <h5 className="mb-3">Top Diagnósticos</h5>
          <div className="csv-chart">
            <Bar data={barDiagData} options={BAR_OPTIONS} />
          </div>
        </div>
      )}

      {/* Tabela */}
      {!!analysis.length && (
        <div className="csv-card">
          <div className="csv-table-wrap">
            <table className="table table-sm table-hover align-middle">
              <thead className="table-dark sticky-top">
                <tr>
                  <th>Sala</th>
                  <th>Equipamento</th>
                  <th>Qtd. Quedas</th>
                  <th>Tempo Total (min)</th>
                  <th>Equipe</th>
                  <th>Diagnóstico</th>
                  <th>Gravidade</th>
                  <th style={{ minWidth: 220 }}>Justificativa / Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnalysis.map((item, index) => {
                  const grav = item.gravidade;
                  const badgeClass =
                    grav === "Crítica"
                      ? "bg-danger"
                      : grav === "Moderada"
                      ? "bg-warning text-dark"
                      : "bg-success";
                  return (
                    <tr key={index}>
                      <td>{item.sala}</td>
                      <td>{item.equipamento}</td>
                      <td>{item.totalQuedas}</td>
                      <td>{item.tempoTotal}</td>
                      <td>{item.equipe}</td>
                      <td>{item.diagnostico}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{item.gravidade}</span>
                      </td>
                      <td>
                        <div>{item.justificativa}</div>
                        {item.gravidade === "Crítica" && (
                          <button
                            className="btn btn-sm btn-outline-danger mt-2"
                            onClick={async () => {
                              const texto = `Solicito análise da equipe ${item.equipe} para a sala ${item.sala} com equipamento ${item.equipamento}.

Diagnóstico: ${item.diagnostico}.

Justificativa: ${item.justificativa}.`;
                              const url =
                                "https://globoservice.service-now.com/now/nav/ui/classic/params/target/com.glideapp.servicecatalog_cat_item_view.do?v=1&sysparm_id=db1795821bb420d02f9887f1f54bcbef&sysparm_link_parent=c2c484fcdba344105c11639014961929&sysparm_catalog=6ee2487cdba344105c1163901496194f&sysparm_catalog_view=catalog_default&sysparm_view=catalog_default";
                              try {
                                await navigator.clipboard.writeText(texto);
                                alert('✅ Texto copiado! Cole no campo "Descreva a solicitação" na tela de abertura do chamado.');
                              } catch {
                                // fallback simples
                                window.prompt("Copie o texto abaixo e cole no chamado:", texto);
                              }
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            🔧 Abrir Chamado
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <button
              className="btn btn-success"
              onClick={() => exportToCSV(filteredAnalysis, "analise_avancada.csv")}
            >
              📤 Exportar Análise para CSV
            </button>
          </div>
        </div>
      )}

      {analysis.length === 0 && fileName && (
        <div className="alert alert-warning mt-3">
          O arquivo foi carregado, mas não há dados analisáveis.
        </div>
      )}
    </div>
  );
}
