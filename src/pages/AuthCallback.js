// src/pages/AuthCallback.js
import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  useToast,
  Text,
  Button,
  VStack,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004'; // https://staysync.org in production

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      query: {
        customerToken: localStorage.getItem('customerToken'),
      },
    });

    socket.on('connect', () => {
      console.log('[AuthCallback] Connected to WebSocket:', socket.id);
    });

    socket.on('couponIssued', ({ message, coupons }) => {
      toast({
        title: '새 쿠폰 발행',
        description: message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      console.log('[AuthCallback] New coupons received:', coupons);
    });

    socket.on('connect_error', (error) => {
      console.error('[AuthCallback] WebSocket connect_error:', error);
    });

    socket.on('error', (error) => {
      console.error('[AuthCallback] WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
      console.log('[AuthCallback] WebSocket disconnected');
    };
  }, [toast]); // toast만 의존성으로 설정

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const customer = JSON.parse(params.get('customer'));

        if (!token || !customer) {
          throw new Error('토큰 또는 고객 정보가 없습니다.');
        }

        await login(customer, token);

        toast({
          title: '소셜 로그인 성공',
          description: '환영합니다!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      } catch (error) {
        toast({
          title: '소셜 로그인 실패',
          description: error.message || '소셜 로그인에 실패했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    handleCallback();
  }, [navigate, login, toast, location.search]); // location.search로 최적화

  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      minH="100vh"
      px={{ base: 3, md: 4 }}
    >
      <VStack spacing={4}>
        <Spinner size="md" color="blue.500" />
        <Text>소셜 로그인 처리 중...</Text>
        <Text textAlign="center" fontSize="sm">
          전화번호로 로그인하려면{' '}
          <Button
            as={Link}
            to="/login"
            variant="link"
            fontSize="sm"
            color="blue.500"
          >
            여기
          </Button>
          를 클릭하세요.
        </Text>
      </VStack>
    </Flex>
  );
};

export default AuthCallback;