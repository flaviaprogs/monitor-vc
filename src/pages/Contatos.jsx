import React from 'react';
import { Table, Card } from 'react-bootstrap';

function Contatos() {
  const contatos = [
    { equipe: "Videoconferência", contato: "videoconferencia@empresa.com", telefone: "(21) 99999-0001" },
    { equipe: "Redes / NetOps", contato: "netops@empresa.com", telefone: "(21) 99999-0002" },
    { equipe: "Field Telecom", contato: "field@empresa.com", telefone: "(21) 99999-0003" },
    { equipe: "InfraCloud Windows", contato: "suporte.infracloud@g.globo", telefone: "(21) 99999-0003" },
  ];

  const links = [
    { nome: "PolyLens", url: "https://polylens.poly.com" },
    { nome: "Broadcom (Monitoramento)", url: "https://broadcom.com" },
    { nome: "Grafana", url: "https://grafana.globo.com" },
    { nome: "ServiceNow", url: "https://servicenow.globo.com" },
    { nome: "Planner", url: "https://tasks.office.com" },
    { nome: "Agendamento de Salas", url: "https://outlook.office.com/calendar" }
  ];

  const procedimentos = [
    {
      titulo: "Falha de Autenticação 802.1x",
      passos: [
        "Verificar se o cabo de rede está corretamente conectado.",
        "Solicitar ao Field Telecom certificação do cabeamento.",
        "Validar chamada com técnico na sala.",
        "Se persistir, abrir chamado para redes (NetOps)."
      ]
    },
    {
      titulo: "Equipamento sem rede / status DOWN",
      passos: [
        "Acessar a PolyLens e verificar status.",
        "Solicitar reset do equipamento com técnico local.",
        "Verificar portas do switch no Grafana.",
        "Se o problema continuar, abrir chamado para Field Telecom."
      ]
    }
  ];

  return (
    <div className="container my-4">
      <h2>📘 Contatos Úteis & Procedimentos</h2>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>🔗 Links Rápidos</Card.Title>
          <ul>
            {links.map((link, i) => (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noreferrer">{link.nome}</a>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>📞 Contatos Técnicos</Card.Title>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Equipe</th>
                <th>Email</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((c, i) => (
                <tr key={i}>
                  <td>{c.equipe}</td>
                  <td>{c.contato}</td>
                  <td>{c.telefone}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>🛠️ Procedimentos Rápidos</Card.Title>
          {procedimentos.map((p, i) => (
            <div key={i} className="mb-3">
              <h5>{p.titulo}</h5>
              <ul>
                {p.passos.map((passo, j) => (
                  <li key={j}>{passo}</li>
                ))}
              </ul>
            </div>
          ))}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Contatos;
