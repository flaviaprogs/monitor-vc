// api/server/routes/users.js
import express from "express";
import { authRequired, adminOnly } from "../middlewares/auth.js";

const router = express.Router();

// GET /users → precisa estar logado (qualquer role)
router.get("/", authRequired, (req, res) => {
  res.json([
    { id: 1, username: "anderson", role: "user" },
    { id: 2, username: "altair",   role: "user" },
    { id: 3, username: "flavia",   role: "user" },
    { id: 4, username: "admin",    role: "admin" },
  ]);
});

// GET /users/admin-area → somente admin
router.get("/admin-area", authRequired, adminOnly, (req, res) => {
  res.json({ ok: true, whoami: req.user });
});

export default router;
