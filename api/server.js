// api/server.js (ESM)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import Papa from "papaparse";
import { fileURLToPath } from "url";

import {
  getAllChamados,
  upsertChamado,
  deleteChamado,
} from "./db.js";

// =========================
// __dirname (ESM CORRETO)
// =========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================
// Inicialização
// =========================
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: "20mb" }));
app.use(cors());
app.use(morgan("dev"));

// =========================
// ROTA — EQUIPAMENTOS (CSV)
// =========================
const DEVICES_FILE = path.join(__dirname, "data", "devices.csv");

app.get("/api/equipamentos", (_req, res) => {
  try {
    const csv = fs.readFileSync(DEVICES_FILE, "utf8");

    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
    });

    res.json(parsed.data);
  } catch (err) {
    console.error("Erro ao carregar equipamentos:", err);
    res.status(500).json({ error: "Erro ao carregar equipamentos" });
  }
});

// =========================
// Persistência em data.json
// =========================
const DATA_FILE = path.join(__dirname, "data.json");

function loadJSON() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { contatos: [], links: [], procedures: [] };
  }
}

function saveJSON(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

// =======================================================
// ROTAS — CHAMADOS
// =======================================================
app.get("/api/chamados", async (_req, res) => {
  try {
    const rows = await getAllChamados();
    res.json(rows);
  } catch (e) {
    console.error("GET /api/chamados erro:", e);
    res.status(500).json({ error: "Falha ao listar chamados" });
  }
});

app.post("/api/chamados", async (req, res) => {
  try {
    await upsertChamado(req.body);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("POST /api/chamados erro:", e);
    res.status(500).json({ error: "Falha ao salvar chamado" });
  }
});

app.delete("/api/chamados/:id", async (req, res) => {
  try {
    await deleteChamado(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/chamados erro:", e);
    res.status(500).json({ error: "Falha ao excluir chamado" });
  }
});

// =======================================================
// SERVIR BUILD REACT (PRODUÇÃO)
// =======================================================
const candidateA = path.join(__dirname, "../build");
const candidateB = path.join(__dirname, "../../build");

const BUILD_DIR = fs.existsSync(path.join(candidateA, "index.html"))
  ? candidateA
  : fs.existsSync(path.join(candidateB, "index.html"))
  ? candidateB
  : null;

if (BUILD_DIR) {
  app.use(express.static(BUILD_DIR));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(BUILD_DIR, "index.html"));
  });

  console.log("🗂  Servindo front de:", BUILD_DIR);
} else {
  console.log("⚠️  Nenhum build encontrado.");
}

// =========================
// START
// =========================
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
