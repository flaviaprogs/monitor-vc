// 📁 src/pages/DiagramaDetalhado.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";

/* Manifesto ESTÁTICO (garante inclusão no bundle) */
const STATIC = {
  // JB695
  "jb695:te-1e2": require("../assets/JB695_TE_1E2AND.png"),
  "jb695:3": require("../assets/JB695_3AND.png"),
  "jb695:4": require("../assets/JB695_4AND.png"),
  "jb695:5": require("../assets/JB695_5AND.png"),
  "jb695:6e7": require("../assets/JB695_6E7ND.png"),

  // PL70
  "pl70:1e2": require("../assets/PL70_1E2AND.png"),

  // VM/PRJ
  "vm:3e1proj": require("../assets/VM_3AND_E_PRJ1AND.png"),

  // LQ
  "lq:terreo": require("../assets/LQ_Terreo.png"),
  "lq:1e2": require("../assets/LQ_1E2AND.png"),
  "lq:3e4": require("../assets/LQ_3E4AND.png"),
  "lq:5": require("../assets/LQ_5ND.png"),
  "lq:6e7": require("../assets/LQ_6E7ND.png"),
  "lq:8": require("../assets/LQ_8ND.png"),
  "lq:9e10": require("../assets/LQ_9E10AND.png"),
};

/* Loader dinâmico TOLERANTE (fallback) */
function buildAssetIndex() {
  const ctx = require.context("../assets", false, /\.(png|jpe?g|gif|svg)$/i);
  const idx = new Map();
  ctx.keys().forEach((k) => {
    const low = k.toLowerCase();
    const clean = k.replace("./", "").toLowerCase();
    idx.set(low, k);
    idx.set(clean, k);
  });
  return {
    getUrl(bases) {
      for (const base of bases) {
        for (const ext of [".png", ".jpg", ".jpeg", ".svg", ".gif"]) {
          const a = `./${base}${ext}`.toLowerCase();
          const b = `${base}${ext}`.toLowerCase();
          if (idx.has(a)) return ctx(idx.get(a));
          if (idx.has(b)) return ctx(idx.get(b));
        }
      }
      return null;
    },
  };
}
const ASSETS = buildAssetIndex();

function normalize(mod) {
  if (!mod) return null;
  if (typeof mod === "string") return mod;
  if (typeof mod?.default === "string") return mod.default;
  try { return String(mod); } catch { return null; }
}

function getByManifest(site, andar) {
  const key = `${String(site).toLowerCase()}:${String(andar).toLowerCase()}`;
  return STATIC[key] || null;
}

function getByFallback(site, andar) {
  const s = String(site || "").toLowerCase();
  const a = String(andar || "").toLowerCase();

  if (s === "jb695") {
    const map = {
      "te-1e2": "JB695_TE_1E2AND",
      "3": "JB695_3AND",
      "4": "JB695_4AND",
      "5": "JB695_5AND",
      "6e7": "JB695_6E7ND",
    };
    const base = map[a];
    return base ? ASSETS.getUrl([base]) : null;
  }
  if (s === "pl70") {
    if (a === "1e2") return ASSETS.getUrl(["PL70_1E2AND"]);
    return null;
  }
  if (s === "vm") {
    if (a === "3e1proj") return ASSETS.getUrl(["VM_3AND_E_PRJ1AND"]);
    return null;
  }
  if (s === "lq") {
    const map = {
      "terreo": "LQ_Terreo",
      "1e2": "LQ_1E2AND",
      "3e4": "LQ_3E4AND",
      "5": "LQ_5ND",
      "6e7": "LQ_6E7ND",
      "8": "LQ_8ND",
      "9e10": "LQ_9E10AND",
    };
    const base = map[a];
    return base ? ASSETS.getUrl([base]) : null;
  }
  return null;
}

export default function DiagramaDetalhado() {
  const { site, andar } = useParams();
  const navigate = useNavigate();

  // 1) tenta manifesto (100% estável)
  let src = normalize(getByManifest(site, andar));

  // 2) fallback dinâmico (opcional)
  if (!src) {
    src = normalize(getByFallback(site, andar));
  }

  if (!src) {
    return (
      <div className="container py-4">
        <h3>Imagem não encontrada</h3>
        <p className="text-muted">
          Site: <code>{site}</code> — Andar: <code>{andar}</code><br />
          Confirme o nome do arquivo em <code>src/assets</code> e o mapeamento.
        </p>
        <button className="btn btn-primary me-2" onClick={() => navigate(`/diagrama/${site}`)}>
          ← Voltar aos andares
        </button>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/diagrama")}>
          Sites
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-center justify-content-between bg-primary text-white rounded-3 px-3 py-2 shadow-sm">
        <strong>{String(site).toUpperCase()} — {String(andar).toUpperCase()}</strong>
        <div className="d-flex gap-2">
          <button className="btn btn-light btn-sm" onClick={() => navigate(`/diagrama/${site}`)}>← Voltar</button>
          <a className="btn btn-light btn-sm" href={src} download>Baixar PNG</a>
          <a className="btn btn-outline-light btn-sm" href={src} target="_blank" rel="noreferrer">Abrir em nova aba</a>
        </div>
      </div>

      <div className="bg-white rounded-3 mt-3 p-2 shadow-sm" style={{ minHeight: 400 }}>
        <img
          src={src}
          alt={`${site} ${andar}`}
          className="img-fluid d-block mx-auto"
          style={{ maxHeight: "85vh", objectFit: "contain" }}
        />
      </div>

      <p className="text-muted small mt-2 mb-0 text-center">
        Use o zoom do navegador (Ctrl +/−) para detalhes.
      </p>
    </div>
  );
}
