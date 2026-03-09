import dayjs from "dayjs";

export function analisarFalhasCurtas(dados) {
  const equipamentos = {};

  dados.forEach((item) => {
    const nome = item["Network Path Name"];
    const descricao = item["Description"]?.toLowerCase() || "";
    const hora = dayjs(item["Event Time"]);
    const localCompleto = nome.split("-")[0];
    const local = localCompleto.trim();
    const evento = { ...item, nome, descricao, hora, local };

    if (!equipamentos[nome]) equipamentos[nome] = [];
    equipamentos[nome].push(evento);
  });

  const resultados = [];

  Object.entries(equipamentos).forEach(([nome, eventos]) => {
    eventos.sort((a, b) => a.hora - b.hora);
    let inicio = null;
    let fim = null;

    for (let i = 0; i < eventos.length; i++) {
      const e = eventos[i];

      if (e.descricao.includes("lost")) {
        inicio = e.hora;
      }

      if (e.descricao.includes("restored") && inicio) {
        fim = e.hora;
        const duracao = fim.diff(inicio, "minute");

        const limite =
          ["DF", "SP", "RJ", "MG"].includes(e.local) ? 10 : 20;

        if (duracao < limite) {
          resultados.push({
            Local: e.local,
            Sala: nome,
            "Data de Início": inicio.format("DD/MM/YYYY"),
            "Hora de Início": inicio.format("HH:mm:ss"),
            "Data de Fim": fim.format("DD/MM/YYYY"),
            "Hora de Fim": fim.format("HH:mm:ss"),
            "Indisponibilidade (min)": duracao,
            Diagnóstico: "Intermitência",
            "Justificativa do Diagnóstico": `Queda curta detectada (${duracao} min). Pode indicar instabilidade na rede ou falha física esporádica.`,
            "Próximos Passos": "Verificar cabeamento ou fazer análise preventiva.",
            Equipe: "Telecomunicações de Campo",
            Prioridade: "🟠 Moderado",
            "Abrir Chamado": `https://sistema.chamados.com/abrir?equipe=telecom&sala=${encodeURIComponent(nome)}`
          });
        }

        inicio = null;
        fim = null;
      }
    }
  });

  return resultados;
}
