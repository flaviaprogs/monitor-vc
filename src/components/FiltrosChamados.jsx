import { Form, Button } from "react-bootstrap";
import { Search } from "lucide-react";

export default function FiltrosChamados({
  filtros,
  equipes,
  predios,
}) {
  const {
    filtroTexto,
    setFiltroTexto,
    filtroStatus,
    setFiltroStatus,
    filtroEquipe,
    setFiltroEquipe,
    filtroPredio,
    setFiltroPredio,
    de,
    setDe,
    ate,
    setAte,
    somentePriorit,
    setSomentePriorit,
    limparFiltros,
  } = filtros;

  return (
    <div className="card mb-2">
      <div className="card-body py-2">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <Form.Label className="small">
              <Search size={14} className="me-1" />
              Buscar
            </Form.Label>
            <Form.Control
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option>TODOS</option>
              <option>ABERTO</option>
              <option>ENCERRADO</option>
            </Form.Select>
          </div>

          <div className="col-md-2">
            <Form.Label>Equipe</Form.Label>
            <Form.Select
              value={filtroEquipe}
              onChange={(e) => setFiltroEquipe(e.target.value)}
            >
              <option>TODAS</option>
              {equipes.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </Form.Select>
          </div>

          <div className="col-md-2">
            <Form.Label>Localidade</Form.Label>
            <Form.Select
              value={filtroPredio}
              onChange={(e) => setFiltroPredio(e.target.value)}
            >
              <option value="TODOS">TODOS</option>
              {predios.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Form.Select>
          </div>

          <div className="col-md-1">
            <Form.Label>De</Form.Label>
            <Form.Control
              type="datetime-local"
              value={de}
              onChange={(e) => setDe(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <Form.Label>Até</Form.Label>
            <Form.Control
              type="datetime-local"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
            />
          </div>

          <div className="col-12 d-flex gap-2 mt-2">
            <Form.Check
              type="switch"
              label="Somente prioritárias"
              checked={somentePriorit}
              onChange={(e) => setSomentePriorit(e.target.checked)}
            />

            <Button
              variant="outline-secondary"
              size="sm"
              className="ms-auto"
              onClick={limparFiltros}
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
