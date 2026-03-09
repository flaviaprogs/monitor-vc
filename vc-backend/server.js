/* eslint-env node */
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// =====================================================
// 🗄️ SQLITE
// =====================================================
const dbPath = path.join(__dirname, "chamados.db");
console.log("📁 Caminho real do banco:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erro ao conectar SQLite:", err.message);
  } else {
    console.log("✅ SQLite conectado em:", dbPath);
  }
});

// =====================================================
// 📦 TABELAS
// =====================================================
db.serialize(() => {
  // ---------------- CHAMADOS
  db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numeroChamado TEXT NOT NULL,
      nomeCompleto TEXT NOT NULL,
      local TEXT,
      predio TEXT,
      andar TEXT,
      sala TEXT,
      equipamento TEXT,
      status TEXT,
      tipoFalha TEXT,
      dataQueda TEXT,
      dataRestauracao TEXT,
      equipeAcionada TEXT,
      observacoes TEXT,

      -- 🔥 NOVO MODELO
      causa TEXT,
      acaoExecutada TEXT,

      -- ⚠️ Mantido temporário para compatibilidade
      solucao TEXT,

      emChamada INTEGER DEFAULT 0,
      prioridade INTEGER DEFAULT 0,
      origem TEXT,
      criadoEm TEXT NOT NULL
    )
  `);

  // 🔥 MIGRAÇÃO SEGURA (caso tabela já exista)
  db.run("ALTER TABLE chamados ADD COLUMN causa TEXT", () => {});
  db.run("ALTER TABLE chamados ADD COLUMN acaoExecutada TEXT", () => {});

  // ---------------- SALAS OBS
  db.run(`
    CREATE TABLE IF NOT EXISTS salas_obs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sala TEXT NOT NULL,
      observacao TEXT NOT NULL,
      status TEXT DEFAULT 'ATIVA',
      criadoEm TEXT NOT NULL
    )
  `);
});

// =====================================================
// 📡 SSE — CLIENTES
// =====================================================
let sseClients = [];

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const client = { id: clientId, res };
  sseClients.push(client);

  req.on("close", () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

function notifyAll(event, data = {}) {
  sseClients.forEach((client) => {
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// =====================================================
// ================== CHAMADOS =========================
// =====================================================

app.get("/chamados", (_, res) => {
  db.all("SELECT * FROM chamados ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/chamados", (req, res) => {
  const c = req.body;

  if (!c.numeroChamado || !c.nomeCompleto || !c.tipoFalha) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  db.run(
    `
    INSERT INTO chamados (
      numeroChamado,nomeCompleto,local,predio,andar,sala,equipamento,
      status,tipoFalha,dataQueda,dataRestauracao,equipeAcionada,
      observacoes,causa,acaoExecutada,solucao,
      emChamada,prioridade,origem,criadoEm
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      c.numeroChamado,
      c.nomeCompleto,
      c.local || "",
      c.predio || "",
      c.andar || "",
      c.sala || "",
      c.equipamento || "",
      c.status || "ABERTO",
      c.tipoFalha,
      c.dataQueda || "",
      c.dataRestauracao || "",
      c.equipeAcionada || "",
      c.observacoes || "",
      c.causa || "",
      c.acaoExecutada || "",
      c.solucao || "",
      c.emChamada ? 1 : 0,
      c.prioridade ? 1 : 0,
      c.origem || "manual",
      c.criadoEm || new Date().toISOString(),
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      notifyAll("chamados-update", { action: "create", id: this.lastID });
      res.json({ id: this.lastID });
    }
  );
});

app.put("/chamados/:id", (req, res) => {
  const { id } = req.params;
  const c = req.body;

  db.run(
    `
    UPDATE chamados SET
      numeroChamado=?,nomeCompleto=?,local=?,predio=?,andar=?,sala=?,
      equipamento=?,status=?,tipoFalha=?,dataQueda=?,dataRestauracao=?,
      equipeAcionada=?,observacoes=?,causa=?,acaoExecutada=?,solucao=?,
      emChamada=?,prioridade=?,origem=?,criadoEm=?
    WHERE id=?
    `,
    [
      c.numeroChamado,
      c.nomeCompleto,
      c.local || "",
      c.predio || "",
      c.andar || "",
      c.sala || "",
      c.equipamento || "",
      c.status || "ABERTO",
      c.tipoFalha,
      c.dataQueda || "",
      c.dataRestauracao || "",
      c.equipeAcionada || "",
      c.observacoes || "",
      c.causa || "",
      c.acaoExecutada || "",
      c.solucao || "",
      c.emChamada ? 1 : 0,
      c.prioridade ? 1 : 0,
      c.origem || "manual",
      c.criadoEm || new Date().toISOString(),
      id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      notifyAll("chamados-update", { action: "update", id });
      res.json({ updated: this.changes });
    }
  );
});

app.delete("/chamados/:id", (req, res) => {
  db.run("DELETE FROM chamados WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    notifyAll("chamados-update", { action: "delete", id: req.params.id });
    res.json({ deleted: this.changes });
  });
});

// =====================================================
// ================= SALAS OBS =========================
// =====================================================

app.get("/salas-obs", (_, res) => {
  db.all("SELECT * FROM salas_obs ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/salas-obs", (req, res) => {
  const { sala, observacao } = req.body;

  if (!sala || !observacao) {
    return res.status(400).json({ error: "Sala e observação obrigatórias" });
  }

  db.run(
    `INSERT INTO salas_obs (sala, observacao, status, criadoEm)
     VALUES (?, ?, ?, ?)`,
    [sala, observacao, "ATIVA", new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      notifyAll("salas-update", { action: "create", id: this.lastID });
      res.json({ id: this.lastID });
    }
  );
});

app.put("/salas-obs/:id/resolver", (req, res) => {
  db.run(
    `UPDATE salas_obs SET status='RESOLVIDA' WHERE id=?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      notifyAll("salas-update", { action: "update", id: req.params.id });
      res.json({ updated: this.changes });
    }
  );
});

app.delete("/salas-obs/:id", (req, res) => {
  db.run("DELETE FROM salas_obs WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    notifyAll("salas-update", { action: "delete", id: req.params.id });
    res.json({ deleted: this.changes });
  });
});

// =====================================================
// 🌐 SERVIDOR
// =====================================================
app.listen(4000, "0.0.0.0", () => {
  console.log("🚀 API rodando:");
  console.log("   http://localhost:4000");
  console.log("   http://SEU-IP:4000");
});