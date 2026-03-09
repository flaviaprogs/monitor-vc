-- Tabela principal de chamados
CREATE TABLE IF NOT EXISTS chamados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numeroChamado TEXT NOT NULL UNIQUE,
  local TEXT,
  predio TEXT,
  andar TEXT,
  sala TEXT,
  equipamento TEXT,
  status TEXT CHECK(status IN ('ABERTO','ENCERRADO')) DEFAULT 'ABERTO',
  tipoFalha TEXT,
  equipeAcionada TEXT,
  dataQueda TEXT,
  dataRestauracao TEXT,
  tempoIndisponibilidade TEXT,
  solucao TEXT,
  observacoes TEXT,
  criadoEm TEXT,
  prioridade INTEGER DEFAULT 0,  -- 0/1
  origem TEXT
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_equipe ON chamados(equipeAcionada);
CREATE INDEX IF NOT EXISTS idx_chamados_criadoEm ON chamados(criadoEm);
