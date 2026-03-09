// src/lib/api.js
export const API_BASE = process.env.REACT_APP_API_BASE || '/api';

// ⚠️ Ajuste isso para ler do SEU login.
// Ex.: se você guarda o usuário em contexto, redux ou localStorage, adapte aqui.
export const currentUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
})();

export async function getProcedures() {
  const r = await fetch(`${API_BASE}/procedures`);
  if (!r.ok) throw new Error('Falha ao carregar procedures');
  return r.json();
}

export async function getFavs(user) {
  const r = await fetch(`${API_BASE}/favs?user=${encodeURIComponent(user)}`);
  if (!r.ok) throw new Error('Falha ao carregar favoritos');
  return r.json();
}

export async function toggleFav(user, procedure_id) {
  const r = await fetch(`${API_BASE}/favs/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, procedure_id })
  });
  if (!r.ok) throw new Error('Falha ao atualizar favorito');
  return r.json();
}
