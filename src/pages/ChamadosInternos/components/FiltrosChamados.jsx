"use client"
import { Form, Button } from "react-bootstrap"
import { Search } from "lucide-react"
import { EQUIPES, PREDIOS_MACRO, PRIORITY_SET } from "../utils/index.js"

export default function FiltrosChamados({
  filtroTexto,
  setFiltroTexto,
  somenteEmChamada,
  setSomenteEmChamada,
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
}) {
  return (
    <div className="card mb-2">
      <div className="card-body py-2">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <Form.Label className="small">
              <Search size={14} className="me-1" />
              Buscar (sala, falha, equipe, nº chamado, observações)
            </Form.Label>
            <Form.Control
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Ex.: X50, STATUS DOWN, NETOPS…"
            />
          </div>
          <div className="col-md-2">
            <Form.Label className="small">Status</Form.Label>
            <Form.Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option>TODOS</option>
              <option>ABERTO</option>
              <option>ENCERRADO</option>
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Label className="small">Equipe</Form.Label>
            <Form.Select value={filtroEquipe} onChange={(e) => setFiltroEquipe(e.target.value)}>
              <option>TODAS</option>
              {EQUIPES.map((eq) => (
                <option key={eq}>{eq}</option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Form.Label className="small">Localidade (Prédio)</Form.Label>
            <Form.Select value={filtroPredio} onChange={(e) => setFiltroPredio(e.target.value)}>
              <option value="TODOS">TODOS</option>
              {PREDIOS_MACRO.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-1">
            <Form.Label className="small">De</Form.Label>
            <Form.Control type="datetime-local" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="col-md-2">
            <Form.Label className="small">Até</Form.Label>
            <Form.Control type="datetime-local" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>

          <div className="col-12 d-flex align-items-center gap-2 mt-1">
            <Form.Check
              type="switch"
              id="filtro-prioritarias"
              label={`Somente prioritárias (${PRIORITY_SET.size})`}
              checked={somentePriorit}
              onChange={(e) => setSomentePriorit(e.target.checked)}
            />
            <Form.Check
              type="switch"
              id="filtro-em-chamada"
              label="Somente em chamada"
              checked={somenteEmChamada}
              onChange={(e) => setSomenteEmChamada(e.target.checked)}
            />
            <Button variant="outline-secondary" size="sm" className="ms-auto" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
