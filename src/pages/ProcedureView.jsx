// 📁 src/pages/ProcedureView.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PROCEDURES } from "../data/procedures";
import useProceduresAPI from "../hooks/useProceduresAPI";
import { useAuth } from "../context/AuthContext"; // ✅ faltava isso

// ------- Overrides locais (editar sem backend) -------
const OV_KEY = "PROCEDURES_DYNAMIC";

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(OV_KEY) || "null") || {};
  } catch {
    return {};
  }
}

function applyOverridesOne(baseList, overrides, id) {
  const base = baseList.find((p) => String(p.id) === String(id));
  const patch = overrides[String(id)];
  if (patch === null) return null; // explicitamente removido
  if (!base && !patch) return null; // não existe
  return { ...(base || {}), ...(patch || {}), id };
}

export default function ProcedureView() {
  const { id } = useParams();
  const { user } = useAuth(); // ✅ agora temos user/role

  // Lê da API com fallback no arquivo local
  const procedures = useProceduresAPI(PROCEDURES);

  // sincroniza overrides (para quando outra aba salvar)
  const [overrides, setOverrides] = useState(loadOverrides());
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === OV_KEY) setOverrides(loadOverrides());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // aplica override ao item atual
  const proc = useMemo(
    () => applyOverridesOne(procedures, overrides, id),
    [procedures, overrides, id]
  );

  if (!proc) {
    return (
      <div className="p-4">
        <h1 className="h4">Procedimento não encontrado</h1>
        <Link to="/procedimentos" className="btn btn-secondary mt-2">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 m-0">{proc.title}</h1>

        <div className="d-flex gap-2">
          {/* ✅ botão Editar só para admin */}
          {user?.role === "admin" && (
            <Link
              to={`/procedimentos/${proc.id}/editar`}
              className="btn btn-warning btn-sm"
            >
              Editar
            </Link>
          )}
          <Link to="/procedimentos" className="btn btn-light">
            ← Voltar
          </Link>
        </div>
      </div>

      {/* atalhos de diagrama (se houver) */}
      {Array.isArray(proc.diagramLinks) && proc.diagramLinks.length > 0 && (
        <div className="mb-3 d-flex flex-wrap" style={{ gap: 8 }}>
          {proc.diagramLinks.map((d, i) => (
            <Link key={i} to={d.to} className="btn btn-outline-primary btn-sm">
              {d.label}
            </Link>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {proc.sections?.map((sec, i) => (
            <div key={i} className="mb-3">
              {sec.heading && <h6 className="fw-bold mb-2">{sec.heading}</h6>}

              {Array.isArray(sec.items) && sec.items.length > 0 && (
                <ul className="mb-2">
                  {sec.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              )}

              {sec.note && (
                <pre
                  className="p-2 rounded bg-light border"
                  style={{ whiteSpace: "pre-wrap" }}
                >
{sec.note}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
