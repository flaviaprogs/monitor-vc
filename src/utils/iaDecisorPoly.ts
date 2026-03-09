type EntradaIA = {
  connected: boolean;
  callStatus: string;
  perif: string | null;
  sala: string;
  historicoOcorrencias: number;
};

type SaidaIA = {
  decisao: "CRÍTICO" | "DESSYNC TC8" | "EM CALL" | "FALSO";
  acao: string;
  confianca: number; // 0 a 1
};

export function decidirAlarme(dados: EntradaIA): SaidaIA {
  const { connected, callStatus, perif, historicoOcorrencias } = dados;

  /* 🔴 EQUIPAMENTO OFFLINE */
  if (!connected) {
    return {
      decisao: "CRÍTICO",
      acao: "Equipamento offline. Acionar campo imediatamente.",
      confianca: 0.95
    };
  }

  /* 🟡 SALA EM USO */
  if (callStatus === "IN_CALL") {
    return {
      decisao: "EM CALL",
      acao: "Sala em chamada ativa. Não intervir.",
      confianca: 0.9
    };
  }

  /* 🟠 TC8 DESSYNC */
  if (perif && perif.toUpperCase().includes("TC8")) {
    return {
      decisao: "DESSYNC TC8",
      acao: "Reiniciar controlador TC8.",
      confianca: 0.85
    };
  }

  /* 🟢 PERIFÉRICO EVENTUAL (CÂMERA USB / EVENTO) */
  if (
    perif &&
    (
      perif.includes("NEOiD") ||
      perif.includes("EagleEye") ||
      perif.includes("USB")
    )
  ) {
    return {
      decisao: "FALSO",
      acao: "Periférico eventual. Provável uso apenas em eventos.",
      confianca: 0.8
    };
  }

  /* ⚪ PADRÃO */
  return {
    decisao: "FALSO",
    acao: "Sem impacto operacional identificado.",
    confianca: Math.max(0.6, 0.7 - historicoOcorrencias * 0.05)
  };
}
