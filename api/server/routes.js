// api/server/routes.js
import { Router } from "express";
import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   "Banco" em arquivo JSON
   ========================= */
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "chamados.json");

// caminho REAL do devices.csv
const DEVICES_CSV_PATH = path.join(__dirname, "..", "data", "devices.csv");

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, "[]");
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

/* =========================
   Helpers de normalização
   ========================= */
const pick = (...vals) =>
  vals.find((v) => v !== undefined && v !== null && v !== "");

const toUpperSafe = (v) =>
  typeof v === "string" ? v.trim().toUpperCase() : v;

const trimOr = (v, def = "") =>
  typeof v === "string" ? v.trim() : v ?? def;

function toIsoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function calcIndisp(queda, restaurado) {
  const q = new Date(queda).getTime();
  const r = new Date(restaurado).getTime();
  if (Number.isFinite(q) && Number.isFinite(r) && r >= q) {
    const mins = Math.round((r - q) / 60000);
    return `${mins} min`;
  }
  return "";
}

/** Normaliza o corpo do request aceitando sinônimos usados no front */
function normalizeFromBody(b, { forUpdate = false } = {}) {
  const chamado = trimOr(
    pick(b.chamado, b.codigo, b.ticket, b.numeroChamado),
    ""
  );

  let status = pick(b.status, b.situacao);
  if (!forUpdate) status = toUpperSafe(status || "ABERTO");
  else status = status ? toUpperSafe(status) : undefined;

  const queda = pick(b.queda, b.dataQueda, b.dtQueda);
  const restaurado = pick(b.restaurado, b.dataRestauracao, b.dtRestaurado);

  const obj = {
    chamado,
    local: trimOr(pick(b.local, b.site, b.uf)),
    predio: trimOr(pick(b.predio, b.predioSigla, b.building)),
    andar: trimOr(pick(b.andar, b.floor)),
    sala: trimOr(pick(b.sala, b.room)),
    equip: trimOr(pick(b.equip, b.equipamento, b.codec)),

    status,

    falha: trimOr(pick(b.falha, b.tipoFalha)),
    equipe: trimOr(
      pick(b.equipe, b.equipeAcionada, b.equipeAtendimento, b.team)
    ),

    queda: queda !== undefined ? toIsoOrNull(queda) : undefined,
    restaurado:
      restaurado !== undefined ? toIsoOrNull(restaurado) : undefined,

    indisponibilidade: trimOr(
      pick(b.indisponibilidade, b.indisp, b.tempoIndisponibilidade)
    ),
    solucao: trimOr(pick(b.solucao, b.solucaoTexto)),
    observacoes: trimOr(
      pick(b.observacoes, b.obs, b.observacao, b.notas)
    ),
  };

  if (forUpdate) {
    Object.keys(obj).forEach(
      (k) => obj[k] === undefined && delete obj[k]
    );
  }

  return obj;
}

/* =========================
   Rotas
   ========================= */
const router = Router();

/* -------- DEVICES (CSV) -------- */

/**
 * GET /api/devices
 * Retorna inventário do devices.csv
 */
router.get("/devices", async (req, res, next) => {
  try {
    if (!fsSync.existsSync(DEVICES_CSV_PATH)) {
      return res.json([]);
    }

    const devices = [];

    fsSync
      .createReadStream(DEVICES_CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        devices.push({
          deviceId: String(row.deviceId || row.id || "").trim(),
          sala: String(row.sala || row.room || "").trim(),
          ip: String(row.ip || row.internalIp || "").trim(),
          mac: String(row.mac || row.macAddress || "").trim(),
        });
      })
      .on("end", () => res.json(devices))
      .on("error", (err) => next(err));
  } catch (err) {
    next(err);
  }
});

/* -------- CHAMADOS -------- */

router.get("/chamados", async (req, res, next) => {
  try {
    const itens = await readDb();
    res.json(itens);
  } catch (err) {
    next(err);
  }
});

router.get("/chamados/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const itens = await readDb();
    const item = itens.find((x) => x.id === id);
    if (!item) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post("/chamados", async (req, res, next) => {
  try {
    const itens = await readDb();
    const novo = normalizeFromBody(req.body || {});
    novo.id = "CH" + Date.now();
    novo.criadoEm = new Date().toISOString();
    novo.atualizadoEm = null;

    if (!novo.chamado) {
      const seq = String(Date.now()).slice(-3);
      novo.chamado = `TST-${seq}`;
    }

    if (!novo.indisponibilidade && novo.queda && novo.restaurado) {
      novo.indisponibilidade = calcIndisp(novo.queda, novo.restaurado);
    }

    itens.push(novo);
    await writeDb(itens);
    res.status(201).json(novo);
  } catch (err) {
    next(err);
  }
});

router.put("/chamados/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const itens = await readDb();
    const idx = itens.findIndex((x) => x.id === id);
    if (idx === -1)
      return res.status(404).json({ error: "NOT_FOUND" });

    const patch = normalizeFromBody(req.body || {}, { forUpdate: true });
    const atual = { ...itens[idx], ...patch };

    if (
      (!atual.indisponibilidade || atual.indisponibilidade === "") &&
      atual.queda &&
      atual.restaurado
    ) {
      atual.indisponibilidade = calcIndisp(
        atual.queda,
        atual.restaurado
      );
    }

    atual.atualizadoEm = new Date().toISOString();
    itens[idx] = atual;
    await writeDb(itens);
    res.json(atual);
  } catch (err) {
    next(err);
  }
});

router.delete("/chamados/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const itens = await readDb();
    const novos = itens.filter((x) => x.id !== id);
    if (novos.length === itens.length) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    await writeDb(novos);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
