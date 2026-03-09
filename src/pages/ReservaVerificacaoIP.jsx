// 📁 src/pages/ReservaVerificacaoIP.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Form,
  Table,
  Badge,
  Row,
  Col,
  ButtonGroup,
  Dropdown,
  Alert,
} from "react-bootstrap";
import {
  PlusCircle,
  Trash,
  Search,
  Upload,
  ClipboardCopy,
  FileText,
  Info,
  CheckCircle2,
  ShieldCheck,
  Network,
} from "lucide-react";
import * as XLSX from "xlsx";

/* ========================= Utils ========================= */
const STORAGE_KEY = "reservaVerificacaoIP_v1";
const REGISTROS_KEY = "reservaVerificacaoIP_lista_v1";

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const isValidOctet = (v) => Number.isInteger(v) && v >= 0 && v <= 255;

function ipToParts(ip) {
  const p = String(ip || "").trim().split(".").map((x) => Number(x));
  if (p.length !== 4 || p.some((x) => !isValidOctet(x))) return null;
  return p;
}
function partsToIp(p) {
  if (!p || p.length !== 4) return "";
  return `${p[0]}.${p[1]}.${p[2]}.${p[3]}`;
}
function lastOctet(ip) {
  const p = ipToParts(ip);
  return p ? p[3] : null;
}
function withLastOctet(ip, last) {
  const p = ipToParts(ip);
  if (!p) return "";
  p[3] = clamp(Number(last ?? 0), 0, 255);
  return partsToIp(p);
}
function same24(ipA, ipB) {
  const a = ipToParts(ipA);
  const b = ipToParts(ipB);
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
function isEven(n) {
  const x = Number(n);
  return Number.isFinite(x) && x % 2 === 0;
}
function isOdd(n) {
  const x = Number(n);
  return Number.isFinite(x) && Math.abs(x) % 2 === 1;
}
const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência.");
  } catch {
    alert("Não foi possível copiar. Copie manualmente.");
  }
};
const toBRDateTime = (dt) =>
  dt ? new Date(dt).toLocaleString("pt-BR") : "";

/** CSV escape simples */
const csvEscape = (v = "") => {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/* ========================= Component ========================= */
export default function ReservaVerificacaoIP() {
  const fileRef = useRef(null);

  // Estado principal do formulário
  const [equipamento, setEquipamento] = useState("X50"); // Smart Hub | X50 | TC8
  const [site, setSite] = useState(""); // [SITE]-[PRIORIDADE]-[ANDAR]-[SALA]
  const [mac, setMac] = useState("");
  const [ipAtual, setIpAtual] = useState("");
  const [ipDesejado, setIpDesejado] = useState("");
  const [redeBase, setRedeBase] = useState(""); // ex: 10.xx.xx.0
  const [observacoes, setObservacoes] = useState(
    "- Ignorar reservas anteriores, se houver.\n- Manter padrão de IP (X50 par / TC8 ímpar correspondente)."
  );
  const [mascara, setMascara] = useState("255.255.255.0");
  const [statusTeste, setStatusTeste] = useState("DESCONHECIDO"); // LIVRE | OCUPADO | DESCONHECIDO
  const [comAnalistaLocal, setComAnalistaLocal] = useState(true); // site local vs regional

  // Lista de registros salvos (localStorage)
  const [registros, setRegistros] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(REGISTROS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Persistência do último formulário
  useEffect(() => {
    const payload = {
      equipamento,
      site,
      mac,
      ipAtual,
      ipDesejado,
      redeBase,
      observacoes,
      mascara,
      statusTeste,
      comAnalistaLocal,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [equipamento, site, mac, ipAtual, ipDesejado, redeBase, observacoes, mascara, statusTeste, comAnalistaLocal]);

  // Restaurar último formulário (primeiro load)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        setEquipamento(saved.equipamento ?? "X50");
        setSite(saved.site ?? "");
        setMac(saved.mac ?? "");
        setIpAtual(saved.ipAtual ?? "");
        setIpDesejado(saved.ipDesejado ?? "");
        setRedeBase(saved.redeBase ?? "");
        setObservacoes(saved.observacoes ?? "- Ignorar reservas anteriores, se houver.\n- Manter padrão de IP (X50 par / TC8 ímpar correspondente).");
        setMascara(saved.mascara ?? "255.255.255.0");
        setStatusTeste(saved.statusTeste ?? "DESCONHECIDO");
        setComAnalistaLocal(Boolean(saved.comAnalistaLocal));
      }
    } catch {}
  }, []);

  /* ---------- Regras automáticas ---------- */
  // Se equipamento for TC8 e IP da X50 estiver preenchido, sugerir X50+1
  useEffect(() => {
    if (equipamento === "TC8") {
      const lo = lastOctet(ipAtual);
      if (lo != null && isEven(lo)) {
        // TC8 deve ser ímpar imediatamente após a X50
        const sugestao = withLastOctet(ipAtual, lo + 1);
        if (sugestao && same24(ipAtual, sugestao)) {
          setIpDesejado((prev) => (prev ? prev : sugestao));
        }
      }
    }
  }, [equipamento, ipAtual]);

  // Validações derivadas
  const loAtual = lastOctet(ipAtual);
  const loDesejado = lastOctet(ipDesejado);

  const paridadeOk = useMemo(() => {
    if (equipamento === "X50" && loDesejado != null) return isEven(loDesejado);
    if (equipamento === "TC8" && loDesejado != null) return isOdd(loDesejado);
    return true; // Smart Hub: livre
  }, [equipamento, loDesejado]);

  const paridadeMsg = useMemo(() => {
    if (equipamento === "X50")
      return "X50 deve ficar em número PAR.";
    if (equipamento === "TC8")
      return "TC8 deve ficar no número ÍMPAR imediatamente após a X50 correspondente.";
    return "Smart Hub: pode usar qualquer IP funcional.";
  }, [equipamento]);

  const tc8SegueX50 = useMemo(() => {
    if (equipamento !== "TC8") return true;
    if (loAtual == null || loDesejado == null) return true;
    return loDesejado === loAtual + 1 && same24(ipAtual, ipDesejado);
  }, [equipamento, loAtual, loDesejado, ipAtual, ipDesejado]);

  const rangeOk = useMemo(() => {
    if (!redeBase || !ipDesejado) return true;
    // redeBase esperado como 10.xx.xx.0 (mesmo /24)
    const same = same24(redeBase, ipDesejado);
    return same;
  }, [redeBase, ipDesejado]);

  const podeReservarPeloTeste = useMemo(() => {
    if (statusTeste === "DESCONHECIDO") return null;
    return statusTeste === "LIVRE";
  }, [statusTeste]);

  // Diretriz local vs regional
  const diretriz = useMemo(() => {
    return comAnalistaLocal
      ? "Site local (com analista): pode trocar IP e seguir padrão de paridade."
      : "Site remoto (regional): manter IP atual para evitar derrubar e acionar alguém presencial.";
  }, [comAnalistaLocal]);

  /* ---------- Montagem do chamado ---------- */
  const tituloChamado = "Solicitação de reserva de IP para equipamento de videoconferência";

  const corpoChamado = useMemo(() => {
    const _site = site || "[SITE]-[PRIORIDADE]-[ANDAR]-[SALA]";
    const _equip = equipamento || "[Smart Hub / X50 / TC8]";
    const _mac = mac || "XX:XX:XX:XX:XX:XX";
    const _ip = ipDesejado || "10.xx.xx.xx";
    const _rede = redeBase || "10.xx.xx.0";
    const obsLines = String(observacoes || "").trim();

    return [
      `Local: ${_site}`,
      `Equipamento: ${_equip}`,
      `MAC Address: ${_mac}`,
      `IP desejado: ${_ip}`,
      `Rede: ${_rede}`,
      `Máscara: ${mascara || "255.255.255.0"}`,
      "",
      "Observação:",
      obsLines ? obsLines : "- Ignorar reservas anteriores, se houver.\n- Manter padrão de IP (X50 par / TC8 ímpar correspondente).",
    ].join("\n");
  }, [site, equipamento, mac, ipDesejado, redeBase, observacoes, mascara]);

  /* ---------- Ações ---------- */
  const limparFormulario = () => {
    setEquipamento("X50");
    setSite("");
    setMac("");
    setIpAtual("");
    setIpDesejado("");
    setRedeBase("");
    setObservacoes("- Ignorar reservas anteriores, se houver.\n- Manter padrão de IP (X50 par / TC8 ímpar correspondente).");
    setMascara("255.255.255.0");
    setStatusTeste("DESCONHECIDO");
    setComAnalistaLocal(true);
  };

  const salvarRegistro = () => {
    const novo = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      equipamento,
      site,
      mac,
      ipAtual,
      ipDesejado,
      redeBase,
      mascara,
      statusTeste,
      comAnalistaLocal,
      podeReservarPeloTeste,
      paridadeOk,
      tc8SegueX50,
      rangeOk,
      tituloChamado,
      corpoChamado,
    };
    const prox = [novo, ...registros];
    setRegistros(prox);
    localStorage.setItem(REGISTROS_KEY, JSON.stringify(prox));
    alert("Registro salvo localmente.");
  };

  const excluirRegistro = (id) => {
    if (!window.confirm("Excluir este registro?")) return;
    const prox = registros.filter((r) => r.id !== id);
    setRegistros(prox);
    localStorage.setItem(REGISTROS_KEY, JSON.stringify(prox));
  };

  const resetarRegistros = () => {
    if (!window.confirm("Apagar TODOS os registros locais?")) return;
    setRegistros([]);
    localStorage.removeItem(REGISTROS_KEY);
  };

  const exportarCSV = () => {
    const cab =
      "Data,Equipamento,Site,MAC,IP Atual,IP Desejado,Rede,Máscara,Teste,Com Analista Local,Paridade OK,TC8 segue X50,Range /24 OK\n";
    const linhas = registros.map((r) =>
      [
        toBRDateTime(r.timestamp),
        r.equipamento,
        r.site,
        r.mac,
        r.ipAtual,
        r.ipDesejado,
        r.redeBase,
        r.mascara,
        r.statusTeste,
        r.comAnalistaLocal ? "SIM" : "NÃO",
        r.paridadeOk ? "SIM" : "NÃO",
        r.tc8SegueX50 ? "SIM" : "NÃO",
        r.rangeOk ? "SIM" : "NÃO",
      ]
        .map(csvEscape)
        .join(",")
    );
    const blob = new Blob([cab + linhas.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservas_ip.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importar planilha com colunas simples (opcional): Site,Equipamento,MAC,IPAtual,IPDesejado,Rede,Mask,Teste,Local
  const importarPlanilha = async (file) => {
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rows.length) return alert("Arquivo vazio.");

    const header = rows[0].map((h) => String(h || "").trim().toUpperCase());
    const idx = (name) => header.indexOf(name);

    const iSite = idx("SITE");
    const iEquip = idx("EQUIPAMENTO");
    const iMAC = idx("MAC");
    const iIPA = idx("IPATUAL");
    const iIPD = idx("IPDESEJADO");
    const iRede = idx("REDE");
    const iMask = idx("MASK");
    const iTeste = idx("TESTE");
    const iLocal = idx("LOCAL"); // SIM/NÃO

    if (iSite < 0 || iEquip < 0) {
      return alert('Cabeçalho mínimo: "Site" e "Equipamento".');
    }

    const add = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const _equip = String(r[iEquip] || "X50").toUpperCase();
      const _ipA = String(r[iIPA] || "");
      const _ipD = String(r[iIPD] || "");
      const _rede = String(r[iRede] || "");
      const loA = lastOctet(_ipA);
      const loD = lastOctet(_ipD);

      const _parOk =
        _equip === "X50" ? isEven(loD) : _equip === "TC8" ? isOdd(loD) : true;
      const _tc8seq =
        _equip === "TC8" && loA != null && loD != null
          ? loD === loA + 1 && same24(_ipA, _ipD)
          : true;

      add.push({
        id: Date.now() + i,
        timestamp: new Date().toISOString(),
        equipamento: _equip,
        site: String(r[iSite] || ""),
        mac: String(r[iMAC] || ""),
        ipAtual: _ipA,
        ipDesejado: _ipD,
        redeBase: _rede,
        mascara: String(r[iMask] || "255.255.255.0"),
        statusTeste: String(r[iTeste] || "DESCONHECIDO").toUpperCase(),
        comAnalistaLocal:
          String(r[iLocal] || "SIM").toUpperCase().startsWith("S"),
        podeReservarPeloTeste: null,
        paridadeOk: _parOk,
        tc8SegueX50: _tc8seq,
        rangeOk: _rede && _ipD ? same24(_rede, _ipD) : true,
        tituloChamado,
        corpoChamado: "",
      });
    }
    const prox = [...add, ...registros];
    setRegistros(prox);
    localStorage.setItem(REGISTROS_KEY, JSON.stringify(prox));
    alert(`Importados ${add.length} registros.`);
  };

  /* ========================= UI ========================= */
  return (
    <div className="container-fluid py-2" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="m-0 d-flex align-items-center gap-2">
          <ShieldCheck size={22} />
          Reserva & Verificação de IP — CRA
        </h4>

        <div className="d-flex gap-2 flex-wrap">
          <input
            ref={fileRef}
            className="d-none"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => importarPlanilha(e.target.files?.[0])}
          />
          <Button variant="outline-success" onClick={() => fileRef.current?.click()}>
            <Upload size={16} className="me-1" />
            Importar XLSX
          </Button>

          <Dropdown as={ButtonGroup}>
            <Button variant="dark" onClick={exportarCSV}>
              <FileText size={16} className="me-1" />
              Exportar CSV
            </Button>
            <Dropdown.Toggle split variant="dark" id="exp-split" />
            <Dropdown.Menu>
              <Dropdown.Item onClick={exportarCSV}>Exportar CSV</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button variant="secondary" onClick={resetarRegistros}>
            <Trash size={16} className="me-1" />
            Limpar Registros
          </Button>
        </div>
      </div>

      {/* Checklist & Fluxo */}
      <Row className="g-2 mb-2">
        <Col md={6}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2 d-flex align-items-center gap-2">
                <CheckCircle2 size={18} /> Etapas do Processo
              </h6>
              <ol className="mb-2 small">
                <li>
                  <strong>Verificação Inicial</strong>
                  <ul className="mt-1">
                    <li>Confirmar se o IP está no range correto da rede do site (ex.: 10.x.x.x/24).</li>
                    <li>Verificar resposta no IP atual (ping — fora do browser).</li>
                    <li>Registrar MAC Address do equipamento.</li>
                    <li>Identificar tipo: Smart Hub, X50 ou TC8.</li>
                  </ul>
                </li>
                <li className="mt-2">
                  <strong>Regras de Padronização</strong>
                  <ul className="mt-1">
                    <li>Smart Hub → qualquer IP funcional (reservar o que já estiver ok).</li>
                    <li>X50 → número <b>PAR</b>.</li>
                    <li>TC8 → número <b>ÍMPAR</b> imediatamente após a X50 correspondente (X50=120 → TC8=121).</li>
                  </ul>
                </li>
                <li className="mt-2">
                  <strong>Escolha do IP</strong>
                  <ul className="mt-1">
                    <li>Se já está funcionando → manter IP atual e solicitar reserva no MAC.</li>
                    <li>Se precisa mudar → testar IP livre (ping).</li>
                    <li>Se não responde → pode reservar. Se responde → ocupado, escolher outro.</li>
                  </ul>
                </li>
                <li className="mt-2">
                  <strong>Montagem do Chamado</strong> (abaixo, gerado automaticamente).
                </li>
              </ol>

              <Alert variant="info" className="py-2 small d-flex align-items-center gap-2">
                <Info size={16} />
                {paridadeMsg}
              </Alert>
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2 d-flex align-items-center gap-2">
                <Network size={18} /> Fluxograma (resumo)
              </h6>
              <pre
                className="small"
                style={{
                  background: "#f6f8ff",
                  borderRadius: 8,
                  padding: "0.75rem",
                  whiteSpace: "pre-wrap",
                }}
              >{`[Equipamento fora da monitoração?] 
  │
  ├─> [IP fora do range] → Abrir chamado Telecom (rede)
  │
  └─> [IP dentro do range]
        │
        ├─> [Já funcionando?] 
        │        └─> [Smart Hub] → Reservar IP atual no MAC
        │
        └─> [X50 / TC8] 
                 │
                 ├─> [Segue padrão par/ímpar?] → Reservar IP atual
                 └─> [Não segue]
                        ├─> Testar IP livre (ping)
                        ├─> Se livre → Solicitar reserva
                        └─> Se ocupado → Testar outro`}</pre>

              <Form.Check
                className="mt-2"
                type="switch"
                id="analista-local"
                label={`Diretriz: ${diretriz}`}
                checked={comAnalistaLocal}
                onChange={(e) => setComAnalistaLocal(e.target.checked)}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* Form principal */}
      <div className="card border-0 shadow-sm mb-2">
        <div className="card-body">
          <Row className="g-2">
            <Col md={4}>
              <Form.Label className="small">Local (SITE-PRIORIDADE-ANDAR-SALA)</Form.Label>
              <Form.Control
                value={site}
                onChange={(e) => setSite(e.target.value.toUpperCase())}
                placeholder="CITTA-BL2A-1AND-SL01.1"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="small">Equipamento</Form.Label>
              <Form.Select
                value={equipamento}
                onChange={(e) => setEquipamento(e.target.value)}
              >
                <option>Smart Hub</option>
                <option>X50</option>
                <option>TC8</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small">MAC Address</Form.Label>
              <Form.Control
                value={mac}
                onChange={(e) => setMac(e.target.value.toUpperCase())}
                placeholder="XX:XX:XX:XX:XX:XX"
              />
            </Col>
            <Col md={3}>
              <Form.Label className="small">Máscara</Form.Label>
              <Form.Control
                value={mascara}
                onChange={(e) => setMascara(e.target.value)}
                placeholder="255.255.255.0"
              />
            </Col>

            <Col md={3}>
              <Form.Label className="small">IP Atual (para regra TC8 = X50+1)</Form.Label>
              <Form.Control
                value={ipAtual}
                onChange={(e) => setIpAtual(e.target.value)}
                placeholder="10.xx.xx.120"
              />
            </Col>
            <Col md={3}>
              <Form.Label className="small">IP Desejado</Form.Label>
              <Form.Control
                value={ipDesejado}
                onChange={(e) => setIpDesejado(e.target.value)}
                placeholder="10.xx.xx.121"
              />
            </Col>
            <Col md={3}>
              <Form.Label className="small">Rede (/24)</Form.Label>
              <Form.Control
                value={redeBase}
                onChange={(e) => setRedeBase(e.target.value)}
                placeholder="10.xx.xx.0"
              />
            </Col>
            <Col md={3}>
              <Form.Label className="small">Teste de IP</Form.Label>
              <Form.Select
                value={statusTeste}
                onChange={(e) => setStatusTeste(e.target.value)}
                title="Resultado do ping feito fora do navegador"
              >
                <option>DESCONHECIDO</option>
                <option>LIVRE</option>
                <option>OCUPADO</option>
              </Form.Select>
            </Col>

            <Col md={12}>
              <Form.Label className="small">Observações (vai no corpo)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </Col>
          </Row>

          {/* Alertas de regra */}
          <Row className="mt-2 g-2">
            {!rangeOk && (
              <Col md={6}>
                <Alert variant="danger" className="py-2 small">
                  O IP desejado não pertence ao mesmo /24 da Rede informada.
                </Alert>
              </Col>
            )}
            {!paridadeOk && (
              <Col md={6}>
                <Alert variant="warning" className="py-2 small">
                  Paridade inválida para {equipamento}. {paridadeMsg}
                </Alert>
              </Col>
            )}
            {equipamento === "TC8" && !tc8SegueX50 && (
              <Col md={6}>
                <Alert variant="warning" className="py-2 small">
                  TC8 deve ser o ímpar imediatamente após a X50 do mesmo /24 (X50 = .N → TC8 = .N+1).
                </Alert>
              </Col>
            )}
            {podeReservarPeloTeste != null && (
              <Col md={6}>
                <Alert variant={podeReservarPeloTeste ? "success" : "secondary"} className="py-2 small m-0">
                  {podeReservarPeloTeste
                    ? "Teste indica IP livre — pode solicitar reserva."
                    : "IP respondeu no teste — escolha outro IP para reservar."}
                </Alert>
              </Col>
            )}
          </Row>

          {/* Ações do form */}
          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button
              variant="primary"
              onClick={() => copy(tituloChamado)}
              title="Copiar título"
            >
              <ClipboardCopy size={16} className="me-1" />
              Copiar Título
            </Button>
            <Button
              variant="success"
              onClick={() => copy(corpoChamado)}
              title="Copiar corpo"
            >
              <ClipboardCopy size={16} className="me-1" />
              Copiar Corpo
            </Button>
            <Button variant="dark" onClick={salvarRegistro}>
              <PlusCircle size={16} className="me-1" />
              Salvar Registro
            </Button>
            <Button variant="outline-secondary" onClick={limparFormulario}>
              Limpar Formulário
            </Button>
          </div>
        </div>
      </div>

      {/* Prévia do chamado */}
      <Row className="g-2 mb-2">
        <Col md={6}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2">Título</h6>
              <div className="small">{tituloChamado}</div>
            </div>
          </div>
        </Col>
        <Col md={6}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2">Corpo (prévia)</h6>
              <pre
                className="small"
                style={{ background: "#f8f9fa", borderRadius: 8, padding: "0.75rem" }}
              >
                {corpoChamado}
              </pre>
            </div>
          </div>
        </Col>
      </Row>

      {/* Diretriz Operacional (sem KPIs/gráfico) */}
      <Row className="g-2 mb-3">
        <Col md={12}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-2">Diretriz Operacional</h6>
              <Alert variant={comAnalistaLocal ? "success" : "secondary"} className="small mb-0">
                {diretriz}
              </Alert>
            </div>
          </div>
        </Col>
      </Row>

      {/* Histórico de registros */}
      <div className="card border-0 shadow-sm mb-5">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="m-0">Registros Salvos</h6>
          </div>

          <TabelaRegistros registros={registros} onExcluir={excluirRegistro} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Tabela de registros ---------- */
function TabelaRegistros({ registros, onExcluir }) {
  const [filtroTexto, setFiltroTexto] = useState("");
  const filtrados = useMemo(() => {
    const t = (filtroTexto || "").toLowerCase();
    if (!t) return registros;
    return registros.filter((r) =>
      [
        r.site,
        r.mac,
        r.ipAtual,
        r.ipDesejado,
        r.redeBase,
        r.equipamento,
      ]
        .join(" ")
        .toLowerCase()
        .includes(t)
    );
  }, [registros, filtroTexto]);

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-2">
        <Search size={16} />
        <Form.Control
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          placeholder="Filtrar registros…"
          style={{ maxWidth: 320 }}
          size="sm"
        />
      </div>

      <Table striped bordered hover responsive size="sm">
        <thead className="table-dark small">
          <tr>
            <th>Data</th>
            <th>Site</th>
            <th>Equip</th>
            <th>MAC</th>
            <th>IP Atual</th>
            <th>IP Desejado</th>
            <th>Rede</th>
            <th>Teste</th>
            <th>Paridade</th>
            <th>TC8+1</th>
            <th>/24</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody className="small" style={{ fontSize: "0.78rem" }}>
          {filtrados.map((r) => (
            <tr key={r.id}>
              <td>{toBRDateTime(r.timestamp)}</td>
              <td>{r.site}</td>
              <td>{r.equipamento}</td>
              <td>{r.mac}</td>
              <td>{r.ipAtual}</td>
              <td className={r.paridadeOk ? "" : "text-danger fw-bold"}>
                {r.ipDesejado}
              </td>
              <td>{r.redeBase}</td>
              <td>
                <Badge bg={
                  r.statusTeste === "LIVRE" ? "success" :
                  r.statusTeste === "OCUPADO" ? "warning" : "secondary"
                }>
                  {r.statusTeste}
                </Badge>
              </td>
              <td>
                <Badge bg={r.paridadeOk ? "success" : "danger"}>
                  {r.paridadeOk ? "OK" : "INV."}
                </Badge>
              </td>
              <td>
                <Badge bg={r.tc8SegueX50 ? "success" : "danger"}>
                  {r.tc8SegueX50 ? "OK" : "NÃO"}
                </Badge>
              </td>
              <td>
                <Badge bg={r.rangeOk ? "success" : "danger"}>
                  {r.rangeOk ? "OK" : "NÃO"}
                </Badge>
              </td>
              <td>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-1"
                  onClick={() => copy(r.tituloChamado)}
                >
                  Título
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="me-1"
                  onClick={() => copy(r.corpoChamado || "")}
                >
                  Corpo
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onExcluir(r.id)}
                >
                  <Trash size={14} />
                </Button>
              </td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr>
              <td colSpan={12} className="text-center text-muted">
                Nenhum registro.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
