// 📁 src/pages/InventarioPolyLens.jsx
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function InventarioPolyLens() {
  const [dados, setDados] = useState([]);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [filtroModelo, setFiltroModelo] = useState('Todos');
  const [filtroSite, setFiltroSite] = useState('Todos');

  const versoesMinimas = {
    'G7500': '4.4.3',
    'GC8': '1.4.3',
    'Studio E70': '1.11.3',
    'Studio P15': '2.1.2',
    'Studio X30': '4.4.3',
    'Studio X50': '4.4.3',
    'Studio X52': '4.4.3',
    'TC8': '4.4.3',
    'TC10': '4.4.3',
    'Trio C60': '7.2.3',
    'Lens Room': '1.10.191',
    'Lens Desktop': '1.10.191'
  };

  useEffect(() => {
    const salvo = localStorage.getItem('inventario');
    if (salvo) {
      try {
        const json = JSON.parse(salvo);
        if (Array.isArray(json)) setDados(json);
      } catch {}
    }
  }, []);

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const linhas = e.target.result.split(/\r?\n/).slice(3);
      if (linhas.length === 0) return;

      const headers = linhas[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const dados = linhas.slice(1).map(l => {
        const valores = l.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => obj[h] = valores[i] || '');
        return obj;
      }).filter(d => d['Provider'] !== 'Microsoft Teams');

      const classificados = dados.map(d => ({
        ...d,
        Classificacao: classificarDispositivo(d)
      }));

      setDados(classificados);
      setNomeArquivo(file.name);
      localStorage.setItem('inventario', JSON.stringify(classificados));
    };
    reader.readAsText(file);
  };

  const classificarDispositivo = (d) => {
    const modelo = d['Device model'];
    const versao = d['Software version'];
    const ultima = d['Date last seen'];

    if (!versao || !ultima) return 'Desatualizado 🚨';

    const min = versoesMinimas[modelo];
    if (!min) return 'Ignorado';

    return compararVersoes(versao, min) >= 0 ? 'Atualizado ✅' : 'Desatualizado 🚨';
  };

  const compararVersoes = (v1, v2) => {
    const a = v1.split('.').map(n => parseInt(n));
    const b = v2.split('.').map(n => parseInt(n));
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const diff = (a[i] || 0) - (b[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  };

  const resumo = dados.reduce((acc, d) => {
    acc[d.Classificacao] = (acc[d.Classificacao] || 0) + 1;
    return acc;
  }, {});

  const opcoes = ['Todos', ...Object.keys(resumo)];
  const modelosUnicos = ['Todos', ...Array.from(new Set(dados.map(d => d['Device model']).filter(Boolean)))];
  const sitesUnicos = ['Todos', ...Array.from(new Set(dados.map(d => d['Site name']).filter(Boolean)))];

  const filtrados = dados.filter(d => {
    const statusMatch = filtro === 'Todos' || d.Classificacao === filtro;
    const modeloMatch = filtroModelo === 'Todos' || d['Device model'] === filtroModelo;
    const siteMatch = filtroSite === 'Todos' || d['Site name'] === filtroSite;
    return statusMatch && modeloMatch && siteMatch;
  });

  return (
    <div className="container py-4">
      <h2 className="mb-4">📋 Inventário PolyLens</h2>

      <div className="mb-3">
        <label className="form-label fw-bold">Importar CSV PolyLens (corrigido)</label>
        <input className="form-control" type="file" accept=".csv" onChange={handleUpload} />
        {nomeArquivo && <p className="mt-2 text-success">Arquivo carregado: {nomeArquivo}</p>}
      </div>

      <div className="mb-3 d-flex flex-wrap gap-2">
        {opcoes.map((k) => (
          <button
            key={k}
            className={`btn btn-outline-info ${filtro === k ? 'active' : ''}`}
            onClick={() => setFiltro(k)}
          >
            {k}: {resumo[k] || 0}
          </button>
        ))}
      </div>

      <div className="mb-4 d-flex flex-wrap gap-3">
        <div>
          <label className="form-label">Filtrar por modelo:</label>
          <select className="form-select" value={filtroModelo} onChange={e => setFiltroModelo(e.target.value)}>
            {modelosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Filtrar por site:</label>
          <select className="form-select" value={filtroSite} onChange={e => setFiltroSite(e.target.value)}>
            {sitesUnicos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="row">
        {filtrados.map((d, i) => (
          <div key={i} className="col-md-4 mb-3">
            <div className="card h-100 border">
              <div className="card-body">
                <h5 className="card-title">{d['Device name']}</h5>
                <p><strong>Modelo:</strong> {d['Device model']}</p>
                <p><strong>Sala:</strong> {d['Room name']}</p>
                <p><strong>Site:</strong> {d['Site name']}</p>
                <p><strong>Versão:</strong> {d['Software version']}</p>
                <p><strong>Versão Mínima:</strong> {versoesMinimas[d['Device model']] || 'N/A'}</p>
                <p><strong>Provider:</strong> {d['Provider']}</p>
                <p><strong>Ultimo visto:</strong> {d['Date last seen']}</p>
                <span className="badge bg-warning text-dark">{d.Classificacao}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InventarioPolyLens;
