// 📁 src/components/BotaoAcoesChamado.jsx
import React from 'react';
import { Button } from 'react-bootstrap';
import { MessageCircle } from 'lucide-react';

function BotaoAcoesChamado({ chamado, telefone }) {
  if (!chamado) return null;

  const texto = `
*Chamado:* ${chamado.numeroChamado}
*Local:* ${chamado.local}
*Sala:* ${chamado.sala}
*Equipamento:* ${chamado.equipamento}
*Falha:* ${chamado.tipoFalha}
*Status:* ${chamado.status}
*Queda:* ${chamado.dataQueda}
*Restauração:* ${chamado.dataRestauracao}
*Equipe:* ${chamado.equipeAcionada}
*Obs:* ${chamado.observacoes}
`.trim();

  const enviarWhatsApp = () => {
    const msg = encodeURIComponent(texto);
    const numero = telefone || '21983146704';
    window.open(`https://wa.me/55${numero}?text=${msg}`, '_blank');
  };

  return (
    <Button variant="outline-success" size="sm" onClick={enviarWhatsApp} title="Enviar para WhatsApp">
      <MessageCircle size={16} />
    </Button>
  );
}

export default BotaoAcoesChamado;
