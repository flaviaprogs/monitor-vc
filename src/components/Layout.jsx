// 📁 src/components/Layout.jsx
import React, { Suspense } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const SIDEBAR_WIDTH = 240;

export default function Layout({ onLogout }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof onLogout === "function") onLogout();
    if (typeof logout === "function") logout();
    navigate("/login", { replace: true });
  };

  // tenta vários campos para exibir o nome corretamente
  const displayName =
    user?.displayname || user?.displayName || user?.name || user?.username || "usuário";

  return (
    <div className="layout" style={{ backgroundColor: "#f5f7fb" }}>
      {/* Sidebar fixa à esquerda */}
      <aside
        className="layout-sidebar"
        style={{
          width: SIDEBAR_WIDTH,
          flex: "0 0 auto",
          height: "100vh",
          position: "sticky",
          top: 0,
          borderRight: "1px solid rgba(0,0,0,.06)",
          background: "#1f2a40",
        }}
        aria-label="Navegação lateral"
      >
        <Sidebar onLogout={handleLogout} />
      </aside>

      {/* Coluna da direita: Topbar + Conteúdo */}
      <main
        className="d-flex flex-column"
        style={{ flex: "1 1 auto", minWidth: 0, background: "var(--glb-bg)" }}
      >
        {/* Topbar (usa estilos globais .topbar) */}
        <header className="topbar" role="banner">
          <h5 className="m-0 fw-bold" style={{ letterSpacing: ".2px" }}>
            Painel VC
          </h5>
          <div className="d-inline-flex align-items-center gap-2" style={{ fontSize: 14 }}>
            <span style={{
              fontWeight: 600,
              maxWidth: "28ch",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              Bem-vindo(a), {displayName}
            </span>
            <button
              onClick={handleLogout}
              title="Sair"
              style={{
                border: 0,
                padding: "6px 12px",
                borderRadius: 8,
                background: "#ffffff1a",
                color: "#fff",
                transition: "background .2s ease, transform .08s ease"
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff33")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff1a")}
            >
              Sair
            </button>
          </div>
        </header>

        {/* Área de conteúdo que ocupa toda a altura disponível */}
        <section className="content-wrap">
          {/* largura total: sem max-width; se quiser container, troque por container-wide */}
          <div className="container-wide">
            <Suspense
              fallback={
                <div
                  className="d-flex align-items-center text-muted"
                  style={{ minHeight: 120 }}
                >
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  Carregando…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
