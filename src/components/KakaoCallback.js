import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast, Spinner, Center, Box, Text } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { customerLoginSocial } from '../api/api';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('[KakaoCallback] Already authenticated, redirecting to home');
      navigate('/', { replace: true });
      return;
    }

    if (!location.pathname.includes('/auth/kakao/callback')) {
      console.log('[KakaoCallback] Not on callback path, skipping');
      setLoading(false);
      return;
    }

    if (processingRef.current) {
      console.log('[KakaoCallback] Already processing, skipping duplicate');
      return;
    }

    const handleCallback = async () => {
      processingRef.current = true;

      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');

        console.log('[KakaoCallback] Current URL:', window.location.href);
        console.log('[KakaoCallback] Code from URL:', code);

        if (!code) {
          throw new Error('카카오 인증 코드가 없습니다.');
        }

        console.log('[KakaoCallback] Processing login with code');
        const response = await customerLoginSocial('kakao', { code });
        console.log('[KakaoCallback] Login response:', response);

        if (response.token) {
          await login(
            response.customer,
            response.token,
            response.refreshToken,
            response.deviceToken
          );

          toast({
            title: '로그인 성공',
            description: '카카오 계정으로 로그인되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });

          const redirectPath = new URL(response.redirectUrl).pathname;
          navigate(redirectPath, {
            state: { customer: response.customer },
            replace: true,
          });
        } else {
          throw new Error(
            response?.message || '로그인 응답이 유효하지 않습니다.'
          );
        }
      } catch (error) {
        console.error('[KakaoCallback] Error:', {
          message: error.message,
          stack: error.stack,
        });
        setError(error.message);

        let userMessage = error.message;
        if (userMessage.includes('전화번호')) {
          userMessage = '카카오 계정에 등록된 전화번호를 확인해 주세요.';
        } else {
          userMessage = '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.';
        }

        toast({
          title: '로그인 실패',
          description: userMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
        processingRef.current = false;
      }
    };

    handleCallback();
  }, [navigate, login, location, isAuthenticated, toast]);

  if (!location.pathname.includes('/auth/kakao/callback')) {
    return null;
  }

  if (loading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" color="blue.500" />
        <Text ml={4}>카카오 로그인 처리 중...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center height="100vh">
        <Box textAlign="center" p={5}>
          <Text color="red.500" fontSize="lg">
            {error}
          </Text>
          <Text mt={2}>잠시 후 로그인 페이지로 이동합니다...</Text>
        </Box>
      </Center>
    );
  }

  return null;
};

export default KakaoCallback;