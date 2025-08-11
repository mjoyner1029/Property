// frontend/src/utils/socket.js

import { io } from 'socket.io-client';

const backendUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5050';

export const socket = io(backendUrl, {
  transports: ['websocket'],
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
