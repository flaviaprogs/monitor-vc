import { createContext, useContext, useState, useEffect } from "react";
import { SALAS_PERMITIDAS } from "./salasPermitidas";

// ======================
// Utils
// ======================
function normalizeSala(sala = "") {
  return sala.toUpperCase().trim().replace(/\s+/g, " ");
}

function isSalaPermitida(sala) {
  return SALAS_PERMITIDAS.includes(normalizeSala(sala));
}

function getDateTimeISO(date, time) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`).toISOString();
}

// ======================
// Context
// ======================
const RadarContext = createContext(null);

export function RadarProvider({ children }) {
  const [radarItems, setRadarItems] = useState([]);

  // ======================
  // Add
  // ======================
  function addRadarItem(data) {
    if (!isSalaPermitida(data.sala)) {
      console.warn("Sala descartada:", data.sala);
      return;
    }

    const startAt = getDateTimeISO(data.date, data.startTime);
    const endAt = getDateTimeISO(data.date, data.endTime);

    const newItem = {
      id: crypto.randomUUID(),
      titulo: data.titulo,
      sala: normalizeSala(data.sala),
      tipo: data.tipo,
      observacao: data.observacao || "",
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      startAt,
      endAt,
      status: "pendente",
      createdAt: new Date().toISOString(),
    };

    setRadarItems((prev) => [...prev, newItem]);
  }

  // ======================
  // Concluir
  // ======================
  function concluirRadarItem(id) {
    setRadarItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "concluido", concludedAt: new Date().toISOString() }
          : item
      )
    );
  }

  // ======================
  // Remover
  // ======================
  function removerRadarItem(id) {
    setRadarItems((prev) => prev.filter((item) => item.id !== id));
  }

  // ======================
  // Auto-archive concluídos
  // ======================
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarItems((prev) =>
        prev.filter((item) => item.status !== "concluido")
      );
    }, 60 * 1000); // a cada 1 min

    return () => clearInterval(interval);
  }, []);

  // ======================
  // Ordenação automática
  // ======================
  const orderedRadarItems = [...radarItems].sort((a, b) => {
    if (!a.startAt || !b.startAt) return 0;
    return new Date(a.startAt) - new Date(b.startAt);
  });

  return (
    <RadarContext.Provider
      value={{
        radarItems: orderedRadarItems,
        addRadarItem,
        concluirRadarItem,
        removerRadarItem,
      }}
    >
      {children}
    </RadarContext.Provider>
  );
}

// ======================
// Hook
// ======================
export function useRadar() {
  const context = useContext(RadarContext);

  if (!context) {
    throw new Error("useRadar deve ser usado dentro de RadarProvider");
  }

  return context;
}
