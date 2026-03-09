// 📁 src/App.js
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Layout from "./components/Layout";

// ✅ Procedimentos
import ProceduresIndex from "./pages/ProceduresIndex";
import ProcedureView from "./pages/ProcedureView";
import ProcedureEdit from "./pages/ProcedureEdit";

// ✅ Páginas fixas
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ResumoMensal from "./pages/ResumoMensal";
import ChamadosInternos from "./pages/ChamadosInternos";
import EvidenciasMTR from "./pages/EvidenciasMTR";
import Contatos from "./pages/Contatos";
import FalhasDeChecagem from "./pages/FalhasDeChecagem";
import DiagramaHome from "./pages/DiagramaHome";
import DiagramaSite from "./pages/DiagramaSite";
import DiagramaDetalhado from "./pages/DiagramaDetalhado";
import AnaliseCSV from "./pages/AnaliseCSV";
import InventarioPolyLens from "./pages/InventarioPolyLens";
import PainelComparativo from "./pages/PainelComparativo";
import RadarOperacional from "./pages/RadarOperacional";
import Login from "./pages/Login";
import Equipamentos from "./pages/Equipamentos/Equipamentos";
import MonitorNOC from "./pages/MonitorNOC"; // ✅ Monitor NOC agora no /tv
import SalasObs from "./pages/SalasObs";

// ✅ NOVA FEATURE — Validação de Alarmes
import ValidacaoAlarmesPoly from "./components/ValidacaoAlarmesPoly";

// ✅ Contextos
import { AlarmDataProvider } from "./context/AlarmDataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RadarProvider } from "./radar/RadarContext";

// ✅ Estilos
import "./styles/theme.css";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

// ✅ Lazy pages
const LogReaderPage = lazy(() => import("./pages/LogReaderPage"));
const ReservaVerificacaoIP = lazy(() =>
  import("./pages/ReservaVerificacaoIP")
);

/* 🔒 Rota protegida */
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || "/" }}
      />
    );
  }

  return <Outlet />;
}

/* 🔁 Se já está logado → não deixa ir ao login */
function LoginRouteGuard() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  return (
    <AlarmDataProvider>
      <AuthProvider>
        <RadarProvider>
          <Router>
            <Suspense fallback={<div style={{ padding: 16 }}>Carregando…</div>}>
              <Routes>

                {/* Página pública */}
                <Route path="/login" element={<LoginRouteGuard />} />

                {/* Páginas protegidas */}
                <Route element={<RequireAuth />}>
                  <Route path="/*" element={<Layout />}>

                    <Route index element={<Home />} />

                    <Route path="equipamentos" element={<Equipamentos />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="resumo" element={<ResumoMensal />} />
                    <Route path="chamados" element={<ChamadosInternos />} />
                    <Route path="radar" element={<RadarOperacional />} />

                    {/* ✅ AGORA O MODO TV NOC USA O MONITOR */}
                    <Route path="tv" element={<MonitorNOC />} />

                    <Route path="EvidenciasMTR" element={<EvidenciasMTR />} />
                    <Route path="contatos" element={<Contatos />} />
                    <Route path="salas-obs" element={<SalasObs />} />

                    <Route
                      path="falhas-checklist"
                      element={<FalhasDeChecagem />}
                    />

                    <Route path="AnaliseCSV" element={<AnaliseCSV />} />

                    <Route
                      path="reserva-ip"
                      element={<ReservaVerificacaoIP />}
                    />

                    <Route path="diagrama" element={<DiagramaHome />} />
                    <Route path="diagrama/:site" element={<DiagramaSite />} />
                    <Route
                      path="diagrama/:site/:andar"
                      element={<DiagramaDetalhado />}
                    />

                    <Route
                      path="inventario"
                      element={<InventarioPolyLens />}
                    />

                    <Route
                      path="painel-comparativo"
                      element={<PainelComparativo />}
                    />

                    <Route path="logs" element={<LogReaderPage />} />

                    <Route
                      path="validacao-alarmes"
                      element={<ValidacaoAlarmesPoly />}
                    />

                    <Route
                      path="procedimentos"
                      element={<ProceduresIndex />}
                    />
                    <Route
                      path="procedimentos/:id"
                      element={<ProcedureView />}
                    />
                    <Route
                      path="procedimentos/:id/editar"
                      element={<ProcedureEdit />}
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                  </Route>
                </Route>

              </Routes>
            </Suspense>
          </Router>
        </RadarProvider>
      </AuthProvider>
    </AlarmDataProvider>
  );
}