import { useEffect, useState } from 'react';
import { io } from 'socket.io-client'; // 최신 socket.io-client 사용

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';

const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) return;

    const socketInstance = io(BASE_URL, {
      query: { customerToken: token },
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socketInstance.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      console.log('WebSocket disconnected');
    };
  }, []);

  return socket;
};

export default useSocket;
