// 📁 src/services/api.js
export const internos = {
  async list() {
    const r = await fetch("/api/chamados", { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`GET /api/chamados -> ${r.status}`);
    const data = await r.json();
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  },

  async create(body) {
    const r = await fetch("/api/chamados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async update(id, body) {
    const r = await fetch(`/api/chamados/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async remove(id) {
    const r = await fetch(`/api/chamados/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text());
    return true;
  },
};
