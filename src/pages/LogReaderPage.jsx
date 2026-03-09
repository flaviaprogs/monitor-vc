// 📁 src/pages/LogReaderPage.jsx
import React, { useMemo, useRef, useState } from "react";
import pako from "pako";
import untar from "js-untar";
import {
  Upload, Calendar, Search, Download, SlidersHorizontal,
  Bug, Wifi, ShieldAlert, FileText, Copy, RefreshCw
} from "lucide-react";
import "./LogReaderPage.css";

/* ---------- Util: parse timestamps ---------- */
function parseTS(line) {
  let m = line.match(/\b(20\d{2}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\b/);
  if (m) return new Date(`${m[1]}T${m[2]}Z`);
  m = line.match(/\b(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})(?:\.\d{3})?\s+\+\d{4}\b/);
  if (m) {
    const year = new Date().getUTCFullYear();
    return new Date(`${year}-${m[1]}T${m[2]}Z`);
  }
  return null;
}

/* ---------- Redação (anti-vazamento) ---------- */
function redact(text) {
  if (!text) return text;
  const rules = [
    { re:/\b\d{1,3}(\.\d{1,3}){3}\b/g, repl:"[IP]" },
    { re:/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, repl:"[EMAIL]" },
    { re:/\b[A-F0-9]{8}(-[A-F0-9]{4}){3}-[A-F0-9]{12}\b/gi, repl:"[UUID]" },
    { re:/\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi, repl:"[MAC]" },
    { re:/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, repl:"Bearer [TOKEN]" },
  ];
  return rules.reduce((t, r) => t.replace(r.re, r.repl), text);
}

/* ---------- Regras/heurísticas ---------- */
const RX = {
  mediaError:/\b(media\s+error|ICE\s+failure|webrtc|rtp|rtcp|audio\s+device\s+error|camera\s+error)\b/i,
  pairingUnstable:/\b(ConsolePairingMonitor|pairing|auto[- ]?pair|FoR\s+not\s+in\s+a\s+call)\b/i,
  authFail:/\b(401|403|Forbidden|Unauthorized|sign-?in\s+(failed|error)|auth)\b/i,
  highLoad:/\b(CPU\s+(high|over)|OutOfMemory|GC\s+overhead|low\s+memory)\b/i,
  appCrash:/\b(ANR|Application\s+Not\s+Responding|FATAL\s+EXCEPTION|tombstone|native_crash|process\s+crash)\b/i,
  timeSkew:/\b(NTP|clock\s+skew|time\s+sync\s+failed|certificate\s+not\s+yet\s+valid)\b/i,
  linkFlap:/\b(Link\s+(down|up)|eth0|PoE|LLDP|VLAN|DHCP\s+(fail|timeout))\b/i,
  wpAny:/uicontrol\.wallpaper\.(default|name|path)|WallpaperManager|WallpaperCache/i,
  wpDefaultTrue:/uicontrol\.wallpaper\.default\s*:\s*'?(true|1)'?/i,
  wpNameCleared:/uicontrol\.wallpaper\.name\s*:\s*''/i,
  wpPathCleared:/uicontrol\.wallpaper\.path\s*:\s*''/i,
  wpNull:/WallpaperManager:.*custom background.*return null/i,
  wpCacheMiss:/WallpaperCache.*No (cache file available|image files)/i,
  certIssue:/\b(TLS|certificate|trust|PKIX|handshake).*(error|fail|expired|not\s+yet\s+valid)\b/i,
};

const FAILURE_DETECTORS = {
  pairing:{
    label:"Falha de pareamento (X50 ↔ TC8)",
    icon: <Wifi size={16} />,
    tests:[
      l=>RX.pairingUnstable.test(l),
      l=>/lost\s+pair|unpaired|pairing\s+(failed|error)/i.test(l),
    ],
    causes:[
      "TC8 e X50 em VLAN/L2 diferentes (LLDP/multicast bloqueados).",
      "Auto-Pair obsoleto/bugado ou firmware desatualizado.",
      "Flapping de rede/PoE no TC8."
    ],
    fixes:[
      "Mesma VLAN e multicast/LLDP liberados.",
      "Desativar/ativar Auto-Pair e refazer pareamento.",
      "Checar PoE e estabilidade do link; atualizar firmware do bundle."
    ],
  },
  wallpaper:{
    label:"Perda de papel de parede (TC8)",
    icon: <FileText size={16} />,
    tests:[
      l=>RX.wpAny.test(l),
      l=>RX.wpDefaultTrue.test(l)||RX.wpNameCleared.test(l)||RX.wpPathCleared.test(l),
      l=>RX.wpNull.test(l)||RX.wpCacheMiss.test(l),
    ],
    causes:[
      "Política/provisionamento setando `uicontrol.wallpaper.default=True`.",
      "URL/caminho do wallpaper indisponível.",
      "Rotação/campanhas do Teams sobrescrevendo o custom.",
    ],
    fixes:[
      "No Poly Lens, definir `default=False` e preencher name/path.",
      "Ou configurar ‘Custom background’ no TAC (MTR-A) com URL interna.",
      "Desativar rotação/campanhas que trocam o fundo."
    ],
  },
  auth:{
    label:"Falha de autenticação / Sign-in",
    icon: <ShieldAlert size={16} />,
    tests:[ l=>RX.authFail.test(l), l=>/(Conditional\s+Access|network\s+sign-?in\s+failed)/i.test(l)],
    causes:[
      "Credenciais/CA (Acesso Condicional).",
      "Clock skew (NTP) quebrando token/cert.",
      "Cache corrompido ou troca de UPN/licença."
    ],
    fixes:[
      "Revalidar conta/licença e Acesso Condicional.",
      "Sincronizar NTP no X50/TC8.",
      "Limpar cache e refazer login."
    ],
  },
  media:{
    label:"Media/ICE error (áudio/vídeo)",
    icon: <Bug size={16} />,
    tests:[ l=>RX.mediaError.test(l), l=>/(no\s+candidate|ICE\s+disconnected|rtp\s+timeout)/i.test(l)],
    causes:[
      "STUN/TURN/ICE bloqueado (firewall/proxy).",
      "QoS ausente, jitter/packet loss alto.",
      "Bug do app em reuniões XL."
    ],
    fixes:[
      "Liberar portas/endereços ICE/STUN/TURN do Teams.",
      "Aplicar QoS e testar cabeamento/switch.",
      "Atualizar app/firmware; reboot fora do expediente."
    ],
  },
  crash:{
    label:"Travamento / Crash do app",
    icon: <Bug size={16} />,
    tests:[ l=>RX.appCrash.test(l), l=>/(tombstone|ANR)/i.test(l)],
    causes:[
      "Memória/CPU no limite.",
      "Bug de versão.",
      "Drivers HDMI/CEC causando deadlock."
    ],
    fixes:[
      "Atualizar app/firmware; reboot agendado.",
      "Reduzir carga (meetings XL).",
      "Checar cabos/HDMI/CEC; desativar CEC se preciso."
    ],
  },
  load:{
    label:"CPU/Memória alta",
    icon: <SlidersHorizontal size={16} />,
    tests:[ l=>RX.highLoad.test(l) ],
    causes:[
      "Reuniões grandes; múltiplos processos.",
      "Logs/telemetria excessiva."
    ],
    fixes:[
      "Reinício fora do expediente (semanal).",
      "Atualizar app; reduzir processos/paralelos."
    ],
  },
  time:{
    label:"NTP/Clock skew / Certificado",
    icon: <Calendar size={16} />,
    tests:[ l=>RX.timeSkew.test(l)||RX.certIssue.test(l)],
    causes:[
      "NTP indisponível/bloqueado.",
      "Certificado fora da janela ou cadeia incompleta."
    ],
    fixes:[
      "Apontar NTP confiável e liberar na rede.",
      "Ajustar hora; renovar/instalar cadeia de certificados."
    ],
  },
  network:{
    label:"Rede/Link (LLDP/PoE/VLAN/DHCP)",
    icon: <Wifi size={16} />,
    tests:[ l=>RX.linkFlap.test(l) ],
    causes:[
      "VLAN errada; LLDP/multicast bloqueados.",
      "PoE insuficiente; link flappando.",
      "DHCP/DNS intermitente."
    ],
    fixes:[
      "Alinhar VLAN/LLDP; liberar multicast necessário.",
      "Verificar PoE e cabeamento/switch.",
      "Checar DHCP/DNS e latência."
    ],
  },
};

/* ---------- Ranking de arquivos ---------- */
function rankFile(path) {
  const p = (path||"").toLowerCase();
  if (p.includes("/traces/messages")) return 0;
  if (p.includes("healthlog")) return 1;
  if (p.includes("tombstone")) return 2;
  return 3;
}

export default function LogReaderPage() {
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]); // {ts,line,file}
  const [fileList, setFileList] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState({ ERROR:true, WARN:true, CRITICAL:true });
  const [failureKey, setFailureKey] = useState("");
  const [targetFindings, setTargetFindings] = useState([]);

  async function handleOpenTGZ(file) {
    const ab = await file.arrayBuffer();
    const inflated = pako.ungzip(new Uint8Array(ab));
    const entries = await untar(inflated.buffer);

    const all = [];
    const listed = [];
    for (const e of entries.sort((a,b)=>rankFile(a.name)-rankFile(b.name))) {
      if (!e?.blob) continue;
      const text = await e.blob.text();
      listed.push(e.name);
      for (const line of text.split(/\r?\n/)) {
        if (!line) continue;
        const ts = parseTS(line);
        all.push({ ts, line, file:`./${e.name}` });
      }
    }
    setRows(all);
    setFileList(listed);
    setTargetFindings([]);
  }

  const filtered = useMemo(()=>{
    const fromD = from ? new Date(from) : null;
    const toD   = to   ? new Date(to)   : null;
    const qq = (q||"").toLowerCase();

    const isLevel = (line) => {
      const s = line.toUpperCase();
      const hasAny = [" ERROR"," WARN"," CRITICAL"].some(k=>s.includes(k));
      if (!hasAny) return true;
      return (levels.ERROR && s.includes(" ERROR")) ||
             (levels.WARN  && s.includes(" WARN")) ||
             (levels.CRITICAL && s.includes(" CRITICAL"));
    };

    return rows.filter(r=>{
      if (!isLevel(r.line)) return false;
      if (fromD && r.ts && r.ts < fromD) return false;
      if (toD && r.ts && r.ts > toD) return false;
      if (qq && !r.line.toLowerCase().includes(qq)) return false;
      return /(ERROR|WARN|CRITICAL)/i.test(r.line);
    });
  },[rows,from,to,q,levels]);

  function exportTXT() {
    const text = filtered.map(r =>
      `${r.ts ? r.ts.toISOString() : "----"} | ${r.file} | ${redact(r.line)}`
    ).join("\n");
    const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "logs_filtrados.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  function runTargetedDiagnosis() {
    if (!failureKey) { setTargetFindings([]); return; }
    const detector = FAILURE_DETECTORS[failureKey];
    if (!detector) { setTargetFindings([]); return; }

    const base = filtered.length ? filtered : rows;
    const hits = base.filter(r => detector.tests.some(fn=>fn(r.line)));

    // agrupa por arquivo e janela de 2 min
    const sorted = [...hits].sort((a,b)=> (a.ts?.getTime()||0)-(b.ts?.getTime()||0));
    const groups = [];
    let cur=[];
    for (const h of sorted) {
      if (!cur.length) { cur.push(h); continue; }
      const prev = cur[cur.length-1];
      const dt = (h.ts && prev.ts) ? (h.ts - prev.ts) : 0;
      if (h.file === prev.file && dt <= 120000) cur.push(h);
      else { groups.push(cur); cur=[h]; }
    }
    if (cur.length) groups.push(cur);

    const findings = groups.map(g=>{
      const when = g[0].ts || null;
      const file = g[0].file;
      const lines = g.slice(0,8).map(x=>redact(x.line));
      return {
        failure: detector.label,
        icon: detector.icon,
        when, file, lines,
        causes: detector.causes,
        fixes: detector.fixes
      };
    });

    setTargetFindings(findings);
  }

  const hasFile = fileList.length>0;

  return (
    <div className="logs-page container-fluid py-3">
      <h4 className="page-title">Leitor de logs (.tgz) — Diagnóstico orientado</h4>

      {/* Toolbar */}
      <div className="log-toolbar shadow-sm sticky-top">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold"><Upload size={14} className="me-1"/> Arquivo .tgz</label>
            <input
              ref={fileRef}
              type="file"
              accept=".tgz"
              className="form-control"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleOpenTGZ(f);
              }}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-semibold"><Calendar size={14} className="me-1"/> De</label>
            <input type="datetime-local" className="form-control" value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold"><Calendar size={14} className="me-1"/> Até</label>
            <input type="datetime-local" className="form-control" value={to} onChange={e=>setTo(e.target.value)} />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold"><Search size={14} className="me-1"/> Buscar</label>
            <input className="form-control" placeholder='ex.: "media error"' value={q} onChange={e=>setQ(e.target.value)} />
          </div>

          <div className="col-md-2 d-flex gap-2 levels">
            {["ERROR","WARN","CRITICAL"].map(lv=>(
              <button
                key={lv}
                type="button"
                className={`btn btn-chip ${levels[lv] ? "active" : ""} ${lv.toLowerCase()}`}
                onClick={()=>setLevels(v=>({...v, [lv]:!v[lv]}))}
              >
                {lv}
              </button>
            ))}
            <button type="button" className="btn btn-outline-secondary ms-auto" onClick={exportTXT}>
              <Download size={14} className="me-1"/> Exportar .txt
            </button>
          </div>
        </div>
      </div>

      {/* Diagnóstico orientado */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex gap-2 align-items-end flex-wrap">
            <div className="flex-grow-1">
              <label className="form-label fw-semibold small"><SlidersHorizontal size={14} className="me-1"/> Diagnóstico orientado (selecione a falha)</label>
              <select className="form-select" value={failureKey} onChange={e=>setFailureKey(e.target.value)}>
                <option value="">— selecione —</option>
                <option value="pairing">Falha de pareamento (X50 ↔ TC8)</option>
                <option value="wallpaper">Perda de papel de parede (TC8)</option>
                <option value="auth">Falha de autenticação / Sign-in</option>
                <option value="media">Media/ICE error (áudio/vídeo)</option>
                <option value="crash">Travamento / Crash do app</option>
                <option value="load">CPU/Memória alta</option>
                <option value="time">NTP/Clock skew / Certificado</option>
                <option value="network">Rede/Link (LLDP/PoE/VLAN/DHCP)</option>
              </select>
            </div>
            <button className="btn btn-primary btn-run" onClick={runTargetedDiagnosis}>
              <Bug size={16} className="me-1"/> Buscar no log
            </button>
          </div>
        </div>
      </div>

      {/* Estado vazio */}
      {!hasFile && (
        <div className="empty-state card border-0">
          <div className="card-body text-center py-5">
            <div className="empty-icon mb-3"><Upload size={40}/></div>
            <h6 className="mb-1">Envie um pacote .tgz para iniciar a análise</h6>
            <p className="text-muted mb-0">A análise acontece no navegador. Nada é enviado ao servidor.</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {failureKey && (
        <div className="results">
          <h6 className="mb-2 text-muted">Resultados — {FAILURE_DETECTORS[failureKey]?.label}</h6>

          {targetFindings.length === 0 ? (
            <div className="card border-0 bg-light-subtle"><div className="card-body">
              Nada encontrado para a falha selecionada nos filtros atuais.
            </div></div>
          ) : (
            targetFindings.map((f, i)=>(
              <div key={i} className={`result-card card mb-3 severity-warn`}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-outline">
                      {f.icon} {FAILURE_DETECTORS[failureKey]?.label}
                    </span>
                    <span className="file-path small text-muted">{f.file}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">{f.when ? new Date(f.when).toLocaleString() : "sem timestamp"}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={()=>{
                        navigator.clipboard?.writeText(f.lines.join("\n"));
                      }}
                      title="Copiar trechos"
                    >
                      <Copy size={14}/>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <pre className="log-snippet">{f.lines.join("\n")}</pre>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="fw-semibold mb-1">Causas prováveis</div>
                      <ul className="mb-2">{f.causes.map((c,idx)=><li key={idx}>{c}</li>)}</ul>
                    </div>
                    <div className="col-md-6">
                      <div className="fw-semibold mb-1">Soluções sugeridas</div>
                      <ul className="mb-0">{f.fixes.map((x,idx)=><li key={idx}>{x}</li>)}</ul>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Arquivos listados */}
      {hasFile && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-2">
              <FileText size={16}/> <strong>Arquivos no pacote</strong>
              <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={()=>{
                setFrom(""); setTo(""); setQ(""); setLevels({ERROR:true,WARN:true,CRITICAL:true}); setFailureKey(""); setTargetFindings([]);
              }}>
                <RefreshCw size={14} className="me-1"/> Limpar filtros
              </button>
            </div>
            <div className="file-list">
              <ul className="small mb-0">
                {fileList.map((f,i)=><li key={i}>./{f}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
