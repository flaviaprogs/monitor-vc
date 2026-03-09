// 📁 src/pages/EvidenciasMTR.jsx
import React, { useState, useMemo } from "react";
import { Row, Col, Form, Table, Alert, Badge, Button } from "react-bootstrap";

/**
 * =========================
 * Helpers de categorização
 * =========================
 */

function buildIssueMetadata(issueTypeRaw, severityRaw) {
  const tipo = (issueTypeRaw || "").toLowerCase();

  let categoria = "Outros";
  let prioridade = "Média";
  let acao =
    "Analisar detalhes no portal Teams Rooms Pro e seguir troubleshooting padrão (rede, credencial, update, reboot controlado).";

  if (tipo.startsWith("sign in")) {
    categoria = "Sign-in / Conta";
    prioridade = "Alta";
    acao =
      "Verificar conta de recurso, licenças (Teams Rooms / Teams), política de acesso condicional e senha; se preciso, refazer login direto no equipamento/console e consultar artigos de sign-in do Teams Rooms.";
  } else if (tipo.startsWith("offline")) {
    categoria = "Offline / Conectividade";
    prioridade = "Alta";
    acao =
      "Checar se o equipamento está ligado, conectado na rede correta (cabo/Wi-Fi), com IP válido e sem bloqueio de proxy/firewall. Validar ping, DNS e se a sala não foi desativada propositalmente.";
  } else if (tipo.startsWith("pairing")) {
    categoria = "Pareamento (Touch / Video Bar)";
    prioridade = "Alta";
    acao =
      "Validar se console e barra de vídeo estão na mesma VLAN/rede, emparelhados para a mesma sala, sem conflitos de IP. Se necessário, desfazer e refazer o pareamento pelo próprio Teams Rooms.";
  } else if (tipo.startsWith("front of room")) {
    categoria = "Display / Front of Room";
    prioridade = "Média";
    acao =
      "Checar cabos HDMI/USB-C, configuração de tela estendida no Windows, resolução suportada pelo monitor e se o Teams Rooms está usando o display correto como Front of Room.";
  } else if (tipo.includes("microphone")) {
    categoria = "Áudio – Microfone";
    prioridade = "Alta";
    acao =
      "No Teams Rooms, conferir em Configurações > Dispositivos se o microfone correto está selecionado, sem conflito com drivers de terceiros. Testar chamada de teste para validar captura de áudio.";
  } else if (tipo.includes("speaker")) {
    categoria = "Áudio – Alto-falante";
    prioridade = "Média";
    acao =
      "Verificar dispositivo de saída configurado (soundbar, TV, DSP), volume, mute físico, cabeamento e drivers. Ajustar em Configurações > Dispositivos do Teams Rooms e testar chamada.";
  } else if (tipo.includes("camera")) {
    categoria = "Vídeo – Câmera";
    prioridade = "Média";
    acao =
      "Garantir que a câmera correta está selecionada no Teams Rooms, sem bloqueio por políticas ou software de terceiros. Testar preview de vídeo na tela de configurações.";
  } else if (tipo.includes("time drift")) {
    categoria = "Tempo / NTP";
    prioridade = "Alta";
    acao =
      "Sincronizar horário do Windows com servidor NTP corporativo. Time drift impacta autenticação, agendamentos e join em reunião; envolver equipe de AD/infra se necessário.";
  } else if (tipo.includes("bluetooth disabled")) {
    categoria = "Bluetooth / Proximity Join";
    prioridade = "Baixa";
    acao =
      "Reativar Bluetooth no equipamento (ou via política) se a sala usar Proximity Join / detecção de proximidade. Caso não utilize, documentar como comportamento aceito.";
  }

  if (/crític|critic/i.test(severityRaw)) prioridade = "Alta";
  if (/aviso/i.test(severityRaw)) prioridade = "Baixa";

  return { categoria, prioridade, acao };
}

/**
 * =========================
 * Parser do texto colado
 * =========================
 *
 * Espera o texto copiado da página de Issues do Teams Rooms Pro,
 * com blocos separados por linhas em branco.
 */

function parseRoomsPortalText(rawText) {
  if (!rawText) return [];

  const blocks = rawText
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const eventos = [];

  blocks.forEach((block, index) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 5) return;

    const issueType = lines[0]; // ex: "Sign in (Teams)", "Offline", "Misconfigured Conferencing Speaker"
    let code = lines[1] || "";
    if (!/^[A-Z0-9\-]+$/.test(code)) {
      // fallback, tenta achar linha com padrão de ID
      const fallbackId = lines.find((l) => /^42T0R5-/.test(l));
      code = fallbackId || `SEM-ID-${index}`;
    }

    const severity =
      lines.find((l) => /crític|critic|importante|aviso/i.test(l)) || "N/D";

    const statusLine =
      lines.find((l) => /requer ação|requires action|needs attention/i.test(l)) ||
      "";

    const role =
      lines.find((l) => /(touch console|mtr para|mtr for|mtr)/i.test(l)) || "";

    // Nome amigável da sala (quando existir)
    const friendlyName =
      lines.find((l) =>
        /(privada com vc|publica com vc|com vc| - publica| - privada)/i.test(l)
      ) || "";

    // Informação de dispositivo/modelo (poly-, yealink-, etc.)
    const deviceInfo =
      lines.find((l) =>
        /(poly-|yealink-|logitech-|crestron-|cisco-|bt-|jb-|sp-|eg-|df-|ion-)/i.test(
          l
        )
      ) || lines[2] || "";

    const times = lines.filter((l) =>
      /\b(day|days|month|months|year|years|hour|hours|minute|minutes|ago)\b/i.test(
        l
      )
    );
    const lastSeen = times[0] || "";
    const firstSeen = times[1] || "";

    const license =
      lines.find((l) => /\bpro\b|\bbasic\b|\bstandard\b/i.test(l)) || "";

    const normalizedSeverity = /crític|critic/i.test(severity)
      ? "Crítico"
      : /importante/i.test(severity)
      ? "Importante"
      : /aviso/i.test(severity)
      ? "Aviso"
      : severity;

    const meta = buildIssueMetadata(issueType, normalizedSeverity);

    eventos.push({
      id: `${code}-${index}`,
      issueType,
      code,
      friendlyName,
      deviceInfo,
      role,
      status: statusLine,
      severity: normalizedSeverity,
      lastSeen,
      firstSeen,
      license,
      categoria: meta.categoria,
      prioridade: meta.prioridade,
      acao: meta.acao,
    });
  });

  return eventos;
}

/**
 * ==============
 * Página
 * ==============
 */

export default function EvidenciasMTR() {
  const [rawText, setRawText] = useState(
    () => localStorage.getItem("evidenciasMTR_raw") || ""
  );
  const [eventos, setEventos] = useState(() => {
    try {
      const saved = localStorage.getItem("evidenciasMTR_parsed");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [filtroSeveridade, setFiltroSeveridade] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [buscaTexto, setBuscaTexto] = useState("");

  const handleProcessar = () => {
    setErro("");
    setLoading(true);
    try {
      const parsed = parseRoomsPortalText(rawText);
      if (!parsed.length) {
        setErro(
          "Não foi possível identificar blocos de issues no texto colado. Confirme se você copiou a lista diretamente do portal Teams Rooms Pro (Ctrl+A / Ctrl+C)."
        );
      }
      setEventos(parsed);
      localStorage.setItem("evidenciasMTR_raw", rawText);
      localStorage.setItem("evidenciasMTR_parsed", JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
      setErro("Erro ao processar o texto. Tente colar novamente.");
    } finally {
      setLoading(false);
    }
  };

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      if (
        filtroSeveridade !== "todas" &&
        ev.severity.toLowerCase() !== filtroSeveridade
      ) {
        return false;
      }
      if (
        filtroCategoria !== "todas" &&
        ev.categoria.toLowerCase() !== filtroCategoria
      ) {
        return false;
      }
      if (buscaTexto.trim()) {
        const t = buscaTexto.toLowerCase();
        const blob = `${ev.issueType} ${ev.code} ${ev.friendlyName} ${ev.deviceInfo} ${ev.role}`.toLowerCase();
        if (!blob.includes(t)) return false;
      }
      return true;
    });
  }, [eventos, filtroSeveridade, filtroCategoria, buscaTexto]);

  const kpiTotal = eventos.length;
  const kpiCriticos = eventos.filter((e) => /crític|critic/i.test(e.severity))
    .length;
  const kpiSignIn = eventos.filter((e) =>
    e.issueType.toLowerCase().startsWith("sign in")
  ).length;

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set();
    eventos.forEach((e) => set.add(e.categoria.toLowerCase()));
    return Array.from(set);
  }, [eventos]);

  return (
    <div className="container-fluid py-3">
      {/* Cabeçalho */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3">
        <div>
          <h5 className="m-0">Evidências MTR – Issues do Teams Rooms Pro</h5>
          <small className="text-muted">
            Cole abaixo o texto copiado da página de issues do Microsoft Teams
            Rooms Pro Management. A tela resume os problemas por tipo, severidade
            e ação sugerida para priorizar troubleshooting.
          </small>
        </div>
      </div>

      {/* Área de entrada de texto */}
      <Row className="g-3 mb-3">
        <Col md={9}>
          <Form.Group controlId="formTextoIssues">
            <Form.Label>Texto das issues (copiado do portal)</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui toda a lista de issues do portal..."
            />
            <Form.Text className="text-muted">
              No portal, use <strong>Ctrl+A</strong> e depois <strong>Ctrl+C</strong> na
              listagem de issues, e cole aqui (<strong>Ctrl+V</strong>).
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={3} className="d-flex flex-column gap-2">
          <Button
            variant="primary"
            className="mt-4"
            onClick={handleProcessar}
            disabled={!rawText.trim() || loading}
          >
            {loading ? "Processando..." : "Processar texto"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setRawText("");
              setEventos([]);
              setErro("");
              localStorage.removeItem("evidenciasMTR_raw");
              localStorage.removeItem("evidenciasMTR_parsed");
            }}
          >
            Limpar tudo
          </Button>
        </Col>
      </Row>

      {erro && (
        <Alert variant="danger" className="mt-2">
          {erro}
        </Alert>
      )}

      {/* KPIs */}
      <Row className="g-3 mb-3">
        <Col md={4}>
          <div className="kpi kpi--total">
            <div className="kpi-content">
              <span className="kpi-title">Total de issues carregadas</span>
              <span className="kpi-value">{kpiTotal}</span>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="kpi kpi--danger">
            <div className="kpi-content">
              <span className="kpi-title">Issues Críticas</span>
              <span className="kpi-value">{kpiCriticos}</span>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="kpi kpi--warning">
            <div className="kpi-content">
              <span className="kpi-title">Issues de Sign-in</span>
              <span className="kpi-value">{kpiSignIn}</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filtros */}
      <Row className="g-3 mb-3">
        <Col md={3}>
          <Form.Label>Severidade</Form.Label>
          <Form.Select
            value={filtroSeveridade}
            onChange={(e) => setFiltroSeveridade(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="crítico">Crítico</option>
            <option value="importante">Importante</option>
            <option value="aviso">Aviso</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Label>Categoria (ação sugerida)</Form.Label>
          <Form.Select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="todas">Todas</option>
            {categoriasDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Label>Busca rápida</Form.Label>
          <Form.Control
            type="text"
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            placeholder="Filtrar por sala, código, tipo de issue, modelo do equipamento..."
          />
        </Col>
      </Row>

      {/* Tabela principal */}
      <div className="dash-card shadow-sm mt-2">
        <div className="dash-card__head d-flex justify-content-between align-items-center">
          <h6 className="m-0">Issues detalhadas</h6>
          <small className="text-muted">
            Use a coluna <strong>Categoria / Ação sugerida</strong> como guia para priorizar
            chamados e tratativas.
          </small>
        </div>
        <div className="dash-card__body table-responsive">
          <Table striped hover size="sm" className="align-middle">
            <thead className="table-dark">
              <tr>
                <th>Tipo de alerta</th>
                <th>Código</th>
                <th>Sala / Descrição</th>
                <th>Dispositivo / Modelo</th>
                <th>Papel</th>
                <th>Severidade</th>
                <th>Categoria</th>
                <th>Última ocorrência</th>
                <th>Primeira ocorrência</th>
                <th>Ação sugerida</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted">
                    Processando texto…
                  </td>
                </tr>
              ) : !eventosFiltrados.length ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted">
                    Nenhuma issue carregada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                eventosFiltrados.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.issueType}</td>
                    <td>{ev.code}</td>
                    <td>{ev.friendlyName || "-"}</td>
                    <td>{ev.deviceInfo}</td>
                    <td>{ev.role || "-"}</td>
                    <td>
                      <Badge
                        bg={
                          /crític|critic/i.test(ev.severity)
                            ? "danger"
                            : /importante/i.test(ev.severity)
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {ev.severity}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        bg={
                          ev.prioridade === "Alta"
                            ? "danger"
                            : ev.prioridade === "Média"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {ev.categoria}
                      </Badge>
                    </td>
                    <td>{ev.lastSeen || "-"}</td>
                    <td>{ev.firstSeen || "-"}</td>
                    <td style={{ maxWidth: 360 }}>{ev.acao}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
