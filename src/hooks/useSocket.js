// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';

export default function useSocket() {
  const { customer } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token || !customer?._id) return;

    const hotelId = customer.reservations?.[0]?.hotelId || '740630';

    // 1) 호스트에는 프로토콜+도메인만 넣고
    // 2) path 옵션으로 /socket.io 만 지정
    const socketInstance = io(BASE_URL, {
      path: '/socket.io',
      transports: ['websocket'],       // websocket 전용
      withCredentials: true,
      auth: {                          // v4부터 권장되는 방식
        customerToken: token,
        type: 'customer',
        hotelId,
        customerId: customer._id,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      secure: BASE_URL.startsWith('https'),
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] connected, id=', socketInstance.id);
      setIsConnected(true);
    });
    socketInstance.on('connect_error', (err) => {
      console.error('[Socket] connection error:', err.message);
      setIsConnected(false);
    });
    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);
      setIsConnected(false);
    });

    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, [customer]);

  return { socket, isConnected };
}
