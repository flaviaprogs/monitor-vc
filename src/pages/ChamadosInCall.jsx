// 📁 src/pages/ChamadosInCall.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Row,
  Col,
  Badge,
  Card,
  Dropdown,
  ButtonGroup,
} from "react-bootstrap";
import {
  PlusCircle,
  Trash,
  Edit,
  Search,
  MessageSquare,
  Star,
  FileText,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx"; // npm i xlsx
import "./ChamadosInCall.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/* ========================= Utils ========================= */
const STORAGE_KEY = "chamadosInCallComExp";
const EXPIRACAO_MS = 30 * 24 * 60 * 60 * 1000;
const AVISO_UM_DIA_MS = EXPIRACAO_MS - 24 * 60 * 60 * 1000;

const normalize = (s) => String(s || "").toUpperCase().trim();

const toBRDateTime = (dt) => {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("pt-BR");
  } catch {
    return dt;
  }
};

function csvEscape(v = "") {
  const s = String(v ?? "");
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/* Salas prioritárias (exemplo; ajuste sua lista se precisar) */
const PRIORITY_SALAS_RAW = [
  "SP-M1-TA-REDACAO",
  "SP-M1-TA-SL02",
  "SP-JRM-10AND-PRESI",
  "JB-LQ303-TE-MULTIUSO",
];
const PRIORITY_SET = new Set(PRIORITY_SALAS_RAW.map(normalize));

/* ========================= Página ========================= */
export default function ChamadosInCall() {
  const [mostrarBotaoEmail, setMostrarBotaoEmail] = useState(false);
  const [chamados, setChamados] = useState([]);

  // Carrega do localStorage na montagem e aplica regras de expiração/aviso
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      const diff = Date.now() - (saved?.timestamp || 0);

      if (diff > EXPIRACAO_MS) {
        localStorage.removeItem(STORAGE_KEY);
        setChamados([]);
        return;
      }

      setChamados(saved?.dados || []);

      if (diff > AVISO_UM_DIA_MS) {
        setMostrarBotaoEmail(true);
        setTimeout(() => {
          alert(
            "⚠️ Os registros InCall serão apagados em menos de 24h. Faça backup se necessário."
          );
        }, 0);
      }
    } catch {
      // em caso de JSON inválido, zera
      localStorage.removeItem(STORAGE_KEY);
      setChamados([]);
    }
  }, []);

  // Persiste toda vez que mudar
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now(), dados: chamados })
      );
    } catch {
      /* ignore */
    }
  }, [chamados]);

  // Filtro simples
  const [filtro, setFiltro] = useState("");

  // Modal registro
  const [showModal, setShowModal] = useState(false);
  const [editChamado, setEditChamado] = useState(null);

  // Modal relatório personalizado
  const [showRelModal, setShowRelModal] = useState(false);
  const [customDe, setCustomDe] = useState("");
  const [customAte, setCustomAte] = useState("");

  const camposIniciais = {
    local: "",
    sala: "",
    solicitante: "",
    email: "",
    dataLigacao: "",
    tipoSolicitacao: "",
    solucaoAplicada: "",
    status: "ABERTO",
    observacoes: "",
    indevido: false,
    numeroChamado: "",
    equipeAcionada: "",
    criadoEm: "", // = dataLigacao (não exibimos coluna de abertura)
  };
  const [novoChamado, setNovoChamado] = useState(camposIniciais);

  const abrirModal = (chamado = null) => {
    setEditChamado(chamado);
    setNovoChamado(chamado || camposIniciais);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditChamado(null);
    setNovoChamado(camposIniciais);
  };

  const abrirRelPersonalizado = () => setShowRelModal(true);
  const fecharRelPersonalizado = () => setShowRelModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value.toUpperCase();
    setNovoChamado((prev) => ({ ...prev, [name]: finalValue }));
  };

  const salvarChamado = () => {
    // “abertura” = data da ligação (não exibimos a coluna)
    const criadoEm = editChamado
      ? novoChamado.criadoEm
      : novoChamado.dataLigacao || new Date().toISOString();

    const novoRegistro = {
      ...novoChamado,
      id: editChamado ? editChamado.id : Date.now(),
      prioridade: PRIORITY_SET.has(normalize(novoChamado.sala)),
      status:
        normalize(novoChamado.status) === "ENCERRADO" ? "ENCERRADO" : "ABERTO",
      criadoEm,
    };

    setChamados((prev) =>
      editChamado
        ? prev.map((c) => (c.id === editChamado.id ? novoRegistro : c))
        : [...prev, novoRegistro]
    );

    fecharModal();
  };

  const limparTodos = () => {
    if (window.confirm("Deseja realmente apagar todos os registros?")) {
      setChamados([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const downloadFile = (filename, content, mime = "text/csv;charset=utf-8;") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarCSV = () => {
    // Sem a coluna “Abertura”
    const cab =
      "Local,Sala,Prioritária,Solicitante,Email,DataLigacao,TipoSolicitacao,SolucaoAplicada,Status,Indevido,NumeroChamado,EquipeAcionada,Observacoes\n";

    const linhas = chamados.map((c) =>
      [
        c.local,
        c.sala,
        c.prioridade ? "SIM" : "NAO",
        c.solicitante,
        c.email,
        c.dataLigacao,
        c.tipoSolicitacao,
        c.solucaoAplicada,
        c.status,
        c.indevido ? "SIM" : "NAO",
        c.numeroChamado || "",
        c.equipeAcionada || "",
        (c.observacoes || "").replace(/\n/g, " "),
      ]
        .map(csvEscape)
        .join(",")
    );

    downloadFile("chamados_incall.csv", cab + linhas.join("\n"));
  };

  const enviarPorEmail = () => {
    alert(
      "📤 Simulando envio dos dados para flavi.almeida_youcast@prestador.globo"
    );
  };

  /* WhatsApp — FORMATO ESPECÍFICO */
  const montarZapTexto = (c) => {
    const equipe =
      (c.local || c.equipeAcionada || "").toString().trim().toUpperCase() ||
      "CITTÁ";
    const salaLinha = c.sala || (c.local ? c.local : "-");
    const obsLinha = c.observacoes ? `Obs:${c.observacoes}` : "Obs:-";

    const linhas = [
      "Atendimento *via InCall* Solicita apoio de Imediato.",
      "",
      `EQUIPE ${equipe} - Chamado de atendimento: ${c.numeroChamado || "-"}`,
      `Usuário: ${c.solicitante || "-"}`,
      "",
      salaLinha,
      "",
      `Solicitação: ${c.tipoSolicitacao || "-"}`,
      "",
      obsLinha,
    ];

    return linhas.join("\n");
  };

  const abrirWhatsApp = (c) => {
    // Não enviar quando indevido (apenas registrar)
    if (c.indevido) return;
    const text = encodeURIComponent(montarZapTexto(c));
    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Filtro
  const chamadosFiltrados = useMemo(() => {
    const t = normalize(filtro);
    if (!t) return [...chamados];

    return chamados.filter(
      (c) =>
        normalize(c.local).includes(t) ||
        normalize(c.sala).includes(t) ||
        normalize(c.tipoSolicitacao).includes(t) ||
        normalize(c.numeroChamado).includes(t) ||
        normalize(c.solicitante).includes(t)
    );
  }, [chamados, filtro]);

  // KPIs simples
  const indevidos = chamadosFiltrados.filter((c) => c.indevido).length;
  const validos = chamadosFiltrados.length - indevidos;

  const dadosGrafico = {
    labels: ["Indevidos", "Válidos"],
    datasets: [
      {
        label: "Chamados InCall",
        data: [indevidos, validos],
        backgroundColor: ["#ffc107", "#198754"],
        barThickness: 18,
      },
    ],
  };

  // Prioritárias usadas
  const prioritariasUsadas = useMemo(() => {
    const map = new Map();
    chamados.forEach((c) => {
      if (PRIORITY_SET.has(normalize(c.sala))) {
        const key = normalize(c.sala);
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([nome, qt]) => ({ nome, qt }));
  }, [chamados]);

  /* ========================= Relatórios XLSX (Mensal / Semestral / Anual / Personalizado) ========================= */
  const getPeriodRange = (tipo) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-11

    if (tipo === "mensal") {
      const ini = new Date(y, m, 1, 0, 0, 0);
      const fim = new Date(y, m + 1, 1, 0, 0, 0);
      return [ini, fim];
    }
    if (tipo === "semestral") {
      // semestre vigente
      if (m <= 5) return [new Date(y, 0, 1), new Date(y, 6, 1)];
      return [new Date(y, 6, 1), new Date(y + 1, 0, 1)];
    }
    // anual vigente
    return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
  };

  const filtraPorIntervalo = (lista, ini, fim) =>
    (lista || []).filter((c) => {
      const d = c.dataLigacao || c.criadoEm;
      if (!d) return false;
      const dt = new Date(d);
      return dt >= ini && dt < fim;
    });

  const pct = (n, d) => {
    if (!d) return "0.0%";
    return `${((n / d) * 100).toFixed(1)}%`;
  };

  const aggCount = (lista, keyFn) => {
    const m = new Map();
    lista.forEach((c) => {
      const k = keyFn(c);
      const key = k == null || k === "" ? "N/D" : String(k);
      m.set(key, (m.get(key) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const aggLocal = (lista) => {
    const m = new Map();
    lista.forEach((c) => {
      const key = c.local || "N/D";
      if (!m.has(key)) {
        m.set(key, {
          total: 0,
          indevidos: 0,
          encerrados: 0,
          abertos: 0,
          priorit: 0,
        });
      }
      const it = m.get(key);
      it.total += 1;
      if (c.indevido) it.indevidos += 1;
      if (c.status === "ENCERRADO") it.encerrados += 1;
      if (c.status === "ABERTO") it.abertos += 1;
      if (PRIORITY_SET.has(normalize(c.sala))) it.priorit += 1;
    });

    const rows = [];
    m.forEach((v, k) => {
      rows.push([
        k,
        v.total,
        v.abertos,
        v.encerrados,
        pct(v.encerrados, v.total),
        v.indevidos,
        v.priorit,
      ]);
    });
    rows.sort((a, b) => b[1] - a[1]);
    return rows;
  };

  const buildSheetsAoA = (fonte, periodoLabel) => {
    const total = fonte.length;
    const indev = fonte.filter((c) => c.indevido).length;
    const encerr = fonte.filter((c) => c.status === "ENCERRADO").length;
    const abert = fonte.filter((c) => c.status === "ABERTO").length;
    const priorit = fonte.filter((c) => PRIORITY_SET.has(normalize(c.sala)))
      .length;

    const porLocal = aggLocal(fonte);
    const porTipo = aggCount(fonte, (c) => c.tipoSolicitacao || "N/D");
    const porStatus = aggCount(fonte, (c) => c.status || "N/D");
    const porEquipe = aggCount(fonte, (c) => c.equipeAcionada || "N/D");
    const porPrioritaria = aggCount(fonte, (c) =>
      PRIORITY_SET.has(normalize(c.sala)) ? "SIM" : "NAO"
    );

    const kpisAoA = [
      [`Relatório InCall - ${periodoLabel}`],
      ["Gerado em", new Date().toLocaleString("pt-BR")],
      [],
      ["KPI", "Valor"],
      ["Total de registros", total],
      ["Abertos", abert],
      ["Encerrados", encerr],
      ["% Encerrados", pct(encerr, total)],
      ["Indevidos", indev],
      ["% Indevidos", pct(indev, total)],
      ["Prioritários (salas)", priorit],
    ];

    const locaisAoA = [
      ["Localidade", "Total", "Abertos", "Encerrados", "% Encerrados", "Indevidos", "Prioritários"],
      ...porLocal,
    ];

    const solicitacoesAoA = [
      ["Tipo de Solicitação", "Qtde", "%"],
      ...porTipo.map(([k2, v]) => [k2, v, pct(v, total)]),
    ];

    const statusAoA = [
      ["Status", "Qtde", "%"],
      ...porStatus.map(([k2, v]) => [k2, v, pct(v, total)]),
    ];

    const equipesAoA = [["Equipe Acionada", "Qtde"], ...porEquipe];

    const priorAoA = [["Prioritária", "Qtde"], ...porPrioritaria];

    const detalhesAoA = [
      [
        "Local",
        "Sala",
        "Prioritária",
        "Solicitante",
        "Email",
        "Data Ligação",
        "Tipo Solicitação",
        "Solução Aplicada",
        "Status",
        "Indevido",
        "Nº Chamado",
        "Equipe Acionada",
        "Observações",
      ],
      ...fonte.map((c) => [
        c.local,
        c.sala,
        PRIORITY_SET.has(normalize(c.sala)) ? "SIM" : "NAO",
        c.solicitante,
        c.email,
        toBRDateTime(c.dataLigacao),
        c.tipoSolicitacao || "N/D",
        c.solucaoAplicada || "N/D",
        c.status,
        c.indevido ? "SIM" : "NAO",
        c.numeroChamado || "",
        c.equipeAcionada || "N/D",
        c.observacoes || "",
      ]),
    ];

    return {
      KPIs: kpisAoA,
      Localidades: locaisAoA,
      Solicitações: solicitacoesAoA,
      Status: statusAoA,
      Equipes: equipesAoA,
      Prioritárias: priorAoA,
      Detalhes: detalhesAoA,
    };
  };

  const aoaToSheet = (aoa) => XLSX.utils.aoa_to_sheet(aoa);

  const bookFromSheets = (sheets) => {
    const wb = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([name, aoa]) => {
      const ws = aoaToSheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
    });
    return wb;
  };

  const exportarRelatorioXLSX = (tipo) => {
    const [ini, fim] = getPeriodRange(tipo);
    const fonte = filtraPorIntervalo(chamados, ini, fim);

    const periodoLabel =
      tipo === "mensal"
        ? "Mensal (mês vigente)"
        : tipo === "semestral"
        ? "Semestral (semestre vigente)"
        : "Anual (ano vigente)";

    const sheets = buildSheetsAoA(fonte, periodoLabel);
    const wb = bookFromSheets(sheets);

    const nome =
      tipo === "mensal"
        ? "incall_relatorio_mensal.xlsx"
        : tipo === "semestral"
        ? "incall_relatorio_semestral.xlsx"
        : "incall_relatorio_anual.xlsx";

    XLSX.writeFile(wb, nome);
  };

  const gerarRelatorioPersonalizado = () => {
    if (!customDe || !customAte) {
      alert("Informe as duas datas (De/Até).");
      return;
    }
    const ini = new Date(customDe);
    const fim = new Date(customAte);
    if (!(ini < fim)) {
      alert("Período inválido: 'De' deve ser anterior a 'Até'.");
      return;
    }

    const fonte = filtraPorIntervalo(chamados, ini, fim);
    const label = `Personalizado (${toBRDateTime(ini)} a ${toBRDateTime(fim)})`;
    const sheets = buildSheetsAoA(fonte, label);
    const wb = bookFromSheets(sheets);
    XLSX.writeFile(wb, "incall_relatorio_personalizado.xlsx");
    setShowRelModal(false);
  };

  return (
    <div className="container-fluid py-2" style={{ minHeight: "100vh" }}>
      {mostrarBotaoEmail && (
        <Button variant="warning" onClick={enviarPorEmail} className="mb-2">
          📤 Enviar por e-mail agora
        </Button>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="m-0">Chamados InCall</h4>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant="success" onClick={() => abrirModal()}>
            <PlusCircle size={16} className="me-1" />
            Novo
          </Button>

          {/* Relatórios (XLSX com abas) */}
          <Dropdown as={ButtonGroup}>
            <Button
              variant="dark"
              onClick={() => exportarRelatorioXLSX("mensal")}
              title="Relatório XLSX - mês vigente"
            >
              <FileText size={16} className="me-1" />
              Relatórios
            </Button>
            <Dropdown.Toggle split variant="dark" id="relatorios-incall-split" />
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => exportarRelatorioXLSX("mensal")}>
                Mensal (XLSX)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => exportarRelatorioXLSX("semestral")}>
                Semestral (XLSX)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => exportarRelatorioXLSX("anual")}>
                Anual (XLSX)
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={abrirRelPersonalizado}>
                Personalizado (XLSX)…
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Header>CSV (legado)</Dropdown.Header>
              <Dropdown.Item onClick={exportarCSV}>Exportar CSV</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button variant="secondary" onClick={limparTodos}>
            <Trash size={16} className="me-1" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Filtro */}
      <div className="card mb-2">
        <div className="card-body py-2">
          <Form.Group className="d-flex align-items-center gap-2">
            <Search size={18} />
            <Form.Control
              type="text"
              placeholder="Filtrar por local, sala, tipo, nº chamado ou usuário…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-50"
            />
          </Form.Group>
        </div>
      </div>

      {/* Prioritárias (chips) + Gráfico */}
      <Row className="g-2 mb-3">
        <Col md={7}>
          <Card className="h-100">
            <Card.Body>
              <h6 className="mb-2">Salas Prioritárias (no período salvo)</h6>
              {prioritariasUsadas.length === 0 ? (
                <div className="text-muted small">
                  Nenhuma sala prioritária registrada.
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {prioritariasUsadas.map((p) => (
                    <Badge key={p.nome} bg="danger">
                      <small>{p.nome}</small>
                      <span className="ms-2">({p.qt})</span>
                    </Badge>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="h-100">
            <Card.Body>
              <h6 className="mb-2">Resumo</h6>
              <Bar
                data={dadosGrafico}
                options={{ plugins: { legend: { display: false } } }}
                height={200}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabela */}
      <Table striped bordered hover responsive size="sm">
        <thead className="table-dark small">
          <tr>
            <th>Local</th>
            <th>Sala</th>
            <th>Solicitante</th>
            <th>Email</th>
            <th>Data da Ligação</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Indevido</th>
            <th>Nº Chamado</th>
            <th>Equipe</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody className="small" style={{ fontSize: "0.72rem" }}>
          {chamadosFiltrados.map((c) => (
            <tr
              key={c.id}
              className={
                c.indevido
                  ? "table-warning"
                  : c.status === "ENCERRADO"
                  ? "table-success"
                  : ""
              }
            >
              <td>{c.local}</td>
              <td
                className={
                  PRIORITY_SET.has(normalize(c.sala))
                    ? "text-danger fw-bold"
                    : ""
                }
              >
                {c.sala}{" "}
                {PRIORITY_SET.has(normalize(c.sala)) && (
                  <Star size={14} className="text-danger ms-1" />
                )}
              </td>
              <td>{c.solicitante}</td>
              <td>{c.email}</td>
              <td>{toBRDateTime(c.dataLigacao)}</td>
              <td>{c.tipoSolicitacao}</td>
              <td>
                <Badge bg={c.status === "ENCERRADO" ? "success" : "warning"}>
                  {c.status}
                </Badge>
              </td>
              <td>{c.indevido ? "Sim" : "Não"}</td>
              <td>{c.numeroChamado || "-"}</td>
              <td>{c.equipeAcionada || "-"}</td>
              <td className="d-flex gap-1">
                {!c.indevido && (
                  <Button
                    size="sm"
                    variant="outline-success"
                    title="Enviar WhatsApp"
                    onClick={() => abrirWhatsApp(c)}
                  >
                    <MessageSquare size={16} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline-primary"
                  title="Editar"
                  onClick={() => abrirModal(c)}
                >
                  <Edit size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal: Novo/Editar */}
      <Modal show={showModal} onHide={fecharModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editChamado ? "Editar Registro" : "Novo Registro"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Local</Form.Label>
                  <Form.Control
                    name="local"
                    value={novoChamado.local}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Sala</Form.Label>
                  <Form.Control
                    name="sala"
                    value={novoChamado.sala}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Solicitante</Form.Label>
                  <Form.Control
                    name="solicitante"
                    value={novoChamado.solicitante}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    name="email"
                    value={novoChamado.email}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Data da Ligação</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="dataLigacao"
                    value={novoChamado.dataLigacao}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={novoChamado.status}
                    onChange={handleChange}
                  >
                    <option value="ABERTO">ABERTO</option>
                    <option value="ENCERRADO">ENCERRADO</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label>Tipo de Solicitação</Form.Label>
              <Form.Control
                name="tipoSolicitacao"
                value={novoChamado.tipoSolicitacao}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Solução Aplicada</Form.Label>
              <Form.Control
                name="solucaoAplicada"
                value={novoChamado.solucaoAplicada}
                onChange={handleChange}
              />
            </Form.Group>

            {/* Nº Chamado + Equipe Acionada */}
            <Row className="g-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Nº Chamado</Form.Label>
                  <Form.Control
                    name="numeroChamado"
                    value={novoChamado.numeroChamado}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Equipe Acionada</Form.Label>
                  <Form.Control
                    name="equipeAcionada"
                    value={novoChamado.equipeAcionada}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label="Indevido (não enviar WhatsApp)"
                    name="indevido"
                    checked={novoChamado.indevido}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="observacoes"
                value={novoChamado.observacoes}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarChamado}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Relatório Personalizado */}
      <Modal
        show={showRelModal}
        onHide={fecharRelPersonalizado}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Relatório Personalizado (XLSX)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-2">
              <Col md={6}>
                <Form.Label>De</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={customDe}
                  onChange={(e) => setCustomDe(e.target.value)}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Até</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={customAte}
                  onChange={(e) => setCustomAte(e.target.value)}
                />
              </Col>
            </Row>
            <Form.Text className="text-muted">
              O XLSX terá abas: KPIs, Localidades, Solicitações, Status,
              Equipes, Prioritárias e Detalhes.
            </Form.Text>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharRelPersonalizado}>
            Cancelar
          </Button>
          <Button variant="dark" onClick={gerarRelatorioPersonalizado}>
            Gerar XLSX
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
