export function playRadarSound(file) {
  const hour = new Date().getHours()

  // 🌙 Mute após 20h
  if (hour >= 20) return

  const audio = new Audio(`/sounds/${file}`)
  audio.play().catch(() => {})
}
