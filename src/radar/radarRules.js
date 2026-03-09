import { playRadarSound } from "./soundPlayer"

export function evaluateRadarItems(items, now, updateItem) {
  items.forEach(item => {
    // 🎤 REUNIÕES
    if (item.tipo === "reuniao" && item.eventoInicio) {
      const inicio = new Date(item.eventoInicio)
      const fim = new Date(item.eventoFim)
      const diffMin = Math.floor((inicio - now) / 60000)

      // ⏰ 10 minutos antes (janela)
      if (diffMin <= 10 && diffMin > 5 && !item._alert10min) {
        playRadarSound("reuniao_10min.mp3")
        updateItem(item.id, { _alert10min: true })
      }

      // 🎤 Durante reunião (1h)
      if (now >= inicio && now <= fim) {
        const runningMin = Math.floor((now - inicio) / 60000)
        if (runningMin % 60 < 5 && !item._alertInProgress) {
          playRadarSound("reuniao_em_andamento.mp3")
          updateItem(item.id, { _alertInProgress: now.toISOString() })
        }
      }
    }

    // 🔧 Pendências podem entrar aqui depois
  })
}
