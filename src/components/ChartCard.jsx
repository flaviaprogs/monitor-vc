// src/components/ChartCard.jsx
import React, { useMemo } from "react";

function ChartCard({ title, height = 350, loading, empty, children }) {
  const style = useMemo(() => ({ height }), [height]);

  return (
    <div className="card-soft p-3 h-100 d-flex flex-column">
      {title && <h6 className="mb-2">{title}</h6>}
      <div className="flex-grow-1" style={style}>
        {loading ? (
          <div className="skeleton w-100 h-100 rounded" />
        ) : empty ? (
          <div className="h-100 d-flex align-items-center justify-content-center text-muted">
            <div>
              <div className="text-center fw-semibold">Sem registros</div>
              <div className="text-center small">Ajuste os filtros para visualizar dados.</div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default React.memo(ChartCard);
