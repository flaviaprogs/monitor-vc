import React from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function Detalhes() {
  const { local } = useParams();

  return (
    <div className="container my-5">
      <h2 className="text-primary mb-4">Detalhes de Alarmes - {local}</h2>
      <p className="text-muted">Aqui você poderá exibir a listagem dos eventos do local selecionado.</p>
    </div>
  );
}

export default Detalhes;
