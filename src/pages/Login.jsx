// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Form } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

// usuários locais (enquanto não liga no banco)
const usuariosValidos = {
  anderson: "1234",
  altair: "1234",
  flavia:  "1234",
  admin:   "admin",
};

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  function handleSubmit(e) {
    e.preventDefault();
    const u = (usuario || "").trim().toLowerCase();
    const s = (senha || "").trim();

    if (usuariosValidos[u] && usuariosValidos[u] === s) {
      login(u); // salva no contexto + localStorage
      navigate(from, { replace: true });
    } else {
      alert("Usuário ou senha incorretos.");
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card p-4">
        {/* Cabeçalho visual com logo e frase */}
        <div className="login-header">
          <img
            src={process.env.PUBLIC_URL + "/globo-logo.png"}
            alt="Globo"
            className="login-logo"
          />
          <h2 className="login-title">Bem-vindo(a) ao Painel de Monitoração de Videoconferência</h2>
        </div>

        {/* Form mantém a mesma funcionalidade */}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="login-label">Usuário</Form.Label>
            <Form.Control
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Digite seu usuário"
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="login-label">Senha</Form.Label>
            <Form.Control
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
            />
          </Form.Group>

          <button type="submit" className="btn login-button w-100">
            Entrar
          </button>
        </Form>

        <p className="login-footer">© Globo — Infraestrutura de Videoconferência</p>
      </Card>
    </div>
  );
}
