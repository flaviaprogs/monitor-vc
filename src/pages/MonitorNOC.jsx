import { useEffect, useState, useCallback } from "react";
import { getAlarmesAtivos, resolverAlarme } from "../services/monitorService";
import { useMonitorSSE } from "../hooks/useMonitorSSE"; // ✅ named import correto
import BadgeSeveridade from "../components/BadgeSeveridade";

export default function MonitorNOC() {
  const [alarmes, setAlarmes] = useState([]);

  // 🔄 Carregar alarmes ao abrir
  const carregar = useCallback(async () => {
    try {
      const dados = await getAlarmesAtivos();
      setAlarmes(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error("Erro ao carregar alarmes:", err);
      setAlarmes([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // 🆕 Novo alarme via SSE
  const handleNovo = useCallback((data) => {
    setAlarmes((prev) => {
      const jaExiste = prev.find((a) => a.id === data.id);
      if (jaExiste) return prev;
      return [data, ...prev];
    });
  }, []);

  // ✅ Alarme resolvido via SSE
  const handleResolvido = useCallback((data) => {
    setAlarmes((prev) => prev.filter((a) => a.id !== data.id));
  }, []);

  // 🔔 Ativar SSE
  useMonitorSSE(handleNovo, handleResolvido);

  // 📊 Estatísticas
  const totalAlta = alarmes.filter((a) => a.severidade === "ALTA").length;
  const totalMedia = alarmes.filter((a) => a.severidade === "MEDIA").length;
  const totalBaixa = alarmes.filter((a) => a.severidade === "BAIXA").length;

  // 🛠 Resolver manual
  const handleResolver = async (id) => {
    try {
      await resolverAlarme(id);
      setAlarmes((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Erro ao resolver:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🖥️ NOC Monitor VC</h1>

      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <Card titulo="Alta" valor={totalAlta} cor="#ff3b3b" />
        <Card titulo="Média" valor={totalMedia} cor="#ff9800" />
        <Card titulo="Baixa" valor={totalBaixa} cor="#4caf50" />
      </div>

      {alarmes.length === 0 && (
        <p style={{ color: "#777" }}>Nenhum alarme ativo 🎉</p>
      )}

      {alarmes.map((a) => (
        <div
          key={a.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 8,
            borderRadius: 6,
          }}
        >
          <strong>{a.nomeSala}</strong> — {a.tipo}
          <br />
          <BadgeSeveridade severidade={a.severidade} />

          <button
            style={{ marginLeft: 10 }}
            onClick={() => handleResolver(a.id)}
          >
            Resolver
          </button>
        </div>
      ))}
    </div>
  );
}

function Card({ titulo, valor, cor }) {
  return (
    <div
      style={{
        background: cor,
        color: "#fff",
        padding: 20,
        borderRadius: 10,
        minWidth: 120,
        textAlign: "center",
      }}
    >
      <h3>{titulo}</h3>
      <h1>{valor}</h1>
    </div>
  );
}