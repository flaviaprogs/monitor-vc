/**
 * Camada de dados com fallback:
 * 1) tenta usar API REST em /api/<resource>
 * 2) se falhar, usa localStorage
 */
const LS_PREFIX = "glb_";

async function tryApi(path, opts) {
  try {
    const r = await fetch(path, opts);
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } catch {
    return null;
  }
}

/* ===== CRUD genérico ===== */
export async function list(resource) {
  const api = await tryApi(`/api/${resource}`, { headers: { Accept: "application/json" } });
  if (api) return api;

  // fallback
  const raw = localStorage.getItem(LS_PREFIX + resource);
  return raw ? JSON.parse(raw) : [];
}

export async function upsert(resource, item, key = "id") {
  // API (POST/PUT)
  const method = item[key] ? "PUT" : "POST";
  const api = await tryApi(`/api/${resource}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (api) return api;

  // fallback localStorage
  const cur = await list(resource);
  if (!item[key]) item[key] = crypto.randomUUID();
  const idx = cur.findIndex((x) => x[key] === item[key]);
  if (idx >= 0) cur[idx] = item; else cur.push(item);
  localStorage.setItem(LS_PREFIX + resource, JSON.stringify(cur));
  return item;
}

export async function removeItem(resource, id, key = "id") {
  const api = await tryApi(`/api/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (api) return true;

  const cur = await list(resource);
  const next = cur.filter((x) => x[key] !== id);
  localStorage.setItem(LS_PREFIX + resource, JSON.stringify(next));
  return true;
}
