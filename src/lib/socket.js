// src/lib/socket.js
import { io } from 'socket.io-client';

// mesmo host: funciona em produção (porta 80) sem CORS.
// em dev, veja a seção "Dev (opcional)" no fim.
export const socket = io('/', {
  path: '/socket.io',
  transports: ['websocket']
});
