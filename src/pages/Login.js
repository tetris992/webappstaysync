import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  useToast,
  Icon,
  HStack,
  Heading,
  Container,
} from '@chakra-ui/react';
import { SiKakao } from 'react-icons/si';
import { useAuth } from '../contexts/AuthContext';
import { initKakao } from '../utils/kakao';

const Login = () => {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [isKakaoEnabled, setIsKakaoEnabled] = useState(true);

  useEffect(() => {
    if (customer) navigate('/');
  }, [customer, navigate]);

  useEffect(() => {
    try {
      const initialized = initKakao();
      setIsKakaoEnabled(initialized);
      if (!initialized) {
        toast({
          title: '카카오 로그인 오류',
          description: '카카오 SDK 초기화에 실패했습니다.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Kakao initialization error:', error);
      setIsKakaoEnabled(false);
    }
  }, [toast]);

  const handleKakaoLogin = async () => {
    if (!isKakaoEnabled || isKakaoLoading) return;

    setIsKakaoLoading(true);
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const redirectUri = isProduction
        ? 'https://danjam.in/auth/kakao/callback'
        : 'http://localhost:3000/auth/kakao/callback';

      window.Kakao.Auth.authorize({
        redirectUri,
        scope: 'account_email'
      });
    } catch (error) {
      toast({
        title: '카카오 로그인 실패',
        description: error.message || '로그인 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsKakaoLoading(false);
    }
  };

  if (customer) return null;

  return (
    <Box 
      minH="100vh" 
      w="100%" 
      bg="gray.50" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      p={4}
    >
      <Container 
        maxW={{ base: "100%", sm: "400px" }} 
        w="100%"
      >
        <VStack spacing={8} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg">단잠</Heading>
            <Text fontSize="md" color="gray.600">편안한 숙박예약</Text>
          </VStack>

          <VStack spacing={4} w="100%">
            <Button
              leftIcon={<Icon as={SiKakao} />}
              w="100%"
              h="50px"
              bg="#FEE500"
              color="rgba(0,0,0,0.85)"
              _hover={{ bg: "#FDD800" }}
              onClick={handleKakaoLogin}
              isLoading={isKakaoLoading}
              isDisabled={!isKakaoEnabled || isKakaoLoading}
              fontSize="16px"
              fontWeight="600"
            >
              카카오로 시작하기
            </Button>
            
            <Text fontSize="sm" color="gray.600" textAlign="center">
              카카오 로그인 시 별도의 회원가입이 필요하지 않습니다
            </Text>
          </VStack>

          <HStack justify="center" spacing={4} fontSize="sm" color="gray.600">
            <Text as="a" href="/consent">이용약관</Text>
            <Text>|</Text>
            <Text as="a" href="/consent">개인정보처리방침</Text>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
