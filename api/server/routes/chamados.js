// api/server/routes/chamados.js
import { Router } from "express";
import { all, get, run } from "../db/sqlite.js";
import { authRequired, adminOnly } from "../middlewares/auth.js";

const router = Router();

// helpers
function toBool(v){ return v === true || v === 1 || v === "1" || v === "true"; }
function pick(o, keys){ return Object.fromEntries(keys.map(k => [k, o?.[k]]) ); }

const FIELDS = [
  "numeroChamado","local","predio","andar","sala","equipamento",
  "status","tipoFalha","equipeAcionada",
  "dataQueda","dataRestauracao","tempoIndisponibilidade",
  "solucao","observacoes","criadoEm","prioridade","origem"
];

// GET /api/chamados -> lista
router.get("/", (req, res) => {
  const rows = all(`SELECT * FROM chamados ORDER BY updated_at DESC`);
  // normaliza prioridade para boolean
  rows.forEach(r => r.prioridade = !!r.prioridade);
  res.json({ items: rows });
});

// GET /api/chamados/:id -> 1 item
router.get("/:id", (req, res) => {
  const row = get(`SELECT * FROM chamados WHERE id=?`, [req.params.id]);
  if (!row) return res.status(404).json({ error: "Not found" });
  row.prioridade = !!row.prioridade;
  res.json(row);
});

// POST /api/chamados -> cria (admin)
router.post("/", authRequired, adminOnly, (req, res) => {
  const body = pick(req.body || {}, FIELDS);
  body.prioridade = toBool(body.prioridade) ? 1 : 0;

  const info = run(`
    INSERT INTO chamados
      (numeroChamado,local,predio,andar,sala,equipamento,status,tipoFalha,equipeAcionada,
       dataQueda,dataRestauracao,tempoIndisponibilidade,solucao,observacoes,criadoEm,prioridade,origem)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, [
    body.numeroChamado, body.local, body.predio, body.andar, body.sala, body.equipamento,
    body.status, body.tipoFalha, body.equipeAcionada,
    body.dataQueda, body.dataRestauracao, body.tempoIndisponibilidade,
    body.solucao, body.observacoes, body.criadoEm, body.prioridade, body.origem
  ]);

  const created = get(`SELECT * FROM chamados WHERE id=?`, [info.lastInsertRowid]);
  created.prioridade = !!created.prioridade;
  res.status(201).json(created);
});

// PUT /api/chamados/:id -> atualiza (admin)
router.put("/:id", authRequired, adminOnly, (req, res) => {
  const { id } = req.params;
  const cur = get(`SELECT * FROM chamados WHERE id=?`, [id]);
  if (!cur) return res.status(404).json({ error: "Not found" });

  const body = pick(req.body || {}, FIELDS);
  const prioridade = body.prioridade != null ? (toBool(body.prioridade) ? 1 : 0) : cur.prioridade;

  run(`
    UPDATE chamados SET
      numeroChamado=COALESCE(?,numeroChamado),
      local=COALESCE(?,local),
      predio=COALESCE(?,predio),
      andar=COALESCE(?,andar),
      sala=COALESCE(?,sala),
      equipamento=COALESCE(?,equipamento),
      status=COALESCE(?,status),
      tipoFalha=COALESCE(?,tipoFalha),
      equipeAcionada=COALESCE(?,equipeAcionada),
      dataQueda=COALESCE(?,dataQueda),
      dataRestauracao=COALESCE(?,dataRestauracao),
      tempoIndisponibilidade=COALESCE(?,tempoIndisponibilidade),
      solucao=COALESCE(?,solucao),
      observacoes=COALESCE(?,observacoes),
      criadoEm=COALESCE(?,criadoEm),
      prioridade=?,
      origem=COALESCE(?,origem),
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `, [
    body.numeroChamado, body.local, body.predio, body.andar, body.sala, body.equipamento,
    body.status, body.tipoFalha, body.equipeAcionada,
    body.dataQueda, body.dataRestauracao, body.tempoIndisponibilidade,
    body.solucao, body.observacoes, body.criadoEm,
    prioridade, body.origem, id
  ]);

  const updated = get(`SELECT * FROM chamados WHERE id=?`, [id]);
  updated.prioridade = !!updated.prioridade;
  res.json(updated);
});

// DELETE /api/chamados/:id (admin)
router.delete("/:id", authRequired, adminOnly, (req, res) => {
  run(`DELETE FROM chamados WHERE id=?`, [req.params.id]);
  res.json({ ok: true });
});

export default router;
