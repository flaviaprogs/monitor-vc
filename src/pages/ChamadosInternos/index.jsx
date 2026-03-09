"use client"

import { useRef, useEffect, useState } from "react"
import { Button, Alert } from "react-bootstrap"
import { PlusCircle, Upload, FileText } from "lucide-react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

import {
  TabelaChamados,
  FiltrosChamados,
  ResumoChamados,
  ModalChamado,
} from "./components"

import { useChamados } from "./hooks/useChamados"
import { useFiltrosChamados } from "./hooks/useFiltrosChamados"

import "./ChamadosInternos.css"

export default function ChamadosInternos() {
  const fileRef = useRef(null)

  const {
    chamados,
    showModal,
    editChamado,
    novoChamado,
    setNovoChamado,
    abrirModal,
    fecharModal,
    handleChange,
    salvarChamado,
    excluirChamado,
    formValido,
    importarCSV,
  } = useChamados()

  const filtros = useFiltrosChamados(chamados)

  /* ===============================
     SALAS COM OBS ATIVA
  =============================== */
  const [salasObsAtivas, setSalasObsAtivas] = useState([])

  useEffect(() => {
    async function carregarSalasObs() {
      try {
        const response = await fetch("http://10.22.142.57:4000/salas-obs")

        if (!response.ok) throw new Error("Erro ao buscar salas-obs")

        const data = await response.json()

        const ativas = data.filter(
          (s) => String(s.status).toUpperCase() === "ATIVA"
        )

        setSalasObsAtivas(ativas)
      } catch (error) {
        console.error("Erro ao carregar salas obs:", error)
      }
    }

    carregarSalasObs()

    const eventSource = new EventSource("http://10.22.142.57:4000/events")

    eventSource.addEventListener("salas-update", carregarSalasObs)

    eventSource.onerror = (err) => {
      console.error("Erro SSE:", err)
    }

    return () => eventSource.close()
  }, [])

  /* ===============================
     NOVO CHAMADO
  =============================== */
  function handleNovoChamado() {
    abrirModal(null)
  }

  /* ===============================
     EXPORTAR CSV
  =============================== */
  function handleExportarCSV() {
    const dados = filtros.chamadosFiltrados

    if (!dados?.length) {
      alert("Nenhum chamado para exportar")
      return
    }

    const headers = Object.keys(dados[0])

    const linhas = dados.map((item) =>
      headers
        .map((header) => {
          const valor = item[header] ?? ""
          return `"${String(valor).replace(/"/g, '""')}"`
        })
        .join(",")
    )

    const BOM = "\uFEFF"

    const csvContent =
      BOM + [headers.join(","), ...linhas].join("\r\n")

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `chamados_${new Date().toISOString().slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  /* ===============================
     EXPORTAR XLS (RELATÓRIO)
  =============================== */
 function handleExportarXLS() {
  const dados = filtros.chamadosFiltrados

  if (!dados?.length) {
    alert("Nenhum chamado para exportar")
    return
  }

  // ============================
  // MÉTRICAS PRINCIPAIS
  // ============================

  const totalChamados = dados.length
  const chamadosAbertos = dados.filter(d => d.status === "ABERTO").length
  const chamadosEncerrados = dados.filter(d => d.status === "ENCERRADO").length
  const salasEmChamada = dados.filter(d => d.emChamada === 1).length
  const salasPrioritarias = dados.filter(d => d.prioridade === 1).length

  // ============================
  // FUNÇÕES DE AGRUPAMENTO
  // ============================

  const agrupar = (campo) => {
    const mapa = {}
    dados.forEach(item => {
      const chave = item[campo] || "Não informado"
      mapa[chave] = (mapa[chave] || 0) + 1
    })

    return Object.entries(mapa).map(([nome, quantidade]) => ({
      [campo]: nome,
      quantidade
    }))
  }

  const agruparDuplo = (campo1, campo2) => {
    const mapa = {}
    dados.forEach(item => {
      const chave = `${item[campo1] || "NI"} - ${item[campo2] || "NI"}`
      mapa[chave] = (mapa[chave] || 0) + 1
    })

    return Object.entries(mapa).map(([nome, quantidade]) => ({
      combinacao: nome,
      quantidade
    }))
  }

  // ============================
  // AGRUPAMENTOS
  // ============================

  const porEquipe = agrupar("equipeAcionada")
  const porFalha = agrupar("tipoFalha")
  const porSolucao = agrupar("solucao")
  const equipeSolucao = agruparDuplo("equipeAcionada", "solucao")

  // ============================
  // RESUMO EXECUTIVO
  // ============================

  const resumo = [
    { Indicador: "Total de Chamados", Valor: totalChamados },
    { Indicador: "Chamados Abertos", Valor: chamadosAbertos },
    { Indicador: "Chamados Encerrados", Valor: chamadosEncerrados },
    { Indicador: "Salas em Chamada", Valor: salasEmChamada },
    { Indicador: "Salas Prioritárias", Valor: salasPrioritarias }
  ]

  // ============================
  // GERAR WORKBOOK
  // ============================

  const wb = XLSX.utils.book_new()

  const wsResumo = XLSX.utils.json_to_sheet(resumo)
  const wsEquipe = XLSX.utils.json_to_sheet(porEquipe)
  const wsFalha = XLSX.utils.json_to_sheet(porFalha)
  const wsSolucao = XLSX.utils.json_to_sheet(porSolucao)
  const wsEquipeSolucao = XLSX.utils.json_to_sheet(equipeSolucao)
  const wsBase = XLSX.utils.json_to_sheet(dados)

  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Executivo")
  XLSX.utils.book_append_sheet(wb, wsEquipe, "Por Equipe")
  XLSX.utils.book_append_sheet(wb, wsFalha, "Por Falha")
  XLSX.utils.book_append_sheet(wb, wsSolucao, "Por Solução")
  XLSX.utils.book_append_sheet(wb, wsEquipeSolucao, "Equipe x Solução")
  XLSX.utils.book_append_sheet(wb, wsBase, "Base Completa")

  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array"
  })

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  })

  saveAs(
    blob,
    `relatorio_gerencial_${new Date().toISOString().slice(0, 10)}.xlsx`
  )
}

  /* ===============================
     IMPORTAR CSV
  =============================== */
  function handleImportarCSV(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (evt) => {
      const text = evt.target.result
      const linhas = text.split("\n").filter(Boolean)

      if (linhas.length < 2) {
        alert("CSV inválido")
        return
      }

      const headers = linhas[0]
        .split(",")
        .map((h) => h.replace(/"/g, "").trim())

      const registros = linhas.slice(1).map((linha) => {
        const valores = linha.split(",").map((v) =>
          v.replace(/"/g, "").trim()
        )

        const obj = {}
        headers.forEach((h, i) => {
          obj[h] = valores[i] || ""
        })

        return {
          ...obj,
          id: crypto.randomUUID(),
          origem: "importado",
        }
      })

      importarCSV(registros)
      alert("CSV importado com sucesso")
      window.dispatchEvent(new Event("storage"))
    }

    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="container-fluid py-2">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4>Chamados Internos</h4>

        <div className="d-flex gap-2">
          <Button variant="success" onClick={handleNovoChamado}>
            <PlusCircle size={16} className="me-1" />
            Novo
          </Button>

          <Button variant="outline-primary" onClick={handleExportarCSV}>
            <FileText size={16} className="me-1" />
            Exportar CSV
          </Button>

          <Button variant="success" onClick={handleExportarXLS}>
            <FileText size={16} className="me-1" />
            Exportar XLS
          </Button>

          <Button
            variant="outline-secondary"
            onClick={() => fileRef.current.click()}
          >
            <Upload size={16} className="me-1" />
            Importar CSV
          </Button>

          <input
            type="file"
            accept=".csv"
            ref={fileRef}
            style={{ display: "none" }}
            onChange={handleImportarCSV}
          />
        </div>
      </div>

      {salasObsAtivas.length > 0 && (
        <Alert variant="warning" className="mb-3">
          <strong>⚠️ Salas com observação ativa:</strong>
          <ul className="mb-0 mt-2">
            {salasObsAtivas.map((sala) => (
              <li key={sala.id}>
                {sala.sala} — {sala.observacao}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <FiltrosChamados {...filtros} />
      <ResumoChamados chamadosFiltrados={filtros.chamadosFiltrados} />

      <TabelaChamados
        fonte={filtros.chamadosFiltrados}
        abrirModal={abrirModal}
        excluirChamado={excluirChamado}
      />

      <ModalChamado
        showModal={showModal}
        fecharModal={fecharModal}
        editChamado={editChamado}
        novoChamado={novoChamado}
        setNovoChamado={setNovoChamado}
        handleChange={handleChange}
        formValido={formValido}
        salvarChamado={salvarChamado}
      />
    </div>
  )
}