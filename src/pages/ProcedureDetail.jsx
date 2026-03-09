import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { PROCEDURES } from "../data/procedures";
import useAuth from "../hooks/useAuth";
import { mergeCatalog } from "../data/procedures-store";

export default function ProcedureDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const procedures = useMemo(() => mergeCatalog(PROCEDURES), []);
  const item = useMemo(
    () => procedures.find((p) => String(p.id) === String(id)),
    [procedures, id]
  );

  if (!item) {
    return (
      <div className="p-4">
        <div className="alert alert-warning">Procedimento não encontrado.</div>
        <Link to="/procedimentos" className="btn btn-secondary">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 m-0">{item.title}</h1>
        <div className="d-flex gap-2">
          {isAdmin && (
            <Link to={`/procedimentos/${item.id}/editar`} className="btn btn-primary">
              Editar
            </Link>
          )}
          <Link to="/procedimentos" className="btn btn-outline-secondary">
            Voltar
          </Link>
        </div>
      </div>

      {item.summary && <p className="text-muted">{item.summary}</p>}

      {!!(item.tags && item.tags.length) && (
        <div className="mb-3" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {item.tags.map((tag) => (
            <span key={tag} className="badge bg-secondary">
              {tag}
            </span>
          ))}
        </div>
      )}

      {(item.sections || []).map((sec, idx) => (
        <div key={idx} className="card mb-3">
          <div className="card-body">
            {sec.heading && <h5 className="card-title">{sec.heading}</h5>}

            {!!(sec.items && sec.items.length) && (
              <ul className="mb-0">
                {sec.items.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            )}

            {typeof sec.note === "string" && sec.note.trim() && (
              <pre className="mt-3 p-2 bg-dark text-light border rounded" style={{ whiteSpace: "pre-wrap" }}>
                {sec.note}
              </pre>
            )}
          </div>
        </div>
      ))}

      {!!(item.diagramLinks && item.diagramLinks.length) && (
        <div className="mt-3">
          <h6>Atalhos de Diagrama</h6>
          <div className="d-flex flex-wrap gap-2">
            {item.diagramLinks.map((d, i) => (
              <Link key={i} to={d.to} className="btn btn-sm btn-outline-primary">
                {d.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
