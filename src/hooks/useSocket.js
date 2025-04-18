// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) return;

    const socketInstance = io(BASE_URL, {
      query: { customerToken: token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socketInstance.on('reconnect', (attempt) => {
      console.log(`WebSocket reconnected after ${attempt} attempts`);
      setIsConnected(true);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
  }, []);

  return { socket, isConnected };
};

export default useSocket;