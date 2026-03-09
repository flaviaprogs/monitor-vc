import { useEffect, useState } from "react";
import { fetchEquipamentos } from "../services/equipamentos.service";

function groupBySala(devices) {
  const salas = {};

  devices.forEach((d) => {
    const sala = d.room || "SEM SALA";

    if (!salas[sala]) {
      salas[sala] = { sala, x50: null, tc8: null };
    }

    if (d.device_type?.toUpperCase().includes("X50")) {
      salas[sala].x50 = d;
    }

    if (d.device_type?.toUpperCase().includes("TC8")) {
      salas[sala].tc8 = d;
    }
  });

  return Object.values(salas);
}

export function useEquipamentosAPI() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const devices = await fetchEquipamentos();
        setSalas(groupBySala(devices));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { salas, loading, error };
}
