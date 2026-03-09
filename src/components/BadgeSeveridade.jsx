export default function BadgeSeveridade({ severidade }) {

  const cores = {
    ALTA: "#ff3b3b",
    MEDIA: "#ff9800",
    BAIXA: "#4caf50"
  };

  return (
    <span style={{
      background: cores[severidade],
      color: "#fff",
      padding: "4px 8px",
      borderRadius: 6,
      fontWeight: "bold",
      fontSize: 12
    }}>
      {severidade}
    </span>
  );
}