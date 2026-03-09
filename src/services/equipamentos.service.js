export async function fetchEquipamentos() {
  const res = await fetch("/api/equipamentos");

  if (!res.ok) {
    throw new Error("Erro ao buscar equipamentos");
  }

  return res.json();
}
