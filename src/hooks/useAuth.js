// hook seguro: funciona com ou sem AuthContext
import { useMemo } from "react";

export default function useAuth() {
  // 1) tenta ler do localStorage
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem("authUser") || "null");
  } catch (_) {}

  // 2) fallback super simples
  const user = raw && typeof raw === "object" ? raw : null;

  // Admin se role === 'admin' (case-insensitive)
  const isAdmin = useMemo(() => {
    const role = String(user?.role || "").toLowerCase();
    return role === "admin";
  }, [user]);

  return {
    user,
    isAdmin,
    loginAsAdmin: () => {
      localStorage.setItem(
        "authUser",
        JSON.stringify({ name: "Admin", role: "admin" })
      );
      window.location.reload();
    },
    logout: () => {
      localStorage.removeItem("authUser");
      window.location.reload();
    },
  };
}
