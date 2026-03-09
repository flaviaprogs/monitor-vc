import React, { useEffect, useState } from "react";

const API = "http://10.22.142.57:4000";

export default function SalasObs() {
  const [lista, setLista] = useState([]);
  const [filtroSala, setFiltroSala] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  // ===============================
  // CARREGAR DO BANCO SQLITE
  // ===============================
  async function carregar() {
    try {
      const response = await fetch(`${API}/salas-obs`);
      const data = await response.json();
      setLista(data);
    } catch (err) {
      console.error("Erro ao carregar salas:", err);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // ===============================
  // FILTRO
  // ===============================
  const filtrados = lista.filter(item => {
    if (filtroSala && !item.sala.toLowerCase().includes(filtroSala.toLowerCase()))
      return false;
    if (filtroStatus !== "TODOS" && item.status !== filtroStatus)
      return false;
    return true;
  });

  const ativas = lista.filter(i => i.status === "ATIVA").length;
  const resolvidas = lista.filter(i => i.status === "RESOLVIDA").length;

  // ===============================
  // NOVA SALA
  // ===============================
  async function novo() {
    const sala = prompt("Sala:");
    const observacao = prompt("Observação:");

    if (!sala || !observacao) return;

    await fetch(`${API}/salas-obs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sala, observacao })
    });

    carregar();
  }

  // ===============================
  // RESOLVER
  // ===============================
  async function resolver(id) {
    await fetch(`${API}/salas-obs/${id}/resolver`, {
      method: "PUT"
    });

    carregar();
  }

  // ===============================
  // EXCLUIR
  // ===============================
  async function excluir(id) {
    if (!window.confirm("Excluir observação?")) return;

    await fetch(`${API}/salas-obs/${id}`, {
      method: "DELETE"
    });

    carregar();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Salas com Observações</h3>
        <button className="btn btn-success" onClick={novo}>
          + Novo
        </button>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Buscar por sala"
              value={filtroSala}
              onChange={e => setFiltroSala(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="ATIVA">Ativas</option>
              <option value="RESOLVIDA">Resolvidas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col">Ativas: <strong>{ativas}</strong></div>
        <div className="col">Resolvidas: <strong>{resolvidas}</strong></div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Sala</th>
              <th>Observação</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.map(item => (
              <tr key={item.id}>
                <td>{item.sala}</td>
                <td>{item.observacao}</td>
                <td>
                  <span className={`badge ${item.status === "ATIVA" ? "bg-warning" : "bg-success"}`}>
                    {item.status}
                  </span>
                </td>
                <td>{new Date(item.criadoEm).toLocaleString()}</td>
                <td>
                  {item.status === "ATIVA" && (
                    <button
                      className="btn btn-sm btn-primary me-1"
                      onClick={() => resolver(item.id)}
                    >
                      Resolver
                    </button>
                  )}

                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => excluir(item.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}

            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  Nenhuma observação encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
