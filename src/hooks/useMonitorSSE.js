import { useEffect } from "react";

export function useMonitorSSE(onNovoAlarme, onResolvido) {
  useEffect(() => {
    const evtSource = new EventSource("http://localhost:4000/events");

    evtSource.addEventListener("novo-alarme", (event) => {
      const data = JSON.parse(event.data);
      onNovoAlarme(data);
    });

    evtSource.addEventListener("alarme-resolvido", (event) => {
      const data = JSON.parse(event.data);
      onResolvido(data);
    });

    return () => evtSource.close();
  }, [onNovoAlarme, onResolvido]);
}