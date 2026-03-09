// api/db.js (ESM) — com blindagem de undefined→null
import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==== Caminhos do banco ====
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "painel.sqlite");

// Garante a pasta de dados
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ==== Localização robusta do WASM ====
function resolveWasmPath(file) {
  const candidates = [
    path.join(__dirname, "node_modules", "sql.js", "dist", file),
    path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
    path.join(__dirname, file),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return path.join(__dirname, "node_modules", "sql.js", "dist", file);
}

async function loadSQL() {
  const SQL = await initSqlJs({
    locateFile: (file) => resolveWasmPath(file),
  });
  return SQL;
}

// Cria esquema inicial
function bootstrap(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS chamados (
      id INTEGER PRIMARY KEY,
      numeroChamado TEXT NOT NULL,
      local TEXT,
      predio TEXT,
      andar TEXT,
      sala TEXT,
      equipamento TEXT,
      status TEXT,
      tipoFalha TEXT,
      equipeAcionada TEXT,
      dataQueda TEXT,
      dataRestauracao TEXT,
      tempoIndisponibilidade TEXT,
      solucao TEXT,
      observacoes TEXT,
      criadoEm TEXT,
      prioridade INTEGER DEFAULT 0,
      origem TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_chamados_num ON chamados(numeroChamado);
    CREATE INDEX IF NOT EXISTS idx_chamados_criadoem ON chamados(criadoEm);
  `);
}

// Persistência atômica
function persist(db) {
  const data = db.export();
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, Buffer.from(data));
  fs.renameSync(tmp, DB_FILE);
}

// Converte resultado para array de objetos
function resultToObjects(result) {
  if (!result) return [];
  const { columns, values } = result;
  return values.map((row) => {
    const o = {};
    for (let i = 0; i < columns.length; i++) o[columns[i]] = row[i];
    return o;
  });
}

// >>> BLINDAGEM: troca undefined -> null antes de enviar ao SQLite
function bind(values = []) {
  return values.map((v) => (v === undefined ? null : v));
}

async function openDb() {
  const SQL = await loadSQL();
  let db;
  if (fs.existsSync(DB_FILE) && fs.statSync(DB_FILE).size > 0) {
    const buf = fs.readFileSync(DB_FILE);
    db = new SQL.Database(new Uint8Array(buf));
  } else {
    db = new SQL.Database();
    bootstrap(db);
    persist(db);
  }
  return db;
}

// ===== CRUD =====
export async function getAllChamados() {
  const db = await openDb();
  const res = db.exec(`
    SELECT *
    FROM chamados
    ORDER BY datetime(COALESCE(criadoEm, dataQueda)) DESC
  `);
  const arr = res.length ? resultToObjects(res[0]) : [];
  db.close();
  return arr;
}

export async function upsertChamado(c) {
  const db = await openDb();

  const prioridade = c.prioridade ? 1 : 0;
  const origem = c.origem || "importado";

  if (c.id) {
    const stmt = db.prepare(`
      UPDATE chamados SET
        numeroChamado=?, local=?, predio=?, andar=?, sala=?, equipamento=?,
        status=?, tipoFalha=?, equipeAcionada=?,
        dataQueda=?, dataRestauracao=?, tempoIndisponibilidade=?,
        solucao=?, observacoes=?, criadoEm=?, prioridade=?, origem=?
      WHERE id=?
    `);
    stmt.run(bind([
      c.numeroChamado, c.local, c.predio, c.andar, c.sala, c.equipamento,
      c.status, c.tipoFalha, c.equipeAcionada,
      c.dataQueda, c.dataRestauracao, c.tempoIndisponibilidade,
      c.solucao, c.observacoes, c.criadoEm, prioridade, origem,
      c.id,
    ]));
    stmt.free();
  } else {
    const stmt = db.prepare(`
      INSERT INTO chamados (
        numeroChamado, local, predio, andar, sala, equipamento,
        status, tipoFalha, equipeAcionada,
        dataQueda, dataRestauracao, tempoIndisponibilidade,
        solucao, observacoes, criadoEm, prioridade, origem
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    stmt.run(bind([
      c.numeroChamado, c.local, c.predio, c.andar, c.sala, c.equipamento,
      c.status, c.tipoFalha, c.equipeAcionada,
      c.dataQueda, c.dataRestauracao, c.tempoIndisponibilidade,
      c.solucao, c.observacoes, c.criadoEm, prioridade, origem,
    ]));
    stmt.free();
    const r = db.exec(`SELECT last_insert_rowid() AS id`);
    c.id = r[0]?.values?.[0]?.[0];
  }

  persist(db);
  db.close();
  return c;
}

export async function deleteChamado(id) {
  const db = await openDb();
  const stmt = db.prepare(`DELETE FROM chamados WHERE id=?`);
  stmt.run(bind([Number(id)]));
  stmt.free();
  persist(db);
  db.close();
}

export async function bulkUpsert(chamados = []) {
  const db = await openDb();

  const insert = db.prepare(`
    INSERT INTO chamados (
      numeroChamado, local, predio, andar, sala, equipamento,
      status, tipoFalha, equipeAcionada,
      dataQueda, dataRestauracao, tempoIndisponibilidade,
      solucao, observacoes, criadoEm, prioridade, origem, id
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const update = db.prepare(`
    UPDATE chamados SET
      numeroChamado=?, local=?, predio=?, andar=?, sala=?, equipamento=?,
      status=?, tipoFalha=?, equipeAcionada=?,
      dataQueda=?, dataRestauracao=?, tempoIndisponibilidade=?,
      solucao=?, observacoes=?, criadoEm=?, prioridade=?, origem=?
    WHERE id=?
  `);

  for (const c0 of chamados) {
    const c = { ...c0 };
    const prioridade = c.prioridade ? 1 : 0;
    const origem = c.origem || "importado";

    if (c.id) {
      update.run(bind([
        c.numeroChamado, c.local, c.predio, c.andar, c.sala, c.equipamento,
        c.status, c.tipoFalha, c.equipeAcionada,
        c.dataQueda, c.dataRestauracao, c.tempoIndisponibilidade,
        c.solucao, c.observacoes, c.criadoEm, prioridade, origem,
        c.id,
      ]));
    } else {
      insert.run(bind([
        c.numeroChamado, c.local, c.predio, c.andar, c.sala, c.equipamento,
        c.status, c.tipoFalha, c.equipeAcionada,
        c.dataQueda, c.dataRestauracao, c.tempoIndisponibilidade,
        c.solucao, c.observacoes, c.criadoEm, prioridade, origem,
        c.id || null,
      ]));
    }
  }

  insert.free();
  update.free();
  persist(db);
  db.close();
}
