// src/lib/chartOptions.js
export const chartBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { color: "#334155", font: { weight: 600 } } },
    tooltip: { backgroundColor: "rgba(15,27,45,.9)", cornerRadius: 6, padding: 10 },
  },
  scales: {
    x: { grid: { color: "rgba(148,163,184,.15)" }, ticks: { color: "#475569", autoSkip: true, maxRotation: 0 } },
    y: { beginAtZero: true, grid: { color: "rgba(148,163,184,.15)" }, ticks: { color: "#475569", precision: 0, stepSize: 1 } },
  },
};
