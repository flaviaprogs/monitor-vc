// src/auth/api.js
const API = "http://:4000";

export async function login(password) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // IMPORTANTE: mandar/receber cookie
    body: JSON.stringify({ password })
  });
  return r.json();
}

export async function logout() {
  const r = await fetch(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  return r.json();
}

export async function me() {
  const r = await fetch(`${API}/auth/me`, {
    credentials: "include"
  });
  return r.json();
}
