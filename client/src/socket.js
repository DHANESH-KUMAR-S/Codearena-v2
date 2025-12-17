import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
}); 