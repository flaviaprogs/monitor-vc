import { Table } from "react-bootstrap";
import LinhaChamado from "./LinhaChamado";

export default function TabelaChamados({ fonte, ...handlers }) {
  return (
    <Table striped bordered hover responsive size="sm">
      <thead className="table-dark">
        <tr>
          <th>Chamado</th>
          <th>Em chamada</th>
          <th>Localidade</th>
          <th>Prédio</th>
          <th>Andar</th>
          <th>Sala</th>
          <th>Equip</th>
          <th>Status</th>
          <th>Falha</th>
          <th>Equipe</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {fonte.map((c) => (
          <LinhaChamado key={c.id} c={c} {...handlers} />
        ))}
      </tbody>
    </Table>
  );
}