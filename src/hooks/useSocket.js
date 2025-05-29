// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';

export default function useSocket() {
  const { customer } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!customer?._id) return;

    const token = localStorage.getItem('customerToken');
    const hotelId = customer.reservations?.[0]?.hotelId;

    const sock = io(API_BASE, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
      auth: { token }, // JWT를 auth에 전달
      query: { customerId: customer._id, hotelId },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    sock.on('connect', () => console.log('WS connected:', sock.id));
    sock.on('disconnect', (reason) => console.log('WS disconnected:', reason));
    sock.on('connect_error', (err) => console.error('WS error:', err));

    setSocket(sock);
    return () => {
      sock.disconnect();
    };
  }, [customer]);

  return socket;
}
