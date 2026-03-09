import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:4000";

export default function PainelComparativo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [importando, setImportando] = useState(false);

  const fetchExecutivo = async () => {
    try {
      setLoading(true);
      setErro(null);

      const response = await fetch(`${API_URL}/dashboard/executivo`);

      if (!response.ok) {
        throw new Error("Nenhum snapshot encontrado. Importe um inventário.");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutivo();
  }, []);

  const handleImportar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportando(true);
      setErro(null);

      const text = await file.text();
      const json = JSON.parse(text);

      // ajuste dependendo da estrutura do seu JSON
      const devices = json.data?.devices || json.devices || [];

      if (!devices.length) {
        throw new Error("JSON inválido ou sem devices.");
      }

      const response = await fetch(`${API_URL}/inventario/importar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nomeArquivo: file.name,
          devices
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao importar inventário.");
      }

      await fetchExecutivo();
    } catch (err) {
      setErro(err.message);
    } finally {
      setImportando(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Painel Executivo de Governança VC</h1>

      {/* IMPORTAR JSON */}
      <div style={styles.importBox}>
        <label style={styles.uploadLabel}>
          📥 Importar Inventário JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImportar}
            style={{ display: "none" }}
          />
        </label>

        {importando && <p>Importando inventário...</p>}
      </div>

      {loading && <p>Carregando dados...</p>}

      {erro && <div style={styles.erroBox}>{erro}</div>}

      {data && !loading && (
        <>
          <div style={styles.kpiRow}>
            <KPI
              titulo="Índice Geral de Saúde"
              valor={`${data.indiceSaudeGeral}/100`}
              cor={getCorSaude(data.indiceSaudeGeral)}
            />

            <KPI
              titulo="Disponibilidade"
              valor={`${data.disponibilidade}%`}
              cor={data.disponibilidade >= 95 ? "#16a34a" : "#facc15"}
            />

            <KPI
              titulo="Padronização Firmware"
              valor={`${data.padronizacaoFirmware}%`}
              cor={
                data.padronizacaoFirmware >= 80 ? "#16a34a" : "#f97316"
              }
            />

            <KPI
              titulo="Risco Atual"
              valor={data.riscoAtual}
              cor={getCorRisco(data.riscoAtual)}
            />
          </div>

          <div style={styles.section}>
            <h2>Top Áreas de Risco</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.topRisco?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nome}</td>
                    <td>{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.section}>
            <h2>Insights Estratégicos</h2>
            <ul>
              {data.insights?.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ titulo, valor, cor }) {
  return (
    <div style={{ ...styles.kpiCard, borderTop: `6px solid ${cor}` }}>
      <h3>{titulo}</h3>
      <p style={{ fontSize: "28px", fontWeight: "bold" }}>{valor}</p>
    </div>
  );
}

function getCorSaude(valor) {
  if (valor >= 85) return "#16a34a";
  if (valor >= 70) return "#facc15";
  return "#dc2626";
}

function getCorRisco(risco) {
  switch (risco) {
    case "Baixo":
      return "#16a34a";
    case "Moderado":
      return "#facc15";
    case "Alto":
      return "#f97316";
    case "Crítico":
      return "#dc2626";
    default:
      return "#9ca3af";
  }
}

const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f1f5f9",
    minHeight: "100vh"
  },
  title: {
    marginBottom: "20px"
  },
  importBox: {
    marginBottom: "30px"
  },
  uploadLabel: {
    backgroundColor: "#2563eb",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-block"
  },
  erroBox: {
    backgroundColor: "#fee2e2",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#991b1b"
  },
  kpiRow: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "40px"
  },
  kpiCard: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
    minWidth: "220px"
  },
  section: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
    marginBottom: "30px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  }
};