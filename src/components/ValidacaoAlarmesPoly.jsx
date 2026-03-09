import { useEffect, useState } from "react";

/* ===================== CONSTANTES ===================== */
const SALAS_PRIORITARIAS = new Set([
  "EG-MAC-AUDITORIO",
  "SP-JRM-10AND-PRESI",
  "JB-LQ303-9AND-PRESI",
  "SP-M1-1AND-FANTASTICO",
  "SP-M1-1AND-ESPORTE",
]);

const IA_FEEDBACK_KEY = "ia-feedback-v1";

/* ===================== HELPERS ===================== */
function normalizarSala(v = "") {
  return v
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[._]/g, "-")
    .trim();
}

function extrairSalaDoTexto(txt = "") {
  const m = txt.match(/polylens_([A-Z0-9\-_. ]+)/i);
  return m ? normalizarSala(m[1]) : "";
}

function horasDesde(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

function lerFeedback() {
  try {
    return JSON.parse(localStorage.getItem(IA_FEEDBACK_KEY) || "[]");
  } catch {
    return [];
  }
}

function salvarFeedback(entry) {
  const h = lerFeedback();
  h.push(entry);
  localStorage.setItem(IA_FEEDBACK_KEY, JSON.stringify(h));
}

/* ===================== COMPONENTE ===================== */
export default function ValidacaoAlarmesPoly() {
  const [entrada, setEntrada] = useState("");
  const [alarmes, setAlarmes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [historico, setHistorico] = useState(lerFeedback());

  /* -------- carrega inventário -------- */
  useEffect(() => {
    fetch("/api/devices")
      .then(r => r.json())
      .then(setInventory)
      .catch(() => setInventory([]));
  }, []);

  /* -------- processar texto -------- */
  function processar() {
    const blocos = entrada.split(/\n(?=polylens_)/gi);
    const lista = [];

    blocos.forEach(b => {
      const id = b.match(/\(([^)]+)\)/)?.[1];
      if (!id) return;

      lista.push({
        localTexto: b.split("\n")[0],
        roomDetectada: extrairSalaDoTexto(b),
        deviceId: id,
        status: "AGUARDANDO",
        risco: 0,
        sugestao: "",
      });
    });

    setAlarmes(lista);
  }

  /* -------- analisar JSON da API -------- */
  function analisar(i, jsonTxt) {
    let d;
    try {
      d = JSON.parse(jsonTxt)?.data?.device;
    } catch {
      alert("JSON inválido");
      return;
    }

    const atual = { ...alarmes[i] };
    const inv = inventory.find(
      x => x.deviceId?.toLowerCase() === atual.deviceId.toLowerCase()
    );

    const salaAPI = normalizarSala(d?.room?.name);
    const salaFinal = salaAPI || atual.roomDetectada;

    const ehPrioritaria = SALAS_PRIORITARIAS.has(salaFinal);
    const roomMismatch =
      inv && normalizarSala(inv.room) && normalizarSala(inv.room) !== salaFinal;

    let risco = 0;
    let status = "FALSO";
    let sugestao = "Ignorar";
    let motivo = "Condição conhecida";

    if (!inv) {
      status = "ATENÇÃO";
      risco = 40;
      sugestao = "Device fora do inventário";
      motivo = "deviceId não encontrado";
    }

    if (roomMismatch) {
      status = "CRÍTICO";
      risco = 85;
      sugestao = "Possível troca de equipamento";
      motivo = "room mismatch";
    }

    if (!d.connected && horasDesde(d.lastDetected) > 6) {
      status = "CRÍTICO";
      risco = ehPrioritaria ? 95 : 70;
      sugestao = "Acionar campo";
      motivo = "offline prolongado";
    }

    if (d.callStatus === "IN_CALL") {
      status = "EM CALL";
      risco = 0;
      sugestao = "Não intervir";
      motivo = "sala em chamada";
    }

    if (ehPrioritaria && status !== "CRÍTICO") {
      status = "ATENÇÃO";
      risco = Math.max(risco, 60);
      sugestao = "Validar impacto";
      motivo = "sala prioritária";
    }

    atual.status = status;
    atual.risco = Math.min(risco, 100);
    atual.sugestao = sugestao;
    atual.roomDetectada = salaFinal;
    atual.ia = {
      decisao: sugestao,
      motivo,
      confianca: Math.max(50, 100 - risco),
    };

    const copia = [...alarmes];
    copia[i] = atual;
    setAlarmes(copia);
  }

  /* -------- feedback -------- */
  function feedback(a, aceitou) {
    const entry = {
      deviceId: a.deviceId,
      sala: a.roomDetectada,
      decisaoIA: a.ia?.decisao,
      aceitou,
      ts: new Date().toISOString(),
    };
    salvarFeedback(entry);
    setHistorico(h => [...h, entry]);
  }

  /* -------- export CSV -------- */
  function exportarCSV() {
    const rows = [
      ["deviceId", "sala", "decisao", "aceitou", "data"],
      ...historico.map(h => [
        h.deviceId,
        h.sala,
        h.decisaoIA,
        h.aceitou,
        h.ts,
      ]),
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historico-validacao.csv";
    a.click();
  }

  /* ===================== RENDER ===================== */
  return (
    <div className="container-wide">
      <h4 className="mb-3">📡 Validação de Alarmes – Poly</h4>

      <textarea
        className="form-control mb-2"
        rows={6}
        placeholder="Cole os alarmes (polylens_)"
        value={entrada}
        onChange={e => setEntrada(e.target.value)}
      />

      <button className="btn btn-primary mb-4" onClick={processar}>
        Processar
      </button>

      <div className="row g-3">
        {alarmes.map((a, i) => (
          <div className="col-12 col-xl-6" key={i}>
            <div className="card p-3 h-100">
              <div className="d-flex justify-content-between">
                <strong>{a.roomDetectada || "Sala não identificada"}</strong>
                <span className="badge bg-dark">{a.status}</span>
              </div>

              <div className="text-muted small">Device: {a.deviceId}</div>

              <textarea
                className="form-control mt-3"
                rows={4}
                placeholder="Cole o JSON da Graph API"
                onBlur={e => analisar(i, e.target.value)}
              />

              {a.ia && (
                <div className="mt-3">
                  <strong>IA sugere:</strong> {a.ia.decisao}
                  <div className="small text-muted">
                    {a.ia.motivo} • Confiança {a.ia.confianca}%
                  </div>

                  <div className="mt-2 d-flex gap-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => feedback(a, true)}
                    >
                      Aceitar
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => feedback(a, false)}
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {historico.length > 0 && (
        <div className="mt-4">
          <button className="btn btn-outline-secondary" onClick={exportarCSV}>
            Exportar histórico CSV
          </button>
        </div>
      )}
    </div>
  );
}
