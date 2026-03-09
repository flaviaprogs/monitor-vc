import { useState, useMemo } from "react";
import { useRadar } from "../radar/RadarContext";
import { Button, Badge, Modal, Form } from "react-bootstrap";

export default function RadarOperacional() {
  const {
    radarItems,
    addRadarItem,
    concluirRadarItem,
    removerRadarItem,
  } = useRadar();

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    sala: "",
    tipo: "Reunião",
    data: "",
    startTime: "",
    endTime: "",
    observacao: "",
  });

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.titulo.trim() || !form.data) return;

    // validação simples de horário
    if (
      form.startTime &&
      form.endTime &&
      form.startTime > form.endTime
    ) {
      alert("Horário de fim não pode ser antes do início.");
      return;
    }

    addRadarItem(form);

    setForm({
      titulo: "",
      sala: "",
      tipo: "Reunião",
      data: "",
      startTime: "",
      endTime: "",
      observacao: "",
    });

    setShowModal(false);
  }

  // ✅ ORDENAÇÃO POR DATA + HORA
  const itensOrdenados = useMemo(() => {
    return [...radarItems].sort((a, b) => {
      const dateA = new Date(
        `${a.data}T${a.startTime || "00:00"}`
      );
      const dateB = new Date(
        `${b.data}T${b.startTime || "00:00"}`
      );
      return dateA - dateB;
    });
  }, [radarItems]);

  return (
    <div>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Radar Operacional</h3>
        <Button onClick={() => setShowModal(true)}>
          + Adicionar item
        </Button>
      </div>

      {/* LISTA */}
      {itensOrdenados.length === 0 && (
        <p className="text-muted">
          Nenhum item no radar no momento.
        </p>
      )}

      {itensOrdenados.map((item) => (
        <div
          key={item.id}
          className="d-flex justify-content-between align-items-start mb-2 p-3 border rounded bg-white"
        >
          <div>
            <strong>{item.titulo}</strong>

            <div className="text-muted small">
              {item.sala && <>Sala: {item.sala} • </>}
              Tipo: {item.tipo}
            </div>

            {item.data && (
              <div className="text-muted small">
                📅{" "}
                {new Date(item.data).toLocaleDateString("pt-BR")}
              </div>
            )}

            {item.startTime && item.endTime && (
              <div className="text-muted small">
                ⏰ {item.startTime} → {item.endTime}
              </div>
            )}

            {item.observacao && (
              <div className="small mt-1">
                {item.observacao}
              </div>
            )}

            <Badge
              bg={item.status === "pendente" ? "warning" : "success"}
              className="mt-2"
            >
              {item.status === "pendente"
                ? "Pendente"
                : "Concluído"}
            </Badge>
          </div>

          <div className="d-flex gap-2">
            {item.status === "pendente" && (
              <Button
                size="sm"
                variant="success"
                onClick={() => concluirRadarItem(item.id)}
              >
                Concluir
              </Button>
            )}

            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => removerRadarItem(item.id)}
            >
              Remover
            </Button>
          </div>
        </div>
      ))}

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar item ao Radar</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Título</Form.Label>
              <Form.Control
                required
                value={form.titulo}
                onChange={(e) =>
                  setForm({ ...form, titulo: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Sala</Form.Label>
              <Form.Control
                value={form.sala}
                onChange={(e) =>
                  setForm({ ...form, sala: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Tipo</Form.Label>
              <Form.Select
                value={form.tipo}
                onChange={(e) =>
                  setForm({ ...form, tipo: e.target.value })
                }
              >
                <option>Reunião</option>
                <option>Manutenção</option>
                <option>Evento</option>
                <option>Outro</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Data</Form.Label>
              <Form.Control
                type="date"
                required
                value={form.data}
                onChange={(e) =>
                  setForm({ ...form, data: e.target.value })
                }
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label>Horário de início</Form.Label>
                  <Form.Control
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label>Horário de fim</Form.Label>
                  <Form.Control
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group>
              <Form.Label>Observação</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.observacao}
                onChange={(e) =>
                  setForm({ ...form, observacao: e.target.value })
                }
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
