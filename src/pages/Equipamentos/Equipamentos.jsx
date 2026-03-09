import { useEffect, useState } from "react";

export default function Equipamentos() {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    fetch("${API}/api/equipamentos")
      .then(res => res.json())
      .then(data => setDados(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Equipamentos</h1>

      <ul>
        {dados.map(eq => (
          <li key={eq.id}>
            <strong>{eq.displayName}</strong> — {eq.hardwareModel} —{" "}
            {eq.connected ? "🟢 OK" : "🔴 DOWN"}
          </li>
        ))}
      </ul>
    </div>
  );
}
