import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  BarChart2,
  ClipboardList,
  Phone,
  BookOpen,
  Shield,
  Network,
  Activity,
  Wifi,
  Server,
  FileText,
  Monitor,
  AlertCircle,
  Satellite,
  AlertTriangle, // ✅ NOVO ÍCONE
} from "lucide-react";
import "./Sidebar.css";

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-header">
        <img
          src={process.env.PUBLIC_URL + "/globo-logo.png"}
          alt="Globo"
          className="sidebar-logo"
        />
        <h2 className="sidebar-title">Painel Videoconferência</h2>
      </div>

      {/* MENU */}
      <nav className="nav flex-column">
        <NavLink to="/" end className={linkClass}>
          <Home className="icon" size={18} />
          <span>Início</span>
        </NavLink>

        <NavLink to="/dashboard" className={linkClass}>
          <BarChart2 className="icon" size={18} />
          <span>Painel</span>
        </NavLink>

        <NavLink to="/resumo" className={linkClass}>
          <Activity className="icon" size={18} />
          <span>Resumo Mensal</span>
        </NavLink>

        <NavLink to="/chamados" className={linkClass}>
          <ClipboardList className="icon" size={18} />
          <span>Chamados Internos</span>
        </NavLink>

        {/* ✅ NOVO BOTÃO SALA OBS */}
        <NavLink to="/salas-obs" className={linkClass}>
          <AlertTriangle className="icon" size={18} />
          <span>Sala OBS</span>
        </NavLink>

        {/* VALIDAÇÃO ALARMES */}
        <NavLink to="/validacao-alarmes" className={linkClass}>
          <Satellite className="icon" size={18} />
          <span>Validação Alarmes</span>
        </NavLink>

        <NavLink to="/radar" className={linkClass}>
          <AlertCircle className="icon" size={18} />
          <span>Radar Operacional</span>
        </NavLink>

        <NavLink to="/EvidenciasMTR" className={linkClass}>
          <Activity className="icon" size={18} />
          <span>Monit Rooms</span>
        </NavLink>

        <NavLink to="/tv" className={linkClass}>
          <Monitor className="icon" size={18} />
          <span>Modo TV NOC</span>
        </NavLink>

        <NavLink to="/contatos" className={linkClass}>
          <Phone className="icon" size={18} />
          <span>Contatos</span>
        </NavLink>

        <NavLink to="/procedimentos" className={linkClass}>
          <BookOpen className="icon" size={18} />
          <span>Procedimentos</span>
        </NavLink>

        <NavLink to="/falhas-checklist" className={linkClass}>
          <Shield className="icon" size={18} />
          <span>Falhas de Checagem</span>
        </NavLink>

        <NavLink to="/AnaliseCSV" className={linkClass}>
          <FileText className="icon" size={18} />
          <span>Análise CSV</span>
        </NavLink>

        <NavLink to="/reserva-ip" className={linkClass}>
          <Shield className="icon" size={18} />
          <span>Reserva IP</span>
        </NavLink>

        <NavLink to="/diagrama" className={linkClass}>
          <Network className="icon" size={18} />
          <span>Diagrama</span>
        </NavLink>

        <NavLink to="/inventario" className={linkClass}>
          <Wifi className="icon" size={18} />
          <span>Inventário PolyLens</span>
        </NavLink>

        <NavLink to="/painel-comparativo" className={linkClass}>
          <Server className="icon" size={18} />
          <span>Painel Comparativo</span>
        </NavLink>

        <NavLink to="/logs" className={linkClass}>
          <FileText className="icon" size={18} />
          <span>Logs</span>
        </NavLink>
      </nav>
    </aside>
  );
}
