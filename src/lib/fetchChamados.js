const BACKEND_URL = "http://10.22.142.57:4000";

export async function fetchChamadosAny() {
  try {
    const response = await fetch('${BACKEND_URL}/chamados', {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Erro ao buscar chamados:", response.status);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Erro de rede:", err);
    return [];
  }
}