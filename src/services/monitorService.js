const API = "http://localhost:4000";

export async function getAlarmesAtivos() {
  const res = await fetch(`${API}/alarmes/ativos`);
  return res.json();
}

export async function resolverAlarme(id) {
  await fetch(`${API}/alarmes/${id}/resolver`, {
    method: "PUT"
  });
}