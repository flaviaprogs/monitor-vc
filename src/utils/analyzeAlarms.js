import dayjs from "dayjs";

export function analisarAlarmes(dados) {
  const equipamentos = {};

  dados.forEach((item) => {
    const nome = item["Network Path Name"];
    const descricao = item["Description"]?.toLowerCase() || "";
    const hora = dayjs(item["Event Time"]);
    const local = nome?.split("-")[0] || "—";
    const evento = {
      ...item,
      hora,
      descricao,
      Local: local,
    };

    if (!equipamentos[nome]) equipamentos[nome] = [];
    equipamentos[nome].push(evento);
  });

  const relatorio = [];

  Object.entries(equipamentos).forEach(([nome, eventos]) => {
    eventos.sort((a, b) => a.hora - b.hora);

    let inicio = null;
    let fim = null;
    let ultimaRestauracao = null;
    let totalQuedas = 0;
    let intervalo = [];

    const resultados = [];

    for (let i = 0; i < eventos.length; i++) {
      const atual = eventos[i];
      const desc = atual.descricao;
      const local = atual.Local;

      if (desc.includes("lost")) {
        if (!inicio) inicio = atual.hora;
        fim = null;
        totalQuedas++;
        intervalo.push(atual);
      }

      if (desc.includes("restored")) {
        ultimaRestauracao = atual.hora;
        if (inicio) {
          fim = atual.hora;
          const duracao = fim.diff(inicio, "minute");

          const intervaloSegundos = intervalo.map((ev, idx, arr) => {
            if (idx === 0) return 0;
            return ev.hora.diff(arr[idx - 1].hora, "second");
          });

          const mediaSegundos =
            intervaloSegundos.reduce((a, b) => a + b, 0) /
            (intervaloSegundos.length || 1);

          let tipo = "";
          let equipe = "";
          let justificativa = "";
          let recomendacao = "";
          let prioridade = "🔴 Crítico";
          let linkChamado = "#";

          if (totalQuedas === 1 && duracao <= 5) {
            continue;
          }

          if (totalQuedas >= 5 && duracao <= 60 && mediaSegundos <= 120) {
            tipo = "Autenticação 802.1x";
            equipe = "NetOps";
            justificativa =
              "Múltiplas quedas rápidas e padrão repetitivo. Indica tentativa de reautenticação.";
            recomendacao =
              "Verificar logs 802.1x no switch, Radius e política NAC.";
            prioridade = duracao > 15 ? "🟠 Moderado" : "🟢 Baixo";
            linkChamado = `https://sistema.chamados.com/abrir?equipe=netops&sala=${encodeURIComponent(nome)}`;
          } else if (duracao > 5 && totalQuedas <= 3) {
            tipo = "Cabo ou switch";
            equipe = "Telecomunicações de Campo";
            justificativa =
              "Queda longa e sem padrão intermitente. Pode indicar falha física.";
            recomendacao =
              "Solicitar certificação do ponto e verificar conexões físicas.";
            prioridade = duracao > 60 ? "🔴 Crítico" : "🟠 Moderado";
            linkChamado = `https://sistema.chamados.com/abrir?equipe=telecom&sala=${encodeURIComponent(nome)}`;
          } else {
            tipo = "Comportamento irregular";
            equipe = "Análise técnica";
            justificativa =
              "O comportamento não segue padrão claro. Exige inspeção e análise avançada.";
            recomendacao =
              "Analisar logs completos, verificar equipamento e rede local.";
            prioridade = "🟠 Moderado";
            linkChamado = `https://sistema.chamados.com/abrir?equipe=tecnica&sala=${encodeURIComponent(nome)}`;
          }

          resultados.push({
            Local: local,
            Sala: nome,
            "Data de Início": inicio.format("DD/MM/YYYY"),
            "Hora de Início": inicio.format("HH:mm:ss"),
            "Data de Fim": fim.format("DD/MM/YYYY"),
            "Hora de Fim": fim.format("HH:mm:ss"),
            "Última Autenticação": ultimaRestauracao?.format("HH:mm:ss") || "—",
            "Indisponibilidade (min)": duracao,
            "Qtd. de Quedas no Intervalo": totalQuedas,
            Diagnóstico: tipo,
            "Justificativa do Diagnóstico": justificativa,
            "Próximos Passos": recomendacao,
            Equipe: equipe,
            Prioridade: prioridade,
            "Abrir Chamado": linkChamado,
          });

          inicio = null;
          fim = null;
          totalQuedas = 0;
          intervalo = [];
        }
      }
    }

    if (inicio && totalQuedas > 0) {
      resultados.push({
        Local: eventos[0]?.Local || "—",
        Sala: nome,
        "Data de Início": inicio.format("DD/MM/YYYY"),
        "Hora de Início": inicio.format("HH:mm:ss"),
        "Data de Fim": "—",
        "Hora de Fim": "—",
        "Última Autenticação": "—",
        "Indisponibilidade (min)": "Em aberto",
        "Qtd. de Quedas no Intervalo": totalQuedas,
        Diagnóstico: "Queda sem restauração",
        "Justificativa do Diagnóstico":
          "Evento de perda sem retorno registrado. Pode indicar equipamento fora do ar.",
        "Próximos Passos":
          "Verificar presencialmente se o codec está ligado e conectado.",
        Equipe: "Videoconferência",
        Prioridade: "🔴 Crítico",
        "Abrir Chamado": `https://sistema.chamados.com/abrir?equipe=videoconferencia&sala=${encodeURIComponent(nome)}`,
      });
    }

    relatorio.push(...resultados);
  });

  return relatorio.sort((a, b) => {
    const prioridadeScore = (p) => {
      if (p.includes("🔴")) return 3;
      if (p.includes("🟠")) return 2;
      if (p.includes("🟢")) return 1;
      return 0;
    };

    const aScore = prioridadeScore(a.Prioridade);
    const bScore = prioridadeScore(b.Prioridade);

    if (bScore !== aScore) return bScore - aScore;

    const aDur =
      a["Indisponibilidade (min)"] === "Em aberto"
        ? 9999
        : a["Indisponibilidade (min)"];
    const bDur =
      b["Indisponibilidade (min)"] === "Em aberto"
        ? 9999
        : b["Indisponibilidade (min)"];
    if (bDur !== aDur) return bDur - aDur;

    return (
      b["Qtd. de Quedas no Intervalo"] - a["Qtd. de Quedas no Intervalo"]
    );
  });
}
