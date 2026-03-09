// api/server/routes/auth.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

const secret = process.env.API_SECRET || "dev-secret-change-me";
const passwordHash = process.env.PASSWORD_HASH || "";

// cookie options (seguro em produção)
function cookieOpts(isProd) {
  return {
    httpOnly: true,
    sameSite: isProd ? "strict" : "lax",
    secure: isProd,          // em produção, só HTTPS
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
  };
}

// POST /auth/login  { password }
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: "password_required" });
    if (!passwordHash) return res.status(500).json({ error: "server_password_not_set" });

    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    // usuário único com role admin
    const payload = { uid: "single-admin", role: "admin" };
    const token = jwt.sign(payload, secret, { expiresIn: "30d" });

    res.cookie("auth", token, cookieOpts(process.env.NODE_ENV === "production"));
    return res.json({ ok: true, user: payload });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth", cookieOpts(process.env.NODE_ENV === "production"));
  return res.json({ ok: true });
});

// GET /auth/me -> retorna usuário se logado
router.get("/me", (req, res) => {
  const token = req.cookies?.auth;
  if (!token) return res.status(200).json({ user: null });

  try {
    const payload = jwt.verify(token, secret);
    return res.json({ user: payload });
  } catch {
    return res.json({ user: null });
  }
});

export default router;
