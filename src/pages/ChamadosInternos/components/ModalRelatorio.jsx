"use client"

// Modal de relatório personalizado

import { useState } from "react"
import { Modal, Button, Form, Row, Col } from "react-bootstrap"

export default function ModalRelatorio({ showRelModal, fecharRelPersonalizado, gerarRelatorioPersonalizado }) {
  const [customDe, setCustomDe] = useState("")
  const [customAte, setCustomAte] = useState("")

  const handleGerar = () => {
    gerarRelatorioPersonalizado(customDe, customAte)
  }

  return (
    <Modal show={showRelModal} onHide={fecharRelPersonalizado} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>Relatório Personalizado (XLSX)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="g-2">
            <Col md={6}>
              <Form.Label>De</Form.Label>
              <Form.Control type="datetime-local" value={customDe} onChange={(e) => setCustomDe(e.target.value)} />
            </Col>
            <Col md={6}>
              <Form.Label>Até</Form.Label>
              <Form.Control type="datetime-local" value={customAte} onChange={(e) => setCustomAte(e.target.value)} />
            </Col>
          </Row>
          <Form.Text className="text-muted">
            O relatório conterá abas: KPIs, Localidades, Falhas, Soluções, Equipes, Local x Falha, Top Prioritárias e
            Detalhes.
          </Form.Text>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={fecharRelPersonalizado}>
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleGerar}>
          Gerar XLSX
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
