// src/components/FilterBar.jsx
import React from "react";
import { Row, Col, Form } from "react-bootstrap";

function FilterBar({
  equipes = [],
  equipeValue,
  onEquipeChange,
  status = [],
  statusValue,
  onStatusChange,
  meses = [],
  mesValue,
  onMesChange,
  rightSlot,   // ex.: botão "Exportar PDF"
}) {
  return (
    <Row className="g-3 mb-3">
      {equipes.length > 0 && (
        <Col md={4}>
          <Form.Select
            className="select-soft"
            value={equipeValue}
            onChange={(e) => onEquipeChange?.(e.target.value)}
          >
            {equipes.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </Form.Select>
        </Col>
      )}

      {status.length > 0 && (
        <Col md={4}>
          <Form.Select
            className="select-soft"
            value={statusValue}
            onChange={(e) => onStatusChange?.(e.target.value)}
          >
            {status.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </Form.Select>
        </Col>
      )}

      {meses.length > 0 && (
        <Col md={3}>
          <Form.Select
            className="select-soft"
            value={mesValue}
            onChange={(e) => onMesChange?.(e.target.value)}
          >
            <option value="">Todos os Meses</option>
            {meses.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Form.Select>
        </Col>
      )}

      {rightSlot && (
        <Col md={meses.length ? 1 : 4} className="d-grid">
          {rightSlot}
        </Col>
      )}
    </Row>
  );
}

export default React.memo(FilterBar);
