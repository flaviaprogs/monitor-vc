// 📁 src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "react-bootstrap";

function toTitleCase(s = "") {
  return s
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Home() {
  const [rawUser, setRawUser] = useState(null);

  // Carrega 1x do localStorage ao montar
  useEffect(() => {
    const raw = localStorage.getItem("usuarioLogado");
    setRawUser(raw ?? null);
  }, []);

  // Resolve o nome exibido aceitando string ou JSON { username, displayname }
  const displayName = useMemo(() => {
    if (!rawUser) return "Usuário";

    let usernameLike = ""; // para mapear no dicionário
    let pretty = "";       // para exibir na tela

    try {
      const parsed = JSON.parse(rawUser);
      // Caso seja JSON: prioriza displayname, cai para username
      pretty = parsed.displayname || parsed.displayName || parsed.name || parsed.username || "";
      usernameLike = (parsed.username || parsed.displayname || parsed.displayName || pretty || "").toLowerCase().trim();
    } catch {
      // Caso seja string: usa direto
      usernameLike = String(rawUser).toLowerCase().trim();
      pretty = rawUser;
    }

    // Dicionário de nomes “bonitos”
    const nomesCompletos = {
      anderson: "Anderson Paz",
      altair: "Altair Mello",
      flavia: "Flavia Almeida",
    };

    // Se houver no dicionário, usa; senão, formata “bonito”
    return nomesCompletos[usernameLike] || toTitleCase(pretty) || "Usuário";
  }, [rawUser]);

  return (
    <div className="container mt-5">
      <Card className="shadow p-4">
        <h2 className="mb-4">Bem-vindo(a), {displayName}!</h2>

        <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
          Este sistema foi desenvolvido para apoiar o monitoramento e a gestão da infraestrutura de
          <strong> Videoconferência</strong> da empresa.
        </p>

        <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
          Através do painel, você pode acompanhar:
        </p>

        <ul style={{ fontSize: "17px", paddingLeft: "20px" }}>
          <li>Chamados internos e InCall de videoconferência;</li>
          <li>Monitoramento de salas críticas e prioritárias;</li>
          <li>Relatórios de disponibilidade e falhas;</li>
          <li>Checklist de vistorias técnicas nas salas.</li>
        </ul>

        <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
          Nosso objetivo é garantir a <strong>estabilidade e a qualidade das reuniões</strong> realizadas via videoconferência.
        </p>
      </Card>
    </div>
  );
}
