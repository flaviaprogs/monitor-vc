// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(e, info){ console.error("[ErrorBoundary]", e, info); }

  render(){
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-3">
          Ocorreu um erro ao renderizar este bloco. Recarregue a página ou ajuste os filtros.
        </div>
      );
    }
    return this.props.children;
  }
}
