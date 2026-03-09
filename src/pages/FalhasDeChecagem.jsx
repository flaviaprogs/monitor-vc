// 📁 src/pages/FalhasDeChecagem.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import { CheckCircle, AlertTriangle } from 'lucide-react';

// -----------------------------
// Helpers visuais
// -----------------------------
function getStatus(condicao) {
  if (condicao) return { variant: "success", icon: <CheckCircle size={16} />, label: "Conforme" };
  return { variant: "warning", icon: <AlertTriangle size={16} />, label: "Atenção" };
}

function Linha({ titulo, valor, valido }) {
  const st = getStatus(Boolean(valido));
  return (
    <tr>
      <td>{titulo}</td>
      <td>{valor}</td>
      <td>
        <Badge bg={st.variant} className="d-inline-flex align-items-center gap-1">
          {st.icon} {st.label}
        </Badge>
      </td>
    </tr>
  );
}

// -----------------------------
// "Ping" HTTP (latência)
// -----------------------------
async function medirLatencia(url = "https://www.google.com/generate_204", repeticoes = 3) {
  let total = 0;
  for (let i = 0; i < repeticoes; i++) {
    const inicio = performance.now();
    try {
      // no-cors pra evitar bloqueio; no-store pra não usar cache
      await fetch(url, { cache: "no-store", mode: "no-cors" });
      total += (performance.now() - inicio);
    } catch (e) {
      // se falhar, considera alto (1s) pra sinalizar problema
      total += 1000;
    }
  }
  return Math.round(total / repeticoes);
}

// =============================================================================
// COMPONENTE
// =============================================================================
function FalhasDeChecagem() {
  // ==============================
  // 1) CHECKLIST (o seu original)
  // ==============================
  const [form, setForm] = useState({
    sala: '',
    data: new Date().toISOString().substring(0, 10),
    chamada: 'OK',
    audio: 'OK',
    video: 'OK',
    tela: 'OK',
    observacoes: ''
  });
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('falhasChecklist')) || [];
    setRegistros(dados);
  }, []);

  const formatarSala = (sala) => {
    return sala.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/gi, '').replace(/--+/g, '-');
  };

  const formatarData = (isoDate) => {
    const [ano, mes, dia] = isoDate.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'sala' ? formatarSala(value) : value });
  };

  const salvar = () => {
    const atualizado = [...registros, form];
    setRegistros(atualizado);
    localStorage.setItem('falhasChecklist', JSON.stringify(atualizado));
    setForm({
      sala: '',
      data: new Date().toISOString().substring(0, 10),
      chamada: 'OK',
      audio: 'OK',
      video: 'OK',
      tela: 'OK',
      observacoes: ''
    });
  };

  const exportarCSV = () => {
    const header = 'Sala,Data,Chamada,Áudio,Vídeo,Tela,Observações\n';
    const linhas = registros.map(r =>
      `${r.sala},${formatarData(r.data)},${r.chamada},${r.audio},${r.video},${r.tela},${r.observacoes}`
    );
    const csv = header + linhas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'falhas_checklist.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limparTodos = () => {
    if (window.confirm('Deseja realmente apagar todos os registros?')) {
      setRegistros([]);
      localStorage.removeItem('falhasChecklist');
    }
  };

  // ========================================
  // 2) DIAGNÓSTICO TEAMS (com LATÊNCIA)
  // ========================================
  const [textoBruto, setTextoBruto] = useState('');
  const [dados, setDados] = useState({
    sala: '',
    data: '',
    bitrate: '',
    fps: '',
    resolucao: '',
    perdaPacote: '',
    codec: '',
    compTela: '',
    latencia: undefined, // ms
  });
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    const armazenado = localStorage.getItem("historicoTeams");
    if (armazenado) setHistorico(JSON.parse(armazenado));
  }, []);

  useEffect(() => {
    localStorage.setItem("historicoTeams", JSON.stringify(historico));
  }, [historico]);

  const extrairNumero = (linha) => {
    const match = (linha || "").match(/[\d,.]+/);
    return match ? match[0].replace(",", ".") : "";
  };

  const handlePaste = async () => {
    const linhas = (textoBruto || "").split("\n");
    const novo = { ...dados, data: new Date().toLocaleString() };

    linhas.forEach((linha) => {
      const texto = (linha || "").toLowerCase();
      if (texto.includes("sp-") || texto.includes("eg-") || texto.includes("jb-")) novo.sala = (linha || "").trim();
      if (texto.includes("taxa de bits recebida")) novo.bitrate = extrairNumero(linha);
      if (texto.includes("taxa de quadros recebidos")) novo.fps = extrairNumero(linha);
      if (texto.includes("resolução recebida")) {
        const val = (linha.split(":")[1] || "").trim().replace("px", "").replace(/\s/g, "");
        novo.resolucao = val;
      }
      if (texto.includes("perda de pacotes recebidos")) novo.perdaPacote = extrairNumero(linha);
      if (texto.includes("codec recebido")) novo.codec = (linha.split(":")[1] || "").trim();
      if (texto.includes("processamento de compartilhamento de tela recebido")) novo.compTela = (linha.split(":")[1] || "").trim();
    });

    // 🔥 mede latência média (ms) e anexa ao registro
    novo.latencia = await medirLatencia();

    setDados(novo);
    setHistorico([novo, ...historico]);
  };

  const handleExportCSVTeams = () => {
    const cabecalho = "Data,Sala,Bitrate,FPS,Resolução,Perda Pacote,Codec,Compart. Tela,Latência(ms)\n";
    const linhas = historico
      .map((h) =>
        `${h.data || ""},${h.sala || ""},${h.bitrate || ""},${h.fps || ""},${h.resolucao || ""},${h.perdaPacote || ""},${h.codec || ""},${h.compTela || ""},${h.latencia ?? ""}`
      )
      .join("\n");
    const csvContent = cabecalho + linhas;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "historico_teams.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearTeams = () => {
    setHistorico([]);
    setDados({
      sala: "",
      data: "",
      bitrate: "",
      fps: "",
      resolucao: "",
      perdaPacote: "",
      codec: "",
      compTela: "",
      latencia: undefined,
    });
    setTextoBruto("");
    localStorage.removeItem("historicoTeams");
  };

  // Limiar sugerido (pode ajustar se quiser ser mais rígido):
  const LIMIAR = {
    bitrateMin: 1.5,  // Mbps para 1080p mínimo
    fpsMin: 15,
    perdaMax: 1,      // %
    latenciaMax: 150, // ms (<= 150 ok; >200 é ruim)
  };

  const v = {
    resolucaoOK: dados.resolucao === "1920x1080",
    bitrateOK: parseFloat(dados.bitrate || "0") >= LIMIAR.bitrateMin,
    fpsOK: parseFloat(dados.fps || "0") >= LIMIAR.fpsMin,
    perdaPacoteOK: parseFloat(dados.perdaPacote || "0") <= LIMIAR.perdaMax,
    codecOK: (dados.codec || "").toLowerCase().includes("h264"),
    compTelaOK: (dados.compTela || "").toLowerCase().includes("hardware"),
    latenciaOK: (dados.latencia ?? 999) <= LIMIAR.latenciaMax,
  };

  const diagnostico = [
    !v.latenciaOK && "Latência alta: indício forte de problema de rede local/provedor.",
    !v.resolucaoOK && "Verifique a resolução da câmera (1920x1080 esperado).",
    !v.bitrateOK && "Bitrate baixo: pode indicar cabeamento ruim ou rede congestionada.",
    !v.fpsOK && "FPS baixo: verifique GPU/codec/CPU do endpoint.",
    !v.perdaPacoteOK && "Alta perda de pacotes: testar conectividade e portas do switch.",
    !v.codecOK && "Codec ≠ H264: conferir configuração do Teams/equipamento.",
    !v.compTelaOK && "Compartilhamento sem aceleração: impacto em desempenho.",
  ].filter(Boolean);

  // KPIs de cards
  const pendentes =
    historico.filter(
      (h) =>
        parseFloat(h.bitrate || "0") < LIMIAR.bitrateMin ||
        parseFloat(h.fps || "0") < LIMIAR.fpsMin ||
        parseFloat(h.perdaPacote || "0") > LIMIAR.perdaMax ||
        (h.latencia ?? 999) > LIMIAR.latenciaMax
    ).length;

  const altaPrioridade = historico.filter((h) => parseFloat(h.perdaPacote || "0") > 5 || (h.latencia ?? 0) > 250).length;

  const mediaFrequencia =
    historico.length > 0 ? (historico.length / new Set(historico.map((h) => h.sala)).size).toFixed(1) : "0.0";

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="container mt-4">
      <h4 className="mb-3">Checklist de Vistoria</h4>

      {/* FORM CHECKLIST */}
      <Form className="mb-3">
        <Row className="mb-2">
          <Col md={4}>
            <Form.Control size="sm" name="sala" value={form.sala} onChange={handleChange} placeholder="Sala (ex: SP-M3-TB-MULTIUSO2)" />
          </Col>
          <Col md={3}>
            <Form.Control size="sm" type="date" name="data" value={form.data} onChange={handleChange} />
          </Col>
          <Col md={5}>
            <Form.Control size="sm" name="observacoes" value={form.observacoes} onChange={handleChange} placeholder="Observações" />
          </Col>
        </Row>

        <Row className="mb-2">
          <Col md={3}>
            <Form.Select size="sm" name="chamada" value={form.chamada} onChange={handleChange}>
              <option value="OK">Chamada OK</option>
              <option value="Ruim">Chamada Ruim</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select size="sm" name="audio" value={form.audio} onChange={handleChange}>
              <option value="OK">Áudio OK</option>
              <option value="Ruim">Áudio Ruim</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select size="sm" name="video" value={form.video} onChange={handleChange}>
              <option value="OK">Vídeo OK</option>
              <option value="Ruim">Vídeo Ruim</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select size="sm" name="tela" value={form.tela} onChange={handleChange}>
              <option value="OK">Tela OK</option>
              <option value="Ruim">Tela Ruim</option>
            </Form.Select>
          </Col>
        </Row>

        <div className="d-flex gap-2">
          <Button size="sm" variant="success" onClick={salvar}>Salvar</Button>
          <Button size="sm" variant="primary" onClick={exportarCSV}>Exportar CSV</Button>
          <Button size="sm" variant="danger" onClick={limparTodos}>🗑️ Limpar Tudo</Button>
        </div>
      </Form>

      <Table striped bordered hover responsive size="sm" className="mb-4">
        <thead className="table-dark">
          <tr>
            <th>Sala</th><th>Data</th><th>Chamada</th><th>Áudio</th><th>Vídeo</th><th>Tela</th><th>Observações</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r, i) => (
            <tr key={i} className={[r.chamada, r.audio, r.video, r.tela].some(val => val === 'Ruim') ? 'table-danger' : ''}>
              <td>{formatarSala(r.sala)}</td>
              <td>{formatarData(r.data)}</td>
              <td>{r.chamada}</td>
              <td>{r.audio}</td>
              <td>{r.video}</td>
              <td>{r.tela}</td>
              <td>{r.observacoes}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* DIAGNÓSTICO TEAMS */}
      <hr />
      <h4 className="mb-3">Diagnóstico Teams</h4>

      <Row className="g-3 mb-3">
        <Col md={3}><Card body><div className="text-muted">Total</div><div className="fs-4 fw-bold text-danger">{historico.length}</div></Card></Col>
        <Col md={3}><Card body><div className="text-muted">Pendentes</div><div className="fs-4 fw-bold text-warning">{pendentes}</div></Card></Col>
        <Col md={3}><Card body><div className="text-muted">Alta Prioridade</div><div className="fs-4 fw-bold text-danger">{altaPrioridade}</div><div className="small text-muted">Perda &gt; 5% ou Latência &gt; 250ms</div></Card></Col>
        <Col md={3}><Card body><div className="text-muted">Média Freq.</div><div className="fs-4 fw-bold text-primary">{mediaFrequencia}</div><div className="small text-muted">Ocorrências por sala</div></Card></Col>
      </Row>

      <Form className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>Colar dados do Teams</Form.Label>
          <Form.Control as="textarea" rows={8} value={textoBruto} onChange={(e) => setTextoBruto(e.target.value)} />
        </Form.Group>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handlePaste}>Interpretar</Button>
          <Button variant="success" onClick={handleExportCSVTeams}>Exportar CSV</Button>
          <Button variant="outline-danger" onClick={handleClearTeams}>Limpar Histórico</Button>
        </div>
      </Form>

      {diagnostico.length > 0 && (
        <Alert variant="warning">
          <strong>Ações sugeridas:</strong>
          <ul className="mb-0">{diagnostico.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
        </Alert>
      )}

      <Table bordered hover responsive size="sm" className="mb-4">
        <thead className="table-light">
          <tr>
            <th>Métrica</th><th>Valor</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          <Linha titulo="Resolução" valor={dados.resolucao} valido={v.resolucaoOK} />
          <Linha titulo="Bitrate (Mbps)" valor={dados.bitrate} valido={v.bitrateOK} />
          <Linha titulo="FPS" valor={dados.fps} valido={v.fpsOK} />
          <Linha titulo="Perda de Pacote" valor={`${dados.perdaPacote || ''}%`} valido={v.perdaPacoteOK} />
          <Linha titulo="Codec" valor={dados.codec} valido={v.codecOK} />
          <Linha titulo="Compart. Tela" valor={dados.compTela} valido={v.compTelaOK} />
          <Linha titulo="Latência (ms)" valor={dados.latencia ?? '-'} valido={v.latenciaOK} />
        </tbody>
      </Table>

      <h6>Histórico Teams</h6>
      <Table striped bordered hover responsive size="sm">
        <thead className="table-dark">
          <tr>
            <th>Data</th><th>Sala</th><th>Bitrate</th><th>FPS</th><th>Resolução</th><th>Perda</th><th>Codec</th><th>Comp. Tela</th><th>Latência</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((h, i) => (
            <tr key={i}>
              <td>{h.data}</td>
              <td>{h.sala}</td>
              <td>{h.bitrate}</td>
              <td>{h.fps}</td>
              <td>{h.resolucao}</td>
              <td>{h.perdaPacote}%</td>
              <td>{h.codec}</td>
              <td>{h.compTela}</td>
              <td>{(h.latencia ?? '') && `${h.latencia} ms`}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default FalhasDeChecagem;
