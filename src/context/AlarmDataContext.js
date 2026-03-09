import React, { createContext, useState, useContext } from 'react';

// 🔔 Exportação direta do contexto para uso com useContext()
export const AlarmDataContext = createContext();

export function AlarmDataProvider({ children }) {
  const [dados, setDados] = useState([]);

  return (
    <AlarmDataContext.Provider value={{ dados, setDados }}>
      {children}
    </AlarmDataContext.Provider>
  );
}

// 🔁 Hook opcional para quem quiser usar de forma mais elegante
export function useAlarmData() {
  return useContext(AlarmDataContext);
}
