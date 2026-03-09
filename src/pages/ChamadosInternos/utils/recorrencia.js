// Lógica de recorrência e sala instável

import { salaBaseParaPrioridade } from "./salas.js"

export const JANELA_RECORRENCIA_DIAS = 14
export const LIMITE_RECORRENCIA = 3

export function ocorrenciasRecentes(chamados, nomeCompleto) {
  const salaBase = salaBaseParaPrioridade(nomeCompleto)

  const agora = new Date()
  const limite = new Date()
  limite.setDate(agora.getDate() - JANELA_RECORRENCIA_DIAS)

  const ocorrencias = chamados.filter((c) => {
    if (!c.nomeCompleto || !c.dataQueda) return false

    const dataQueda = new Date(c.dataQueda)
    if (isNaN(dataQueda)) return false

    const mesmoSalaBase = salaBaseParaPrioridade(c.nomeCompleto) === salaBase
    const dentroJanela = dataQueda >= limite

    return mesmoSalaBase && dentroJanela
  })

  console.log("[v0] Ocorrencias recentes para", nomeCompleto, ":", ocorrencias.length, "chamados")

  return ocorrencias
}

export function isFalhaRecorrenteCritica(chamados, nomeCompleto, tipoFalha, dataAtual) {
  const salaBase = salaBaseParaPrioridade(nomeCompleto)

  const agora = dataAtual ? new Date(dataAtual) : new Date()
  const limite = new Date(agora)
  limite.setDate(agora.getDate() - JANELA_RECORRENCIA_DIAS)

  console.log("=".repeat(80))
  console.log("[v0] 🔍 VERIFICANDO RECORRÊNCIA CRÍTICA")
  console.log("[v0] Sala completa:", nomeCompleto)
  console.log("[v0] Sala base (primeiros 4 segmentos):", salaBase)
  console.log("[v0] Tipo de falha:", tipoFalha)
  console.log("[v0] Data atual:", agora.toLocaleString("pt-BR"))
  console.log("[v0] Data limite (14 dias atrás):", limite.toLocaleString("pt-BR"))
  console.log("[v0] Total de chamados no sistema:", chamados.length)

  const ocorrenciasMesmaFalha = chamados.filter((c) => {
    if (!c.nomeCompleto || !c.dataQueda || !c.tipoFalha) {
      return false
    }

    const dataQueda = new Date(c.dataQueda)
    if (isNaN(dataQueda)) {
      console.log("[v0] ❌ Data inválida para chamado:", c.numeroChamado, c.dataQueda)
      return false
    }

    const cSalaBase = salaBaseParaPrioridade(c.nomeCompleto)
    const mesmoSalaBase = cSalaBase === salaBase
    const mesmaFalha = c.tipoFalha === tipoFalha
    const dentroJanela = dataQueda >= limite && dataQueda <= agora

    const inclui = mesmoSalaBase && mesmaFalha && dentroJanela

    if (mesmoSalaBase && mesmaFalha) {
      console.log("[v0] 📋 Candidato:", {
        numero: c.numeroChamado,
        salaBase: cSalaBase,
        falha: c.tipoFalha,
        dataQueda: dataQueda.toLocaleString("pt-BR"),
        dentroJanela,
        INCLUÍDO: inclui ? "✅ SIM" : "❌ NÃO",
      })
    }

    return inclui
  })

  const isCritica = ocorrenciasMesmaFalha.length >= LIMITE_RECORRENCIA

  console.log("[v0]")
  console.log("[v0] 📊 RESULTADO:")
  console.log("[v0] Total de ocorrências encontradas:", ocorrenciasMesmaFalha.length)
  console.log("[v0] Limite para ser crítica:", LIMITE_RECORRENCIA)
  console.log("[v0] É CRÍTICA?", isCritica ? "🚨 SIM - DEVE PISCAR!" : "❌ NÃO")

  if (isCritica) {
    console.log("[v0]")
    console.log("[v0] 🚨🚨🚨 FALHA RECORRENTE CRÍTICA DETECTADA! 🚨🚨🚨")
    console.log("[v0] Chamados que causaram o alerta:")
    ocorrenciasMesmaFalha.forEach((c, idx) => {
      console.log(`[v0]   ${idx + 1}. ${c.numeroChamado} - ${new Date(c.dataQueda).toLocaleString("pt-BR")}`)
    })
  }
  console.log("=".repeat(80))

  return isCritica
}

export function isSalaInstavel(chamados, nomeCompleto) {
  const ocorrencias = ocorrenciasRecentes(chamados, nomeCompleto)
  const isInstavel = ocorrencias.length >= LIMITE_RECORRENCIA

  if (isInstavel) {
    console.log("[v0] SALA INSTÁVEL:", nomeCompleto, ocorrencias.length, "ocorrências")
  }

  return isInstavel
}
