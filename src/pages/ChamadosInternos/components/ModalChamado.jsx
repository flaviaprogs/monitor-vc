"use client"
import { Modal, Button, Form, Badge } from "react-bootstrap"
import { EQUIPES } from "../utils/index.js"

export default function ModalChamado({
  showModal,
  fecharModal,
  editChamado,
  novoChamado,
  setNovoChamado,
  handleChange,
  formValido,
  salvarChamado,
}) {
  return (
    <Modal show={showModal} onHide={fecharModal} backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>{editChamado ? "Editar" : "Novo"} Chamado</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Nome Completo da Sala</Form.Label>
            <Form.Control
              name="nomeCompleto"
              value={novoChamado.nomeCompleto}
              onChange={handleChange}
              placeholder="JB-LQ303-9AND-SL902-X50"
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Em chamada</Form.Label>
            <Form.Select
              value={novoChamado.emChamada ? "SIM" : "NAO"}
              onChange={(e) =>
                setNovoChamado((prev) => ({
                  ...prev,
                  emChamada: e.target.value === "SIM",
                }))
              }
            >
              <option value="NAO">NÃO</option>
              <option value="SIM">SIM</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nº Chamado</Form.Label>
            <Form.Control
              name="numeroChamado"
              value={novoChamado.numeroChamado}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Status</Form.Label>
            <Badge bg={novoChamado.dataRestauracao ? "success" : "warning"}>
              {novoChamado.dataRestauracao ? "ENCERRADO" : "ABERTO"}
            </Badge>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Tipo de Falha</Form.Label>
            <Form.Select name="tipoFalha" value={novoChamado.tipoFalha} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="STATUS DOWN">STATUS DOWN</option>
              <option value="DIVERGENCIA DE IP">DIVERGENCIA DE IP</option>
              <option value="PAREAMENTO API POLY">PAREAMENTO API</option>
              <option value="P15 DESCONECTADA">P15 DESCONECTADA</option>
              <option value="TC8 DESCONECTADO">TC8 DESCONECTADO</option>
              <option value="SEM CONEXÃO DE REDE">SEM CONEXÃO DE REDE</option>
              <option value="OUTRO">OUTRO</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Equipe Acionada</Form.Label>
            <Form.Select name="equipeAcionada" value={novoChamado.equipeAcionada} onChange={handleChange}>
              <option value="">Selecione</option>
              {EQUIPES.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Data da Queda</Form.Label>
            <Form.Control
              type="datetime-local"
              name="dataQueda"
              value={novoChamado.dataQueda}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Data da Restauração</Form.Label>
            <Form.Control
              type="datetime-local"
              name="dataRestauracao"
              value={novoChamado.dataRestauracao}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>SOLUÇÃO</Form.Label>
            <Form.Select name="solucao" value={novoChamado.solucao} onChange={handleChange}>
              <option value="">Selecione</option>

<option value="NORMALIZADO_SEM_INTERVENCAO">NORMALIZADO SEM INTERVENÇÃO</option>
<option value="RESET_FISICO">RESET FÍSICO</option>
<option value="RESET_REMOTO">RESET REMOTO</option>
<option value="SUBSTITUICAO_EQUIPAMENTO">SUBSTITUIÇÃO DE EQUIPAMENTO</option>

<option value="LIBERACAO_ISE_8021X">LIBERAÇÃO ISE (802.1X)</option>
<option value="TRCA DE PORTA NO SW">TROCA DE PORTA NO SW</option>
<option value="CORRECAO_VLAN">CORREÇÃO DE VLAN</option>
<option value="RESERVA_IP">RESERVA DE IP</option>
<option value="ATUACAO_NETOPS">ATUAÇÃO NETOPS</option>
<option value="RECONFIGURACAO_PORTA_SW">RECONFIGURAÇÃO PORTA DO SW</option>
<option value="RECONFIGURACAO_CONTA_SALA">RECONFIGURAÇÃO DE CONTA DA SALA</option>
<option value="ATUALIZACAO_FIRMWARE">ATUALIZAÇÃO DE FIRMWARE</option>

<option value="CHAMADO_INDEVIDO">CHAMADO INDEVIDO</option>
<option value="DESCONECTADO PELO USUARIO">DESCONECTADO PELO USUÁRIO</option>
              
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="observacoes"
              value={novoChamado.observacoes}
              onChange={handleChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={fecharModal}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={salvarChamado} disabled={!formValido}>
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
