/* eslint-disable no-console */
const express = require("express");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");

// ====== Config básica ======
const app = express();
const PORT = process.env.PORT || 4000;

// permitir JSON no body
app.use(express.json({ limit: "1mb" }));

// segurança + CORS (restringe ao seu front local)
app.use(helmet());
app.use(
  cors({
    origin: [/^http:\/\/localhost:3000$/, /^http:\/\/127\.0\.0\.1:3000$/],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ====== utilidades p/ persistência em arquivo ======
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "chamadosInternos.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
}
function readAll() {
  ensureDataDir();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeAll(arr) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), "utf8");
}

// ====== helpers de data ======
function parseBRDateToISO(s) {
  const m = String(s).match(
    /(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!m) return s;
  const [, dd, MM, yyyy, hh, mm, ss = "00"] = m;
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
}
function monthKey(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ====== normalização mínima ======
function normalize(r) {
  const out = { ...r };
  ["criadoEm", "queda", "restaurado"].forEach((k) => {
    if (!out[k]) return;
    const v = out[k];
    if (/^\d{2}\/\d{2}\/\d{4}/.test(String(v))) out[k] = parseBRDateToISO(v);
  });
  if (!out.id) out.id = out.num || `RITM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return out;
}

// ====== ROTAS ======
app.get("/api/chamadosInternos", (req, res) => {
  const { month, status } = req.query;
  const all = readAll();
  let data = all.map(normalize);

  if (month) data = data.filter((c) => monthKey(c.criadoEm || c.queda) === month);
  if (status) {
    const st = String(status).toUpperCase();
    data = data.filter((c) => String(c.status || "").toUpperCase().includes(st));
  }
  res.json(data);
});

app.post("/api/chamadosInternos", (req, res) => {
  const body = normalize(req.body || {});
  const all = readAll();
  all.unshift(body);
  writeAll(all);
  res.status(201).json(body);
});

app.put("/api/chamadosInternos/:id", (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
  const all = readAll();
  const idx = all.findIndex((c) => String(c.id || c.num) === String(id));
  if (idx < 0) return res.status(404).json({ error: "Not found" });
  all[idx] = normalize({ ...all[idx], ...patch, id: all[idx].id || id });
  writeAll(all);
  res.json(all[idx]);
});

app.delete("/api/chamadosInternos/:id", (req, res) => {
  const { id } = req.params;
  const all = readAll();
  const filtered = all.filter((c) => String(c.id || c.num) !== String(id));
  writeAll(filtered);
  res.json({ ok: true });
});

// seed de desenvolvimento
app.post("/api/seed/chamadosInternos", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Seed desabilitado em produção" });
  }
  const seed = (req.body && Array.isArray(req.body) ? req.body : getDefaultSeed()).map(normalize);
  writeAll(seed);
  res.json({ ok: true, count: seed.length });
});

function getDefaultSeed() {
  return [
    {"id":"RITM1034162","num":"RITM1034162","predio":"JB","site":"JB695","andar":"1AND","sala":"SL107","equip":"SL107","status":"ENCERRADO","falha":"STATUS DOWN","equipe":"VIDEOCONFERÊNCIA","queda":"04/11/2025, 16:50:00","restaurado":"04/11/2025, 18:48:00","indisp":"01:58","solucao":"OUTRO","criadoEm":"04/11/2025, 16:50:00"},
    {"id":"RITM1034163","num":"RITM1034163","predio":"JB","site":"JB695","andar":"TE","sala":"MULTIUSO","equip":"MULTIUSO","status":"ENCERRADO","falha":"STATUS DOWN","equipe":"VIDEOCONFERÊNCIA","queda":"04/11/2025, 16:50:00","restaurado":"04/11/2025, 17:47:00","indisp":"00:57","solucao":"OUTRO","criadoEm":"04/11/2025, 16:50:00"},
    {"id":"RITM1034165","num":"RITM1034165","predio":"JB","site":"JB695","andar":"7AND","sala":"SL701","equip":"SL701","status":"ENCERRADO","falha":"STATUS DOWN","equipe":"VIDEOCONFERÊNCIA","queda":"04/11/2025, 16:50:00","restaurado":"04/11/2025, 17:49:00","indisp":"00:59","solucao":"OUTRO","criadoEm":"04/11/2025, 16:50:00"},
    {"id":"RITM1034354","num":"RITM1034354","predio":"JB","site":"JB695","andar":"3AND","sala":"SL301","equip":"X50","status":"ABERTO","falha":"PAREAMENTO API POLY","equipe":"VIDEOCONFERÊNCIA","queda":"05/11/2025, 02:53:00","restaurado":"","indisp":"","solucao":"","criadoEm":"05/11/2025, 02:53:00"},
    {"id":"RITM1034352","num":"RITM1034352","predio":"JB","site":"JB695","andar":"5AND","sala":"SL508","equip":"X50","status":"ABERTO","falha":"PAREAMENTO API POLY","equipe":"VIDEOCONFERÊNCIA","queda":"05/11/2025, 02:51:00","restaurado":"","indisp":"","solucao":"","criadoEm":"05/11/2025, 02:51:00"},
    {"id":"RITM1034386","num":"RITM1034386","predio":"DF","site":"SEDE","andar":"1AND","sala":"SLAZUL","equip":"TC8","status":"ENCERRADO","falha":"STATUS DOWN","equipe":"VIDEOCONFERÊNCIA","queda":"05/11/2025, 08:54:00","restaurado":"05/11/2025, 09:25:00","indisp":"00:31","solucao":"RESET FÍSICO","criadoEm":"05/11/2025, 08:54:00"},
    {"id":"RITM1034350","num":"RITM1034350","predio":"CITTA","site":"BL2A","andar":"1AND","sala":"BACCALA","equip":"X50","status":"ENCERRADO","falha":"PAREAMENTO API POLY","equipe":"VIDEOCONFERÊNCIA","queda":"05/11/2025, 05:32:00","restaurado":"05/11/2025, 09:17:00","indisp":"03:45","solucao":"RESET FÍSICO","criadoEm":"05/11/2025, 05:32:00"},
    {"id":"RITM1034156","num":"RITM1034156","predio":"SP","site":"JRM","andar":"5AND","sala":"SL01","equip":"TC8","status":"ENCERRADO","falha":"STATUS DOWN","equipe":"VIDEOCONFERÊNCIA","queda":"04/11/2025, 16:51:00","restaurado":"04/11/2025, 17:24:00","indisp":"00:33","solucao":"","criadoEm":"04/11/2025, 16:51:00"}
  ];
}

// ====== boot ======
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
