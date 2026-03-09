// 📁 src/pages/DiagramaSite.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const SITES = {
  // JB695
  jb695: {
    nome: "JB695",
    andares: [
      { label: "Térreo / 1º / 2º", path: "te-1e2" },
      { label: "3º Andar", path: "3" },
      { label: "4º Andar", path: "4" },
      { label: "5º Andar", path: "5" },
      { label: "6º / 7º Andar", path: "6e7" },
    ],
  },

  // PL70
  pl70: {
    nome: "PL70",
    andares: [{ label: "1º / 2º Andar", path: "1e2" }],
  },

  // VM / PRJ
  vm: {
    nome: "VM/PRJ",
    andares: [{ label: "3º Andar / Projeto 1º", path: "3e1proj" }],
  },

  // LQ (use os nomes de arquivo que você me mostrou)
  lq: {
    nome: "LQ",
    andares: [
      { label: "Térreo", path: "terreo" },
      { label: "1º / 2º", path: "1e2" },
      { label: "3º / 4º", path: "3e4" },
      { label: "5º", path: "5" },
      { label: "6º / 7º", path: "6e7" },
      { label: "8º", path: "8" },
      { label: "9º / 10º", path: "9e10" },
    ],
  },
};

export default function DiagramaSite() {
  const { site } = useParams();
  const navigate = useNavigate();
  const key = String(site || "").toLowerCase();
  const cfg = SITES[key];

  if (!cfg) {
    return (
      <div className="container py-4">
        <h3>Site não encontrado</h3>
        <p className="text-muted">Rota: <code>{site}</code></p>
        <button className="btn btn-primary" onClick={() => navigate("/diagrama")}>
          ← Voltar para sites
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <style>{`
        .dg-toolbar{background:linear-gradient(90deg,#0b1a36,#2f80ed,#56ccf2);color:#fff;border-radius:12px;padding:10px 14px}
        .dg-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
        @media(max-width:1200px){.dg-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
        @media(max-width:768px){.dg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        .dg-btn{border:1px solid rgba(13,110,253,.15);background:#fff;border-radius:10px;padding:12px 10px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.06)}
        .dg-btn:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(13,110,253,.18)}
      `}</style>

      <div className="dg-toolbar d-flex align-items-center justify-content-between mb-3">
        <strong>{cfg.nome} — Selecione o Andar</strong>
        <button className="btn btn-light btn-sm" onClick={() => navigate("/diagrama")}>← Voltar</button>
      </div>

      <div className="dg-grid">
        {cfg.andares.map((a) => (
          <button
            key={a.path}
            className="dg-btn"
            onClick={() => navigate(`/diagrama/${key}/${a.path}`)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
