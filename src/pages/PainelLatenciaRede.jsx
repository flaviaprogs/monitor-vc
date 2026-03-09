// 📁 src/pages/PainelLatenciaRede.jsx
import React, { useState, useMemo } from 'react'
import Papa from 'papaparse'
import { Line } from 'react-chartjs-2'
import { Card, CardBody } from 'react-bootstrap'
import { FaExclamationTriangle } from 'react-icons/fa'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js'
import './PainelLatenciaRede.css'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend)

export default function PainelLatenciaRede() {
  const [dados, setDados] = useState([
  { hora: "12:00:00", latencia: 95 },
  { hora: "12:01:00", latencia: 110 },
  { hora: "12:02:00", latencia: 80 }
])
  const [filtroMin, setFiltroMin] = useState(0)
  const [filtroTempo, setFiltroTempo] = useState(60)

  const handleCSVUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formatado = results.data.map((linha) => ({
          hora: linha.hora,
          latencia: Number(linha.latencia)
        }))
        setDados(formatado)
      }
    })
  }

  const dadosFiltrados = useMemo(() => {
    const agora = new Date()
    const limiteMinutos = filtroTempo
    return dados.filter((d) => {
      const partes = d.hora.split(':')
      const horario = new Date()
      horario.setHours(partes[0], partes[1], partes[2])
      const diffMin = (agora - horario) / (1000 * 60)
      return diffMin <= limiteMinutos && d.latencia >= filtroMin
    })
  }, [dados, filtroMin, filtroTempo])

  const media = useMemo(() => (
    dadosFiltrados.length ?
    (dadosFiltrados.reduce((soma, d) => soma + d.latencia, 0) / dadosFiltrados.length).toFixed(1) : 0
  ), [dadosFiltrados])

  const pico = useMemo(() => (
    dadosFiltrados.length ?
    Math.max(...dadosFiltrados.map(d => d.latencia)) : 0
  ), [dadosFiltrados])

  const alertas = useMemo(() => (
    dadosFiltrados.filter(d => d.latencia > 100).length
  ), [dadosFiltrados])

  const dataGrafico = {
    labels: dadosFiltrados.map(d => d.hora),
    datasets: [
      {
        label: 'Latência (ms)',
        data: dadosFiltrados.map(d => d.latencia),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.2)',
        pointBackgroundColor: dadosFiltrados.map(d => d.latencia > 100 ? 'red' : '#007bff'),
        pointBorderColor: dadosFiltrados.map(d => d.latencia > 100 ? 'red' : '#007bff'),
        tension: 0.3,
        fill: true
      },
      {
        label: 'Limite de Alerta (100ms)',
        data: new Array(dadosFiltrados.length).fill(100),
        borderColor: 'rgba(255,0,0,0.5)',
        borderDash: [5, 5],
        pointRadius: 0
      }
    ]
  }

  const optionsGrafico = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Latência (ms)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Hora'
        }
      }
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="titulo-pagina">Painel de Latência de Rede</h2>

      {/* Importação */}
      <Card className="card-custom mb-4">
        <CardBody>
          <label className="btn btn-success btn-custom">
            Importar CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} hidden />
          </label>
        </CardBody>
      </Card>

      {/* Indicadores */}
      <div className="row mb-3">
        <div className="col-md-4">
          <Card className="card-custom indicador-card text-center">
            <h6>Média de Latência</h6>
            <h4 className="text-primary fw-bold">{media} ms</h4>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="card-custom indicador-card text-center">
            <h6>Pico de Latência</h6>
            <h4 className="text-danger fw-bold">{pico} ms</h4>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="card-custom indicador-card text-center">
            <h6>Alertas (100ms)</h6>
            <h4 className="text-warning fw-bold">{alertas}</h4>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="card-custom mb-4 filtros-card">
        <div className="row p-3">
          <div className="col-md-6">
            <label className="form-label">Exibir últimas:</label>
            <select className="form-control" value={filtroTempo} onChange={e => setFiltroTempo(Number(e.target.value))}>
              <option value={10}>10 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Latência mínima:</label>
            <input type="number" className="form-control" value={filtroMin} onChange={e => setFiltroMin(Number(e.target.value))} />
          </div>
        </div>
      </Card>

      {/* Gráfico */}
      <Card className="card-custom mb-4 p-3 grafico-card">
        <Line data={dataGrafico} options={optionsGrafico} />
      </Card>

      {/* Tabela */}
      <Card className="card-custom tabela-card mb-5">
        <CardBody>
          <table className="table table-hover table-custom">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Latência (ms)</th>
                <th>Alerta</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((item, i) => (
                <tr key={i}>
                  <td>{item.hora}</td>
                  <td>{item.latencia}</td>
                  <td>{item.latencia > 100 && <FaExclamationTriangle color="red" title="Latência Alta" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}
