"use client"

// Componente de resumo

import { useMemo } from "react"
import { Row, Col } from "react-bootstrap"
import { hhmmToMinutes, ym } from "../utils/index.js"

export default function ResumoChamados({ chamadosFiltrados }) {
  const YM_NOW = ym(new Date().toISOString())
  const ymRef = (c) => ym(c?.criadoEm || c?.dataQueda)

  const vigentes = useMemo(() => chamadosFiltrados.filter((c) => ymRef(c) === YM_NOW), [chamadosFiltrados, YM_NOW])

  const resumo = useMemo(() => {
    const fonte = vigentes
    const abertos = fonte.filter((c) => !c.dataRestauracao).length
    const encerrados = fonte.filter((c) => !!c.dataRestauracao).length
    const priorit = fonte.filter((c) => c.prioridade).length

    let totalMin = 0
    fonte.forEach((c) => {
      const mm = hhmmToMinutes(c.tempoIndisponibilidade)
      if (mm != null) totalMin += mm
    })
    const th = Math.floor(totalMin / 60)
      .toString()
      .padStart(2, "0")
    const tm = (totalMin % 60).toString().padStart(2, "0")

    return { abertos, encerrados, priorit, indisponibilidade: `${th}:${tm}` }
  }, [vigentes])

  return (
    <Row className="g-2 mb-2">
      <Col sm={3}>
        <div className="card border-0 shadow-sm">
          <div className="card-body py-2 d-flex justify-content-between">
            <span>Abertos</span>
            <strong>{resumo.abertos}</strong>
          </div>
        </div>
      </Col>
      <Col sm={3}>
        <div className="card border-0 shadow-sm">
          <div className="card-body py-2 d-flex justify-content-between">
            <span>Encerrados</span>
            <strong>{resumo.encerrados}</strong>
          </div>
        </div>
      </Col>
      <Col sm={3}>
        <div className="card border-0 shadow-sm">
          <div className="card-body py-2 d-flex justify-content-between">
            <span>Prioritários</span>
            <strong>{resumo.priorit}</strong>
          </div>
        </div>
      </Col>
      <Col sm={3}>
        <div className="card border-0 shadow-sm">
          <div className="card-body py-2 d-flex justify-content-between">
            <span>Indisponibilidade</span>
            <strong>{resumo.indisponibilidade}</strong>
          </div>
        </div>
      </Col>
    </Row>
  )
}
