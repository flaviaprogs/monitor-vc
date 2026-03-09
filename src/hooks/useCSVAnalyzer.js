// 📁 src/hooks/useCSVAnalyzer.js
import { useMemo } from 'react';

function parseDiagnostico(text) {
  const lower = text?.toLowerCase() || '';
  if (lower.includes('microsoft teams')) return 'Ignorar';
  if (lower.includes('802.1x')) return '802.1x';
  if (lower.includes('data loss')) return 'Data Loss';
  if (lower.includes('could not connect')) return 'Conectividade';
  if (lower.includes('network changed')) return 'Rede';
  if (lower.includes('restored')) return 'Restaurado';
  return 'Outros';
}

function extrairMes(eventTime) {
  try {
    const data = new Date(eventTime);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return 'Desconhecido';
  }
}

function extrairTimestamp(dateStr) {
  try {
    return new Date(dateStr).getTime();
  } catch {
    return null;
  }
}

export default function useCSVAnalyzer(data) {
  return useMemo(() => {
    const mapa = {};

    // Ordenar os dados por Event Time para facilitar o cálculo de indisponibilidade
    const sorted = [...data].sort((a, b) => new Date(a['Event Time']) - new Date(b['Event Time']));

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const salaEquip = item['Network Path Name'] || '';
      const sala = salaEquip.split('-').slice(0, -1).join('-') || 'Desconhecido';
      const equipamento = salaEquip.split('-').slice(-1)[0] || 'N/A';
      const mes = extrairMes(item['Event Time']);
      const diagnostico = parseDiagnostico(item['Description'] || '');

      if (diagnostico === 'Ignorar') continue; // Ignora Microsoft Teams

      const chave = `${sala} | ${equipamento}`;
      if (!mapa[chave]) {
        mapa[chave] = {
          sala,
          equipamento,
          totalQuedas: 0,
          tempoTotal: 0,
          mes,
          equipe: 'Indefinido',
          diagnostico,
          critica: ['SP-JRM-10AND-PRESI', 'JB-LQ303-TE-MULTIUSO'].includes(sala),
          gravidade: 'Leve',
          ultimoDown: null
        };
      }

      // Verifica se é uma queda ou restauração
      const descr = (item['Description'] || '').toLowerCase();
      const timestamp = extrairTimestamp(item['Event Time']);
      if (descr.includes('has been lost')) {
        mapa[chave].totalQuedas++;
        mapa[chave].ultimoDown = timestamp;
      } else if (descr.includes('has been restored') && mapa[chave].ultimoDown) {
        const diffMin = Math.round((timestamp - mapa[chave].ultimoDown) / 60000);
        if (diffMin > 0 && diffMin < 1440) { // evitar valores absurdos
          mapa[chave].tempoTotal += diffMin;
        }
        mapa[chave].ultimoDown = null;
      }
    }

    return Object.values(mapa).map(item => {
      item.gravidade = item.totalQuedas > 10 ? 'Crítica' : item.totalQuedas > 5 ? 'Moderada' : 'Leve';

      // Sugestão de equipe com base em padrões analíticos
      if (item.diagnostico === 'Conectividade') {
        item.equipe = item.totalQuedas <= 3 && item.tempoTotal > 30 ? 'Field Telecom' : 'NetOps';
        item.justificativa = item.totalQuedas <= 3 && item.tempoTotal > 30
          ? 'Falhas espaçadas indicam possível instabilidade física no cabeamento ou switch, acionar Field Telecom.'
          : 'Falhas recorrentes e intermitentes indicam possível problema de autenticação ou configuração, acionar NetOps.';
      } else if (item.diagnostico === '802.1x') {
        item.equipe = 'NetOps';
        item.justificativa = 'Autenticação 802.1x falhou em múltiplas tentativas, verificar políticas de rede e certificados.';
      } else if (item.diagnostico === 'Data Loss') {
        item.equipe = 'Videoconferência';
        item.justificativa = 'Perda de pacotes detectada, possível impacto em áudio/vídeo, acionar equipe de videoconferência.';
      } else if (item.diagnostico === 'Rede') {
        item.equipe = 'Telecom';
        item.justificativa = 'Mudanças na rede indicam alteração de rota ou backbone, acionar equipe de telecom.';
      } else {
        item.equipe = 'Indefinido';
        item.justificativa = 'Diagnóstico não identificado, necessário análise manual.';
      }

      return item;
    });
  }, [data]);
}
