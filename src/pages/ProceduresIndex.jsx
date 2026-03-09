import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PROCEDURES } from "../data/procedures";
import useProceduresAPI from "../hooks/useProceduresAPI";
import useAuth from "../hooks/useAuth";
import { mergeCatalog, resetOverrides, newId, upsertProcedure } from "../data/procedures-store";

/* ===== Admin & Overrides ===== */
const OV_KEY = "PROCEDURES_DYNAMIC";

function getUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("authUser") || "null") ||
      JSON.parse(localStorage.getItem("currentUser") || "null") ||
      {}
    );
  } catch {
    return {};
  }
}
const isAdmin = () => {
  const u = getUser();
  const role = (u?.role || u?.perfil || "").toString().toLowerCase();
  return role === "admin";
};

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(OV_KEY) || "null") || {};
  } catch {
    return {};
  }
}
function applyOverrides(baseList, overrides) {
  const map = new Map(baseList.map((p) => [String(p.id), { ...p }]));
  Object.entries(overrides).forEach(([id, patch]) => {
    if (patch === null) {
      map.delete(String(id)); // deletado
    } else if (map.has(String(id))) {
      map.set(String(id), { ...map.get(String(id)), ...patch });
    } else {
      map.set(String(id), { ...patch, id }); // criado novo
    }
  });
  return [...map.values()];
}

export default function ProceduresIndex() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const base = useProceduresAPI(PROCEDURES);
  const [overrides, setOverrides] = useState(loadOverrides());
  const admin = isAdmin();

  const procedures = useMemo(
    () => applyOverrides(base, overrides),
    [base, overrides]
  );

  useEffect(() => {
    localStorage.setItem(OV_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return procedures;
    return procedures.filter((p) =>
      [p.title, p.summary, ...(p.tags || [])].join(" ").toLowerCase().includes(t)
    );
  }, [q, procedures]);

  const novoProcedimento = () => {
    const id = `p-${Date.now()}`;
    const novo = {
      id,
      title: "Novo Procedimento",
      summary: "",
      tags: [],
      sections: [{ heading: "Seção 1", items: ["Item 1"] }],
      diagramLinks: [],
    };
    setOverrides((o) => ({ ...o, [id]: novo }));
    navigate(`/procedimentos/${id}`);
  };

  const resetarCatalogo = () => {
    if (!window.confirm("Restaurar catálogo (apagar edições locais)?")) return;
    setOverrides({});
  };

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 m-0">Procedimentos</h1>

        <div className="d-flex gap-2">
          <input
            className="form-control"
            style={{ maxWidth: 360 }}
            placeholder="Buscar por título, tag, palavra-chave…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {admin && (
            <>
              <button className="btn btn-primary" onClick={novoProcedimento}>
                + Novo
              </button>
              <button className="btn btn-outline-danger" onClick={resetarCatalogo}>
                Resetar catálogo
              </button>
            </>
          )}
        </div>
      </div>

      <div className="row g-3">
        {filtered.map((p) => (
          <div key={p.id} className="col-12 col-md-6 col-xl-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{p.title}</h5>
                {p.summary ? <p className="text-muted mb-2">{p.summary}</p> : null}

                {p.tags?.length ? (
                  <div
                    className="mb-3"
                    style={{ gap: 6, display: "flex", flexWrap: "wrap" }}
                  >
                    {p.tags.map((tag) => (
                      <span key={tag} className="badge bg-secondary">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3" />
                )}

                <div className="mt-auto">
                  <Link
                    to={`/procedimentos/${p.id}`}
                    className="btn btn-primary w-100"
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-12">
            <div className="alert alert-warning">
              Nenhum procedimento encontrado.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
