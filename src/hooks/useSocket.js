import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const socketUrl = process.env.NODE_ENV === 'production' ? 'wss://staysync.org/socket.io' : 'ws://localhost:3004/socket.io';

const useSocket = () => {
  const { customer } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    console.log('[WebSocket] userToken:', token); // 디버깅
    if (!token || !customer?._id) {
      console.log('[WebSocket] Missing token or customerId');
      return;
    }

    const defaultHotelId = customer?.properties?.[0]?.id || '740630';

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
      console.error('WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('WebSocket error:', error.message);
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