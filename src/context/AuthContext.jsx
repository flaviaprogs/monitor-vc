// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // carrega do localStorage ao iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuarioLogado");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {}
  }, []);

  function login(username) {
    // normaliza e gera display
    const u = (username || "").trim();
    const displayName = u
      ? u.charAt(0).toUpperCase() + u.slice(1).toLowerCase()
      : "Usuário";

    const obj = { username: u.toLowerCase(), displayName };
    setUser(obj);
    localStorage.setItem("usuarioLogado", JSON.stringify(obj));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("usuarioLogado");
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
