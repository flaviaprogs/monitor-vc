import React, { useState } from 'react';
import { Card, Row, Col, Container, Modal, Button } from 'react-bootstrap';

function TreinamentoVC() {
  const [modalAberto, setModalAberto] = useState('');
  
  const abrirModal = (modal) => setModalAberto(modal);
  const fecharModal = () => setModalAberto('');

  return (
    <Container className="my-4">
      <h2 className="text-center mb-5">Treinamento de Monitoramento de Videoconferência</h2>

      <Row xs={1} md={2} className="g-4">
        {/* Card 1 */}
        <Col>
          <Card bg="primary" text="white" className="h-100" onClick={() => abrirModal('visao')}>
            <Card.Body className="text-center">
              <Card.Title>📄 Visão Geral</Card.Title>
              <Card.Text>Importância do monitoramento.</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 2 */}
        <Col>
          <Card bg="primary" text="white" className="h-100" onClick={() => abrirModal('ferramentas')}>
            <Card.Body className="text-center">
              <Card.Title>🛠️ Ferramentas</Card.Title>
              <Card.Text>Broadcom, Zabbix, Grafana, Poly Lens.</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 3 */}
        <Col>
          <Card bg="warning" text="dark" className="h-100" onClick={() => abrirModal('checklist')}>
            <Card.Body className="text-center">
              <Card.Title>📅 Checklist Diário</Card.Title>
              <Card.Text>Horários fixos de verificação.</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 4 */}
        <Col>
          <Card bg="danger" text="white" className="h-100" onClick={() => abrirModal('modelos')}>
            <Card.Body className="text-center">
              <Card.Title>📑 Modelos de Chamados</Card.Title>
              <Card.Text>Como abrir e acompanhar chamados.</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 5 */}
        <Col>
          <Card bg="primary" text="white" className="h-100" onClick={() => abrirModal('fluxo')}>
            <Card.Body className="text-center">
              <Card.Title>🔁 Fluxograma de Ação</Card.Title>
              <Card.Text>Procedimento de resposta às falhas.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modais */}

      {/* Modal Visão Geral */}
      <Modal show={modalAberto === 'visao'} onHide={fecharModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>📄 Visão Geral</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Garantir o funcionamento ideal dos equipamentos de videoconferência Poly. <br />
          Monitorar e detectar falhas rapidamente para ação corretiva imediata. <br />
          Manter a rede de videoconferência estável e pronta para uso a qualquer momento.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Ferramentas */}
      <Modal show={modalAberto === 'ferramentas'} onHide={fecharModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>🛠️ Ferramentas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          🔹 <strong>Broadcom:</strong> Monitoramento do status dos equipamentos (online/offline).<br />
          🔹 <strong>Zabbix:</strong> Monitoramento de perda de pacotes e performance da rede.<br />
          🔹 <strong>Grafana:</strong> Visualização gráfica da latência, perda de pacotes e estabilidade da rede.<br />
          🔹 <strong>Poly Lens:</strong> Gerenciamento remoto dos equipamentos (logs, status, resets).
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Checklist */}
      <Modal show={modalAberto === 'checklist'} onHide={fecharModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>📅 Checklist Diário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          📅 <strong>Horários fixos de checagem:</strong><br />
          08:00 - Verificar Broadcom (status dos equipamentos).<br />
          08:10 - Analisar Zabbix (alertas críticos).<br />
          08:20 - Avaliar Grafana (gráficos de perda de pacotes e latência).<br />
          08:30 - Verificar Poly Lens (status de equipamentos, logs, pareamento).<br />
          11:00 e 14:00 - Nova varredura para identificar qualquer nova falha.<br />
          17:00 - Encerramento do dia: revisar status final e registrar ações realizadas.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Modelos de Chamados */}
      <Modal show={modalAberto === 'modelos'} onHide={fecharModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>📑 Modelos de Chamados</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          📋 <strong>Modelo de abertura de chamado:</strong><br />
          - Local e Sala (ex: SP-JRM-6AND-SL01)<br />
          - Nome do equipamento com problema<br />
          - Tipo de falha identificada<br />
          - Evidências (prints de Broadcom/Zabbix/Grafana/Poly Lens)<br />
          - Ações tentadas antes da abertura (ex: reset remoto, troca de porta de rede)<br /><br />
          ⚠️ Lembre-se de preencher todos os campos para agilidade no atendimento!
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Fluxograma */}
      <Modal show={modalAberto === 'fluxo'} onHide={fecharModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔁 Fluxograma de Ação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          📈 <strong>Fluxograma de resposta a falhas:</strong><br />
          1. Receber alerta (Broadcom, Zabbix, Grafana, Poly Lens).<br />
          2. Validar em outras ferramentas se é uma falha real.<br />
          3. Diagnosticar a possível causa (equipamento, rede, pareamento).<br />
          4. Coletar logs e prints de evidência.<br />
          5. Tentar resolução remota (reset, reconfiguração).<br />
          6. Se não resolver → Acionar equipe de campo ou abrir chamado.<br />
          7. Acompanhar a resolução até a normalização do equipamento.<br /><br />
          🚨 Apenas registrar falhas detectadas ou chamadas individuais com problema!<br />
          Chamadas normais não precisam de registro manual.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>Fechar</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}

export default TreinamentoVC;
