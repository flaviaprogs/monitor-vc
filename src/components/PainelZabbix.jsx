// 📁 src/components/PainelZabbixPro.jsx
import React, { useEffect, useState } from 'react';
import { loginZabbix, buscarProblemas } from '../services/zabbixService';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function PainelZabbixPro() {
  const [problemas, setProblemas] = useState([]);
  const [token, setToken] = useState(null);
  const [hostSelecionado, setHostSelecionado] = useState('');
  const [carregando, setCarregando] = useState(false);

  const severidades = {
    2: { nome: 'Warning', cor: '#E5AC0E' },
    3: { nome: 'Average', cor: '#C15C17' },
    4: { nome: 'High', cor: '#BF1B00' },
    5: { nome: 'Disaster', cor: '#890F02' }
  };

  // Agrupar problemas por severidade
  const contagemPorSeveridade = () => {
    const contagem = {};
    Object.keys(severidades).forEach((key) => (contagem[key] = 0));
    problemas.forEach(p => {
      if (contagem[p.severity] !== undefined) contagem[p.severity]++;
    });
    return contagem;
  };

  const carregarProblemas = async () => {
    setCarregando(true);
    try {
      const auth = await loginZabbix();
      setToken(auth);
      const dados = await buscarProblemas(auth);
      setProblemas(dados);
    } catch (e) {
      console.error('Erro ao conectar com o Zabbix:', e);
    } finally {
      setCarregando(false);
    }
  };

  // useEffect(() => { carregarProblemas(); }, []); // Descomente quando ativar

  const hostsUnicos = [...new Set(problemas.map(p => p.hosts?.[0]?.host))];

  const problemasFiltrados = hostSelecionado
    ? problemas.filter(p => p.hosts?.[0]?.host === hostSelecionado)
    : problemas;

  // Gerar dados para gráfico de evolução
  const gerarEvolucao = () => {
    const dias = {};
    problemasFiltrados.forEach(p => {
      const dia = new Date(p.clock * 1000).toLocaleDateString();
      dias[dia] = (dias[dia] || 0) + 1;
    });

    return {
      labels: Object.keys(dias),
      datasets: [
        {
          label: 'Quantidade de Alarmes por Dia',
          data: Object.values(dias),
          borderColor: '#007bff',
          backgroundColor: '#cce5ff',
        }
      ]
    };
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔧 Módulo em Produção - Integração com Zabbix</h2>

      {carregando && <p>🔄 Carregando dados...</p>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {Object.entries(contagemPorSeveridade()).map(([key, value]) => (
          <div key={key} style={{
            backgroundColor: severidades[key].cor,
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            flex: 1,
            textAlign: 'center'
          }}>
            <h4>{severidades[key].nome}</h4>
            <p style={{ fontSize: '24px', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div>
        <label>Filtrar por host:</label>
        <select
          onChange={(e) => setHostSelecionado(e.target.value)}
          value={hostSelecionado}
        >
          <option value="">Todos</option>
          {hostsUnicos.map((h, i) => (
            <option key={i} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '30px' }}>
        {problemasFiltrados.map((p) => (
          <div key={p.eventid} style={{
            border: '1px solid #ccc',
            padding: '10px',
            marginBottom: '10px',
            borderLeft: `8px solid ${severidades[p.severity]?.cor || '#ccc'}`
          }}>
            <strong>{p.name}</strong><br />
            Sala: {p.hosts?.[0]?.host || 'Desconhecido'}<br />
            Início: {new Date(p.clock * 1000).toLocaleString()}<br />
            Severidade: {severidades[p.severity]?.nome || 'Desconhecida'}<br />
            <button
              style={{ marginTop: '10px' }}
              onClick={() => alert(`Abrir chamado para ${p.hosts?.[0]?.host}`)}
            >
              📩 Abrir Chamado
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>📊 Evolução dos Alarmes</h3>
        {problemasFiltrados.length > 0 ? (
          <Line data={gerarEvolucao()} />
        ) : (
          <p>Sem dados para gerar gráfico.</p>
        )}
      </div>
    </div>
  );
}

export default PainelZabbixPro;
