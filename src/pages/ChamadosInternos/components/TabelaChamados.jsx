"use client"
import { Table, Badge, Button } from "react-bootstrap"
import { Edit, Trash, MessageSquare, Mail, Star } from "lucide-react"
import { toBRDateTime, mapLocalidade, getPredioMacro } from "../utils/index.js"

function serviceNowUrl(numeroChamado) {
  const n = String(numeroChamado || "").toUpperCase()
  if (n.startsWith("INC")) return `https://globoservice.service-now.com/incident_list.do?sysparm_query=number=${n}`
  if (n.startsWith("RITM")) return `https://globoservice.service-now.com/sc_req_item_list.do?sysparm_query=number=${n}`
  return `https://globoservice.service-now.com/now/nav/ui/classic/params/target/sc_req_item.do?sys_id=${encodeURIComponent(
    n,
  )}`
}

function LinhaChamado({ c, abrirModal, excluirChamado, abrirWhatsApp, abrirEmail }) {
  const hasObs = Boolean((c.observacoes || "").trim())
  const isAberto = !c.dataRestauracao
  const status = isAberto ? "ABERTO" : "ENCERRADO"
  const predioMacro = getPredioMacro(c)

  const rowClasses = [
    !isAberto ? "table-success" : "",
    hasObs && isAberto ? "row-obs-open" : "",
    c.recorrenciaCritica ? "row-recorrencia-critica" : "",
    c.salaInstavel && !c.recorrenciaCritica ? "row-sala-instavel" : "",
  ]
    .filter(Boolean)
    .join(" ")

  if (c.recorrenciaCritica || c.salaInstavel) {
    console.log("[v0] 🎨 Aplicando classes CSS para:", c.numeroChamado, {
      recorrenciaCritica: c.recorrenciaCritica,
      salaInstavel: c.salaInstavel,
      classes: rowClasses,
    })
  }

  return (
    <tr className={rowClasses} title={hasObs ? `Observações: ${c.observacoes}` : undefined}>
      <td>
        <a href={serviceNowUrl(c.numeroChamado)} target="_blank" rel="noopener noreferrer">
          {c.numeroChamado}
        </a>
      </td>
      <td>
        <Badge bg={c.emChamada ? "danger" : "secondary"}>{c.emChamada ? "SIM" : "NÃO"}</Badge>
      </td>
      <td>{predioMacro}</td>
      <td>{mapLocalidade(c.predio)}</td>
      <td>{c.andar}</td>
      <td className={c.prioridade ? "text-danger fw-bold" : ""}>
        {c.sala} {c.prioridade && <Star size={14} className="text-danger ms-1" strokeWidth={2} />}
      </td>
      <td>{c.equipamento}</td>
      <td>
        <Badge bg={status === "ABERTO" ? "warning" : "success"}>{status}</Badge>
      </td>
      <td>{c.tipoFalha}</td>
      <td>
        <Badge bg="secondary">{c.equipeAcionada || "-"}</Badge>
      </td>
      <td>{toBRDateTime(c.dataQueda)}</td>
      <td>{toBRDateTime(c.dataRestauracao)}</td>
      <td>{c.tempoIndisponibilidade}</td>
      <td>{c.solucao}</td>
      <td>{toBRDateTime(c.criadoEm)}</td>
      <td className="d-flex gap-1">
        <Button variant="outline-success" size="sm" title="Acionar via WhatsApp" onClick={() => abrirWhatsApp(c)}>
          <MessageSquare size={16} />
        </Button>
        <Button variant="outline-info" size="sm" title="Enviar e-mail" onClick={() => abrirEmail(c)}>
          <Mail size={16} />
        </Button>
        <Button variant="outline-primary" size="sm" title="Editar" onClick={() => abrirModal(c)}>
          <Edit size={16} />
        </Button>
        <Button variant="outline-danger" size="sm" title="Excluir" onClick={() => excluirChamado(c.id)}>
          <Trash size={16} />
        </Button>
      </td>
    </tr>
  )
}

export default function TabelaChamados({ fonte, abrirModal, excluirChamado, abrirWhatsApp, abrirEmail }) {
  return (
    <Table striped bordered hover responsive size="sm">
      <thead className="table-dark small">
        <tr>
          <th>Chamado</th>
          <th>Em chamada</th>
          <th>Localidade (Prédio)</th>
          <th>Prédio</th>
          <th>Andar</th>
          <th>Sala</th>
          <th>Equip</th>
          <th>Status</th>
          <th>Falha</th>
          <th>Equipe</th>
          <th>Queda</th>
          <th>Restaurado</th>
          <th>Indisp</th>
          <th>Solução</th>
          <th>Criado Em</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody className="small" style={{ fontSize: "0.75rem" }}>
        {fonte.length === 0 ? (
          <tr>
            <td colSpan={16} className="text-center text-muted py-3">
              Nenhum chamado para os filtros atuais.
            </td>
          </tr>
        ) : (
          fonte.map((c) => (
            <LinhaChamado
              key={c.id}
              c={c}
              abrirModal={abrirModal}
              excluirChamado={excluirChamado}
              abrirWhatsApp={abrirWhatsApp}
              abrirEmail={abrirEmail}
            />
          ))
        )}
      </tbody>
    </Table>
  )
}
