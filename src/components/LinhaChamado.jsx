import { Badge, Button } from "react-bootstrap";
import { Edit, Trash, MessageSquare, Mail, Star } from "lucide-react";
import { getPredioMacro } from "../utils/predios";

export default function LinhaChamado({
  c,
  abrirWhatsApp,
  abrirEmail,
  abrirModal,
  excluirChamado,
}) {
  const isAberto = !c.dataRestauracao;
  const status = isAberto ? "ABERTO" : "ENCERRADO";
  const predioMacro = getPredioMacro(c);

  return (
    <tr>
      <td>{c.numeroChamado}</td>

      <td>
        <Badge bg={c.emChamada ? "danger" : "secondary"}>
          {c.emChamada ? "SIM" : "NÃO"}
        </Badge>
      </td>

      <td>{predioMacro}</td>
      <td>{c.predio}</td>
      <td>{c.andar}</td>

      <td className={c.prioridade ? "text-danger fw-bold" : ""}>
        {c.sala}
        {c.prioridade && <Star size={14} className="ms-1" />}
      </td>

      <td>{c.equipamento}</td>

      <td>
        <Badge bg={status === "ABERTO" ? "warning" : "success"}>
          {status}
        </Badge>
      </td>

      <td>{c.tipoFalha}</td>
      <td>{c.equipeAcionada}</td>

      {/* 🔥 NOVAS COLUNAS */}
      <td>{c.causa || "-"}</td>
      <td>{c.acaoExecutada || "-"}</td>

      <td className="d-flex gap-1">
        <Button size="sm" onClick={() => abrirWhatsApp(c)}>
          <MessageSquare size={14} />
        </Button>
        <Button size="sm" onClick={() => abrirEmail(c)}>
          <Mail size={14} />
        </Button>
        <Button size="sm" onClick={() => abrirModal(c)}>
          <Edit size={14} />
        </Button>
        <Button size="sm" onClick={() => excluirChamado(c.id)}>
          <Trash size={14} />
        </Button>
      </td>
    </tr>
  );
}