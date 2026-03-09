import { Router } from "express";
import { all, run } from "../db/sqlite.js";
import { authRequired, adminOnly } from "../middlewares/auth.js";
const router = Router();

// público: leitura
router.get("/:section", (req,res)=> {
  const rows = all(`SELECT key, value FROM settings WHERE section=?`, [req.params.section]);
  const out = {};
  rows.forEach(r => out[r.key] = JSON.parse(r.value));
  res.json(out);
});

// admin: escrita
router.put("/:section/:key", authRequired, adminOnly, (req,res)=> {
  const { section, key } = req.params;
  run(
    `INSERT INTO settings (section,key,value) VALUES (?,?,?)
     ON CONFLICT(section,key) DO UPDATE SET value=excluded.value`,
    [section, key, JSON.stringify(req.body ?? {})]
  );
  res.json({ ok:true });
});

export default router;
