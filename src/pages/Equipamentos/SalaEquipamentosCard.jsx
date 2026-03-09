import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";

function StatusBadge({ status }) {
  const variant =
    status === "online" ? "success" :
    status === "offline" ? "danger" :
    "secondary";

  return <Badge bg={variant}>{status || "desconhecido"}</Badge>;
}

export default function SalaEquipamentosCard({ sala, x50, tc8 }) {
  return (
    <Card className="mb-4">
      <Card.Header>
        <strong>Sala:</strong> {sala}
      </Card.Header>

      <Card.Body>
        <h6>Codec (X50)</h6>
        {x50 ? (
          <ul>
            <li>IP: {x50.ip}</li>
            <li>MAC: {x50.mac}</li>
            <li>Status: <StatusBadge status={x50.status} /></li>
          </ul>
        ) : (
          <p className="text-muted">Não encontrado</p>
        )}

        <hr />

        <h6>Controller (TC8)</h6>
        {tc8 ? (
          <ul>
            <li>IP: {tc8.ip}</li>
            <li>MAC: {tc8.mac}</li>
            <li>Status: <StatusBadge status={tc8.status} /></li>
          </ul>
        ) : (
          <p className="text-muted">Não encontrado</p>
        )}
      </Card.Body>
    </Card>
  );
}
