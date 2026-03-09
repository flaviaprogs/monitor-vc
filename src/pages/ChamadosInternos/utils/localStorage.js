// Persistência de dados

export const STORAGE_KEY = "chamadosInternosComExp"
export const FILTERS_KEY = "chamadosInternosFiltros"
export const EXPIRACAO_MS = 30 * 24 * 60 * 60 * 1000
export const AVISO_UM_DIA_MS = EXPIRACAO_MS - 24 * 60 * 60 * 1000

export function carregarChamados() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
    return saved?.dados || []
  } catch {
    return []
  }
}

export function salvarChamados(chamados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), dados: chamados }))
}

export function checarExpiracao() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
    if (!saved) return { expirado: false, avisar: false }

    const diff = Date.now() - (saved.timestamp || 0)

    if (diff > EXPIRACAO_MS) {
      return { expirado: true, avisar: false }
    } else if (diff > AVISO_UM_DIA_MS) {
      return { expirado: false, avisar: true }
    }

    return { expirado: false, avisar: false }
  } catch {
    return { expirado: false, avisar: false }
  }
}

export function limparChamados() {
  localStorage.removeItem(STORAGE_KEY)
}

export function carregarFiltros() {
  try {
    return JSON.parse(localStorage.getItem(FILTERS_KEY) || "null") || {}
  } catch {
    return {}
  }
}

export function salvarFiltros(filtros) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filtros))
}
