// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';
const socketUrl = `${BASE_URL.replace(/^http/, 'ws')}/socket.io/`; // wss://staysync.org/socket.io/ in production

const useSocket = () => {
  const { customer } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token || !customer?._id) return;

    const defaultHotelId = customer?.reservations?.[0]?.hotelId || '740630';

    const socketInstance = io(socketUrl, {
      query: {
        customerToken: token,
        type: 'customer',
        hotelId: defaultHotelId,
        customerId: customer._id,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      withCredentials: true,
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
  }, [customer]);

  return { socket, isConnected };
};

export default useSocket;