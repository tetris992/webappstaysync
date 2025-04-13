// webapp/src/components/KakaoCallback.js
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
  const processingRef = useRef(false); // 처리 중인지 여부를 추적하는 ref

  useEffect(() => {
    // 이미 인증된 상태면 처리하지 않음
    if (isAuthenticated) {
      console.log('[KakaoCallback] Already authenticated, redirecting to home');
      navigate('/');
      return;
    }

    // 현재 경로가 콜백 URL이 아니면 처리하지 않음
    if (!location.pathname.includes('/auth/kakao/callback')) {
      console.log('[KakaoCallback] Not on callback path, skipping');
      setLoading(false);
      return;
    }

    // 이미 처리 중이면 중복 처리 방지
    if (processingRef.current) {
      console.log('[KakaoCallback] Already processing, skipping duplicate');
      return;
    }

    const handleCallback = async () => {
      // 처리 시작 표시
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
        // 재시도 없이 한 번만 요청
        const response = await customerLoginSocial('kakao', { code });
        console.log('[KakaoCallback] Login response:', response);

        // 로그인 성공했을 때만 상태 업데이트
        if (response && response.success) {
          await login(response.customer, response.token);
          
          toast({
            title: '로그인 성공',
            description: '카카오 계정으로 로그인되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          // 로그인 성공 후 홈으로 이동
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('[KakaoCallback] Error:', error);
        setError(error.message);
        
        toast({
          title: '로그인 실패',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        
        // 로그인 실패 시 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
        // 처리 완료 표시
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
          <Text color="red.500" fontSize="lg">{error}</Text>
          <Text mt={2}>잠시 후 로그인 페이지로 이동합니다...</Text>
        </Box>
      </Center>
    );
  }

  return null;
};

export default KakaoCallback;
