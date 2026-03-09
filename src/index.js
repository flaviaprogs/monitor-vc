import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AlarmDataProvider } from './context/AlarmDataContext'; // 👈 novo
import "./styles/theme.css";
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AlarmDataProvider>
      <App />
    </AlarmDataProvider>
  </React.StrictMode>
);
