import express from "express";
import { exec } from "child_process";

const router = express.Router();

router.get("/ping/:ip", (req, res) => {
  const { ip } = req.params;

  if (!ip || ip === "N/D") {
    return res.status(400).json({ error: "IP inválido" });
  }

  const isWindows = process.platform === "win32";
  const cmd = isWindows
    ? `ping -n 2 ${ip}`
    : `ping -c 2 ${ip}`;

  exec(cmd, { timeout: 5000 }, (err, stdout) => {
    if (err) {
      return res.json({
        ip,
        alive: false,
      });
    }

    const alive =
      stdout.includes("TTL=") ||
      stdout.includes("ttl=");

    res.json({
      ip,
      alive,
    });
  });
});

export default router;
