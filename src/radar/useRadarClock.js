import { useEffect } from "react"
import { evaluateRadarItems } from "./radarRules"

export function useRadarClock(radarItems, updateItem) {
  useEffect(() => {
    const run = () => {
      const now = new Date()
      evaluateRadarItems(radarItems, now, updateItem)
    }

    run() // roda ao montar

    const interval = setInterval(run, 300000) // 5 minutos
    return () => clearInterval(interval)
  }, [radarItems, updateItem])
}
