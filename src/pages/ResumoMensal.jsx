// 📁 src/pages/ResumoMensal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Button, Form } from "react-bootstrap";
import { Bar, Line } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

// ===== dayjs + timezone =====
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const TZ = "America/Sao_Paulo";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// ==== helpers de tema ====
const getCss = (v) =>
  (typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue(v)
    : ""
  ).trim() || "#2F80ED";

const hexToRgba = (hex, a = 1) => {
  const c = (hex || "").replace("#", "");
  if (c.length !== 6) return `rgba(47,128,237,${a})`;
  const n = parseInt(c, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
};

// ==== Empty State p/ gráficos ====
const EmptyChart = ({ msg = "Sem dados para os filtros aplicados." }) => (
  <div
    className="d-flex align-items-center justify-content-center h-100 text-muted"
    style={{ border: "1px dashed var(--border)", borderRadius: 12 }}
  >
    {msg}
  </div>
);

export default function ResumoMensal() {
  const [chamados, setChamados] = useState([]);
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroMes, setFiltroMes] = useState(""); // vazio = todos os meses
  const [exportando, setExportando] = useState(false);

  // ===== opções base de chart (tema) =====
  const chartOptionsBase = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#334155", font: { weight: 600 } },
        },
        tooltip: { backgroundColor: "rgba(15,27,45,.9)" },
      },
      scales: {
        x: {
          grid: { color: "rgba(148,163,184,.15)" },
          ticks: { color: "#475569" },
        },
        y: {
          grid: { color: "rgba(148,163,184,.15)" },
          ticks: { color: "#475569", stepSize: 1, precision: 0 },
          beginAtZero: true,
        },
      },
    }),
    []
  );

  // ====== Funções de data (TZ aware + múltiplos formatos) ======
  const toDay = (v) => {
    if (!v) return null;

    // Se já for Date
    if (v instanceof Date) {
      const d = dayjs(v);
      return d.isValid() ? d.tz(TZ) : null;
    }

    const raw = String(v).trim();
    if (!raw) return null;

    // 1) tenta ISO direto
    let d = dayjs.tz(raw, TZ);
    if (d.isValid()) return d;

    // 2) tenta sem TZ
    d = dayjs(raw);
    if (d.isValid()) return d.tz(TZ);

    // 3) tenta formatos BR comuns
    const formats = [
      "DD/MM/YYYY",
      "DD/MM/YYYY HH:mm",
      "DD/MM/YYYY HH:mm:ss",
      "DD/MM/YYYY - HH:mm",
    ];
    for (const fmt of formats) {
      d = dayjs.tz(raw, fmt, TZ, true);
      if (d.isValid()) return d;
    }

    return null;
  };

  const getMonthIndexTZ = (v) => {
    const d = toDay(v);
    return d ? d.month() : null; // 0..11
  };

  
  // ====================================================
  // 🔥 CARREGAR DIRETO DO SERVIDOR
  // ====================================================
  useEffect(() => {
    async function carregar() {
      try {
        const response = await fetch("http://10.22.142.57:4000/chamados");

        if (!response.ok) {
          throw new Error("Erro ao buscar chamados");
        }

        const dados = await response.json();

        const normalizados = dados.map((c) => ({
          ...c,
          data: c.dataQueda || c.criadoEm || "",
        }));

        setChamados(normalizados);
      } catch (err) {
        console.error("Erro ao carregar chamados:", err);
      }
    }

    carregar();
  }, []);


  // ---------- filtros (com TZ) ----------
  const chamadosFiltrados = useMemo(() => {
    const mesSelecionado = filtroMes ? parseInt(filtroMes, 10) : null;
    const stat = (filtroStatus || "").toUpperCase();

    return chamados.filter((c) => {
      const okEquipe = filtroEquipe
        ? c.equipeAcionada === filtroEquipe
        : true;

      const okStatus = stat
        ? String(c.status || "").toUpperCase() === stat
        : true;

      // Se não tiver mês selecionado, usa todos os meses (relatório unificado)
      const okMes = mesSelecionado
        ? (() => {
            const idx = getMonthIndexTZ(c.data);
            return idx !== null && idx + 1 === mesSelecionado;
          })()
        : true;

      return okEquipe && okStatus && okMes;
    });
  }, [chamados, filtroEquipe, filtroStatus, filtroMes]);

  // ---------- agregação (com TZ) ----------
  const totais = useMemo(() => {
    const base = {
      abertos: 0,
      encerrados: 0,
      porEquipe: {},
      porPrioridade: {},
      porTipo: {},
      porMes: Array(12).fill(0),
    };

    for (const c of chamadosFiltrados) {
      const tipo = c.tipoFalha || c.tipo || "OUTRO";
      const equipe = c.equipeAcionada || "SEM EQUIPE";
      const mes = getMonthIndexTZ(c.data);

      const st = String(c.status || "").toUpperCase();
      if (st === "ABERTO") base.abertos++;
      if (st === "ENCERRADO") base.encerrados++;

      base.porEquipe[equipe] = (base.porEquipe[equipe] || 0) + 1;
      base.porTipo[tipo] = (base.porTipo[tipo] || 0) + 1;

      if (mes !== null) base.porMes[mes]++;

      // prioridade: só considera se existir campo preenchido
      if (typeof c.prioridade !== "undefined" && c.prioridade !== null) {
        const label = c.prioridade ? "Prioritária" : "Comum";
        base.porPrioridade[label] = (base.porPrioridade[label] || 0) + 1;
      }
    }

    return base;
  }, [chamadosFiltrados]);

  // ---------- datasets prontos ----------
  const CHART_COLORS = useMemo(
    () => [
      getCss("--c1"),
      getCss("--c2"),
      getCss("--c3"),
      getCss("--c4"),
      getCss("--c5"),
      getCss("--c6"),
    ],
    []
  );

  const gerarCores = (n) =>
    Array.from({ length: n }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  const buildBarData = useMemo(
    () =>
      (label, dataObj) => {
        const keys = Object.keys(dataObj);
        const cores = gerarCores(keys.length);
        return {
          labels: keys,
          datasets: [
            {
              label,
              data: keys.map((k) => dataObj[k]),
              backgroundColor: cores.map((c) => hexToRgba(c, 0.65)),
              borderColor: cores,
              borderWidth: 1.5,
              borderRadius: 8,
              borderSkipped: false,
              barThickness: 28,
            },
          ],
        };
      },
    [CHART_COLORS]
  );

  const dataEquipe = useMemo(
    () => buildBarData("Equipe", totais.porEquipe),
    [buildBarData, totais.porEquipe]
  );

  const dataPrioridade = useMemo(
    () => buildBarData("Prioridade", totais.porPrioridade),
    [buildBarData, totais.porPrioridade]
  );

  const dataTipo = useMemo(
    () => buildBarData("Tipo de Falha", totais.porTipo),
    [buildBarData, totais.porTipo]
  );

  const dadosGraficoEvolucao = useMemo(
    () => ({
      labels: [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ],
      datasets: [
        {
          label: "Chamados por Mês (TZ: São Paulo)",
          data: totais.porMes,
          fill: true,
          backgroundColor: hexToRgba(getCss("--brand-2"), 0.25),
          borderColor: getCss("--brand-1"),
          tension: 0.35,
          pointBackgroundColor: getCss("--brand-1"),
          borderWidth: 2,
        },
      ],
    }),
    [totais.porMes]
  );

  // flags para evitar gráfico inútil
  const temPrioridade = useMemo(
    () => Object.values(totais.porPrioridade || {}).some((v) => v > 0),
    [totais.porPrioridade]
  );

  const temEquipe = useMemo(
    () => Object.values(totais.porEquipe || {}).some((v) => v > 0),
    [totais.porEquipe]
  );

  const temTipo = useMemo(
    () => Object.values(totais.porTipo || {}).some((v) => v > 0),
    [totais.porTipo]
  );

  const temMes = useMemo(
    () => (totais.porMes || []).some((v) => v > 0),
    [totais.porMes]
  );

  // ---------- exportar PDF ----------
  const exportarPDF = async () => {
    if (exportando) return;
    setExportando(true);
    try {
      const input = document.getElementById("painel-resumo");
      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: "#fff",
      });
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (imgH <= pageH) {
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          0,
          imgW,
          imgH
        );
      } else {
        let sY = 0;
        const chunkH = (canvas.width * pageH) / pageW;
        while (sY < canvas.height) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(chunkH, canvas.height - sY);
          const ctx = pageCanvas.getContext("2d");
          ctx.drawImage(
            canvas,
            0,
            sY,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            canvas.width,
            pageCanvas.height
          );
          pdf.addImage(
            pageCanvas.toDataURL("image/png"),
            "PNG",
            0,
            0,
            imgW,
            (pageCanvas.height * imgW) / canvas.width
          );
          sY += chunkH;
          if (sY < canvas.height) pdf.addPage();
        }
      }
      pdf.save("resumo_mensal.pdf");
    } finally {
      setExportando(false);
    }
  };

  const totalGeral = chamadosFiltrados.length;

  return (
    <div className="container-fluid mt-4" id="painel-resumo">
      <h2 className="h-section mb-3">Resumo Mensal de Chamados</h2>

      {/* KPIs */}
      <div className="kpi-grid mb-3">
        <div className="kpi kpi--success">
          <div className="kpi-content">
            <span className="kpi-title">Encerrados</span>
            <span className="kpi-value">{totais.encerrados}</span>
          </div>
        </div>
        <div className="kpi kpi--danger">
          <div className="kpi-content">
            <span className="kpi-title">Abertos</span>
            <span className="kpi-value">{totais.abertos}</span>
          </div>
        </div>
        <div className="kpi kpi--total">
          <div className="kpi-content">
            <span className="kpi-title">Total (filtros atuais)</span>
            <span className="kpi-value">{totalGeral}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Select
            className="select-soft"
            value={filtroEquipe}
            onChange={(e) => setFiltroEquipe(e.target.value)}
          >
            <option value="">Todas Equipes</option>
            <option value="VIDEOCONFERÊNCIA">Videoconferência</option>
            <option value="NETOPS">NetOps</option>
            <option value="FIELD TELECOM">Field Telecom</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            className="select-soft"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="ABERTO">Aberto</option>
            <option value="ENCERRADO">Encerrado</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            className="select-soft"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          >
            <option value="">Todos os Meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {String(i + 1).padStart(2, "0")}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={1} className="d-grid">
          <Button
            className="btn-brand"
            onClick={exportarPDF}
            disabled={exportando}
          >
            {exportando ? "Exportando..." : "Exportar PDF"}
          </Button>
        </Col>
      </Row>

      {/* Gráficos linha 1 */}
      <Row className="g-3 mb-3">
        <Col md={6} style={{ height: 350 }}>
          <div className="card-soft p-3 h-100">
            <h6 className="mb-2">Chamados por Equipe</h6>
            {temEquipe ? (
              <Bar data={dataEquipe} options={chartOptionsBase} />
            ) : (
              <EmptyChart />
            )}
          </div>
        </Col>
        <Col md={6} style={{ height: 350 }}>
          <div className="card-soft p-3 h-100">
            <h6 className="mb-2">Chamados por Prioridade</h6>
            {temPrioridade ? (
              <Bar data={dataPrioridade} options={chartOptionsBase} />
            ) : (
              <EmptyChart msg="Sem chamados com prioridade registrada." />
            )}
          </div>
        </Col>
      </Row>

      {/* Gráficos linha 2 */}
      <Row className="g-3 mb-4">
        <Col md={6} style={{ height: 350 }}>
          <div className="card-soft p-3 h-100">
            <h6 className="mb-2">Chamados por Tipo de Falha</h6>
            {temTipo ? (
              <Bar data={dataTipo} options={chartOptionsBase} />
            ) : (
              <EmptyChart />
            )}
          </div>
        </Col>
        <Col md={6} style={{ height: 350 }}>
          <div className="card-soft p-3 h-100">
            <h6 className="mb-2">Evolução de Chamados por Mês</h6>
            {temMes ? (
              <Line data={dadosGraficoEvolucao} options={chartOptionsBase} />
            ) : (
              <EmptyChart />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
