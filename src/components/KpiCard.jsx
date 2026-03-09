// src/components/KpiCard.jsx
import React from "react";

function KpiCard({ tone = "total", title, value }) {
  return (
    <div className={`kpi kpi--${tone}`} role="status" aria-label={title}>
      <div className="kpi-content">
        <span className="kpi-title">{title}</span>
        <span className="kpi-value">{value}</span>
      </div>
    </div>
  );
}

export default React.memo(KpiCard);
