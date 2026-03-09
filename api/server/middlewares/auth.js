// api/server/middlewares/auth.js
import jwt from "jsonwebtoken";

// dev-only: token "dev" (Bearer dev) habilita rápido, mas só em DEV
const DEV_BEARER = "dev";
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";

// Ex.: req.user = { username, role }
export function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    // atalho dev
    if (process.env.NODE_ENV !== "production" && token === DEV_BEARER) {
      req.user = { username: "dev", role: "admin" };
      return next();
    }

    if (!token) return res.status(401).json({ error: "unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || !payload.username) {
      return res.status(401).json({ error: "unauthorized" });
    }
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "unauthorized" });
  }
}

export function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "unauthorized" });
  if (String(req.user.role).toLowerCase() !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}
