"use client"

// Hook para filtros e ordenação

import { useState, useEffect, useMemo } from "react"
import { carregarFiltros, salvarFiltros } from "../utils/localStorage.js"
import { getPredioMacro } from "../utils/salas.js"

export function useFiltrosChamados(chamados) {
  const filtrosSalvos = carregarFiltros()

  const [filtroTexto, setFiltroTexto] = useState(filtrosSalvos.texto || "")
  const [somenteEmChamada, setSomenteEmChamada] = useState(Boolean(filtrosSalvos.somenteEmChamada) || false)
  const [filtroStatus, setFiltroStatus] = useState(filtrosSalvos.status || "TODOS")
  const [filtroEquipe, setFiltroEquipe] = useState(filtrosSalvos.equipe || "TODAS")
  const [filtroPredio, setFiltroPredio] = useState(filtrosSalvos.predio || "TODOS")
  const [de, setDe] = useState(filtrosSalvos.de || "")
  const [ate, setAte] = useState(filtrosSalvos.ate || "")
  const [somentePriorit, setSomentePriorit] = useState(Boolean(filtrosSalvos.somentePriorit) || false)

  useEffect(() => {
    salvarFiltros({
      texto: filtroTexto,
      status: filtroStatus,
      equipe: filtroEquipe,
      predio: filtroPredio,
      de,
      ate,
      somentePriorit,
      somenteEmChamada,
    })
  }, [filtroTexto, filtroStatus, filtroEquipe, filtroPredio, de, ate, somentePriorit, somenteEmChamada])

  const chamadosFiltrados = useMemo(() => {
    const texto = (filtroTexto || "").toLowerCase()
    const dIni = de ? new Date(de) : null
    const dFim = ate ? new Date(ate) : null

    const passa = (c) => {
      const tMatch =
        (c.nomeCompleto || "").toLowerCase().includes(texto) ||
        (c.tipoFalha || "").toLowerCase().includes(texto) ||
        (c.equipeAcionada || "").toLowerCase().includes(texto) ||
        (c.numeroChamado || "").toLowerCase().includes(texto) ||
        (c.observacoes || "").toLowerCase().includes(texto)

      const sMatch = filtroStatus === "TODOS" || c.status === filtroStatus
      const eMatch = filtroEquipe === "TODAS" || c.equipeAcionada === filtroEquipe

      const cq = c.dataQueda ? new Date(c.dataQueda) : null
      const pMatch = (!dIni || (cq && cq >= dIni)) && (!dFim || (cq && cq <= dFim))

      const prMatch = !somentePriorit || c.prioridade

      const predioMacro = getPredioMacro(c)
      const predioMatch = filtroPredio === "TODOS" || predioMacro === filtroPredio

      const emChamadaMatch = !somenteEmChamada || c.emChamada === true

      return tMatch && sMatch && eMatch && pMatch && prMatch && predioMatch && emChamadaMatch
    }

    const ord = (a, b) => {
      // Abertos primeiro
      if (a.status !== b.status) {
        return a.status === "ABERTO" ? -1 : 1
      }
      // Depois por data de criação (mais recente primeiro)
      return (b.criadoEm || "").localeCompare(a.criadoEm || "")
    }

    return [...chamados].filter(passa).sort(ord)
  }, [chamados, filtroTexto, filtroStatus, filtroEquipe, filtroPredio, de, ate, somentePriorit, somenteEmChamada])

  const limparFiltros = () => {
    setFiltroTexto("")
    setFiltroStatus("TODOS")
    setFiltroEquipe("TODAS")
    setFiltroPredio("TODOS")
    setDe("")
    setAte("")
    setSomentePriorit(false)
    setSomenteEmChamada(false)
  }

  return {
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
    chamadosFiltrados,
    limparFiltros,
  }
}
