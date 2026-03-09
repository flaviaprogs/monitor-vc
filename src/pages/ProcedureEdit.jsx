// 📁 src/pages/ProcedureEdit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PROCEDURES } from "../data/procedures";
import useProceduresAPI from "../hooks/useProceduresAPI";

export default function ProcedureEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lê da API com fallback local
  const procedures = useProceduresAPI(PROCEDURES);

  const original = useMemo(
    () => procedures.find((p) => String(p.id) === String(id)) || null,
    [procedures, id]
  );

  const [form, setForm] = useState(() => ({
    id: original?.id || id || "",
    title: original?.title || "",
    summary: original?.summary || "",
    tags: original?.tags || [],
    sections: original?.sections || [{ heading: "", items: [], note: "" }],
    diagramLinks: original?.diagramLinks || [],
  }));

  useEffect(() => {
    if (original) {
      setForm({
        id: original.id,
        title: original.title || "",
        summary: original.summary || "",
        tags: Array.isArray(original.tags) ? original.tags : [],
        sections: Array.isArray(original.sections) ? original.sections : [],
        diagramLinks: Array.isArray(original.diagramLinks) ? original.diagramLinks : [],
      });
    }
  }, [original]);

  if (!user) {
    return (
      <div className="p-4">
        <div className="alert alert-warning">Faça login para continuar.</div>
        <Link to="/login" className="btn btn-primary">Ir para Login</Link>
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="p-4">
        <div className="alert alert-danger">Acesso restrito a administradores.</div>
        <Link to={`/procedimentos/${id}`} className="btn btn-secondary">Voltar</Link>
      </div>
    );
  }

  const setField = (key, value) => setForm((s) => ({ ...s, [key]: value }));
  const handleTagInput = (e) =>
    setField(
      "tags",
      e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
    );

  // Seções
  const addSection = () =>
    setField("sections", [...form.sections, { heading: "", items: [], note: "" }]);
  const updateSection = (idx, patch) => {
    const clone = [...form.sections];
    clone[idx] = { ...clone[idx], ...patch };
    setField("sections", clone);
  };
  const removeSection = (idx) => {
    const clone = [...form.sections];
    clone.splice(idx, 1);
    setField("sections", clone);
  };

  // Itens
  const addItem = (sidx) => {
    const sec = form.sections[sidx];
    const clone = [...form.sections];
    clone[sidx] = { ...sec, items: [...(sec.items || []), ""] };
    setField("sections", clone);
  };
  const updateItem = (sidx, iidx, value) => {
    const sec = form.sections[sidx];
    const items = [...(sec.items || [])];
    items[iidx] = value;
    updateSection(sidx, { items });
  };
  const removeItem = (sidx, iidx) => {
    const sec = form.sections[sidx];
    const items = [...(sec.items || [])];
    items.splice(iidx, 1);
    updateSection(sidx, { items });
  };

  // Diagram links
  const addDiagram = () =>
    setField("diagramLinks", [...(form.diagramLinks || []), { label: "", to: "" }]);
  const updateDiagram = (idx, patch) => {
    const arr = [...(form.diagramLinks || [])];
    arr[idx] = { ...arr[idx], ...patch };
    setField("diagramLinks", arr);
  };
  const removeDiagram = (idx) => {
    const arr = [...(form.diagramLinks || [])];
    arr.splice(idx, 1);
    setField("diagramLinks", arr);
  };

  // Submit (usa o hook; se sua versão não tiver .save, me avisa que troco por fetch)
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return alert("Título é obrigatório.");
    try {
      const saved = await procedures.save(form);
      navigate(`/procedimentos/${saved.id}`);
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar. Verifique a API de procedimentos.");
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 m-0">Editar Procedimento</h1>
        <div className="d-flex gap-2">
          <Link to={`/procedimentos/${id}`} className="btn btn-outline-secondary">Cancelar</Link>
          <button className="btn btn-primary" onClick={onSubmit}>Salvar</button>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="card mb-3">
          <div className="card-body">
            <div className="mb-2">
              <label className="form-label">Título</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Resumo</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.summary}
                onChange={(e) => setField("summary", e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Tags (separadas por vírgula)</label>
              <input
                className="form-control"
                value={form.tags.join(", ")}
                onChange={handleTagInput}
              />
            </div>
          </div>
        </div>

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0">Seções</h6>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSection}>
            + Adicionar Seção
          </button>
        </div>

        {form.sections.map((sec, sidx) => (
          <div key={sidx} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Seção #{sidx + 1}</strong>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeSection(sidx)}
                >
                  Remover
                </button>
              </div>

              <div className="mb-2">
                <label className="form-label">Heading</label>
                <input
                  className="form-control"
                  value={sec.heading || ""}
                  onChange={(e) => updateSection(sidx, { heading: e.target.value })}
                />
              </div>

              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label">Itens</label>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => addItem(sidx)}>
                    + Item
                  </button>
                </div>
                {(sec.items || []).map((it, iidx) => (
                  <div key={iidx} className="d-flex gap-2 mb-1">
                    <input
                      className="form-control"
                      value={it}
                      onChange={(e) => updateItem(sidx, iidx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeItem(sidx, iidx)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>

              <div className="mb-2">
                <label className="form-label">Nota (bloco de texto)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={sec.note || ""}
                  onChange={(e) => updateSection(sidx, { note: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0">Atalhos de Diagrama</h6>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={addDiagram}>
            + Atalho
          </button>
        </div>

        {(form.diagramLinks || []).map((d, idx) => (
          <div key={idx} className="card mb-2">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-5">
                  <label className="form-label">Label</label>
                  <input
                    className="form-control"
                    value={d.label || ""}
                    onChange={(e) => updateDiagram(idx, { label: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Caminho (to)</label>
                  <input
                    className="form-control"
                    placeholder="/diagrama/CITTA"
                    value={d.to || ""}
                    onChange={(e) => updateDiagram(idx, { to: e.target.value })}
                  />
                </div>
                <div className="col-md-1 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger w-100"
                    onClick={() => removeDiagram(idx)}
                  >
                    X
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Link to={`/procedimentos/${id}`} className="btn btn-outline-secondary">Cancelar</Link>
          <button className="btn btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </div>
  );
}
