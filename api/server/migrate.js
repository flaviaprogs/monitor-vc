// ... imports no topo mantidos
import { exec, run } from "./db/sqlite.js";
// ...

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE(section, key)
);

CREATE TABLE IF NOT EXISTS chamados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numeroChamado TEXT,
  local TEXT, predio TEXT, andar TEXT, sala TEXT, equipamento TEXT,
  status TEXT, tipoFalha TEXT, equipeAcionada TEXT,
  dataQueda TEXT, dataRestauracao TEXT, tempoIndisponibilidade TEXT,
  solucao TEXT, observacoes TEXT,
  criadoEm TEXT,
  prioridade INTEGER DEFAULT 0,
  origem TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chamados_updated_at ON chamados(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_sala ON chamados(sala);
`;
exec(schema);

// seeds (users/settings) como você já tinha…
