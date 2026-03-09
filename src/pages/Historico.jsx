import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { Save } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

function Historico() {
  const [dados, setDados] = useState([]);
  const [localFiltro, setLocalFiltro] = useState("Todos");
  const [mesFiltro, setMesFiltro] = useState("Todos");

  useEffect(() => {
    const salvos = localStorage.getItem("dadosAnalisados");
    if (salvos) setDados(JSON.parse(salvos));
  }, []);

  const filtrarDados = () => {
    return dados.filter((item) => {
      const data = new Date(item["Event Time"] || item["Data de Início"]);
      const mes = (data.getMonth() + 1).toString().padStart(2, "0") + "/" + data.getFullYear();
      const localMatch = localFiltro === "Todos" || item.Local === localFiltro;
      const mesMatch = mesFiltro === "Todos" || mes === mesFiltro;
      return localMatch && mesMatch;
    });
  };

  const exportarCSV = () => {
    const csv = Papa.unparse(filtrarDados());
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "historico_alarmes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const locais = Array.from(new Set(dados.map((d) => d.Local))).filter(Boolean);
  const meses = Array.from(new Set(
    dados.map((d) => {
      const data = new Date(d["Event Time"] || d["Data de Início"]);
      return (data.getMonth() + 1).toString().padStart(2, "0") + "/" + data.getFullYear();
    })
  ));

  return (
    <div className="container my-5">
      <h2 className="text-primary mb-4">Histórico de Alarmes</h2>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label">Filtrar por Local:</label>
          <select
            className="form-select"
            value={localFiltro}
            onChange={(e) => setLocalFiltro(e.target.value)}
          >
            <option value="Todos">Todos</option>
            {locais.map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Filtrar por Mês:</label>
          <select
            className="form-select"
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
          >
            <option value="Todos">Todos</option>
            {meses.map((mes) => (
              <option key={mes}>{mes}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-success w-100" onClick={exportarCSV}>
            <Save size={18} className="me-2" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              {filtrarDados().length > 0 &&
                Object.keys(filtrarDados()[0]).map((key) => <th key={key}>{key}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtrarDados().map((item, i) => (
              <tr key={i}>
                {Object.entries(item).map(([k, v], j) => (
                  <td key={j}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Historico;
