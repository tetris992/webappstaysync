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
        scope: 'openid,account_email,phone_number', // OpenID Connect 및 전화번호 요청
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
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-100px"
        right="-100px"
        width="300px"
        height="300px"
        borderRadius="full"
        bg="blue.50"
        opacity="0.5"
        zIndex="0"
      />
      <Box
        position="absolute"
        bottom="-100px"
        left="-100px"
        width="300px"
        height="300px"
        borderRadius="full"
        bg="teal.50"
        opacity="0.5"
        zIndex="0"
      />

      <Container
        maxW={{ base: '100%', sm: '400px' }}
        w="100%"
        position="relative"
        zIndex="1"
      >
        <VStack spacing={8} align="stretch">
          <VStack spacing={2}>
            <Heading
              size="xl"
              bgGradient="linear(to-r, blue.600, teal.500)"
              bgClip="text"
              fontWeight="extrabold"
            >
              단잠
            </Heading>
            <Text
              fontSize="lg"
              color="gray.700"
              fontWeight="medium"
              letterSpacing="tight"
            >
              편안한 숙박예약
            </Text>
          </VStack>

          <VStack spacing={4} w="100%">
            <Button
              leftIcon={<Icon as={SiKakao} boxSize="20px" />}
              w="100%"
              h="56px"
              bg="#FEE500"
              color="rgba(0,0,0,0.85)"
              _hover={{
                bg: '#FDD800',
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
              _active={{ transform: 'translateY(0)' }}
              onClick={handleKakaoLogin}
              isLoading={isKakaoLoading}
              isDisabled={!isKakaoEnabled || isKakaoLoading}
              fontSize="18px"
              fontWeight="700"
              borderRadius="full"
              boxShadow="md"
              transition="all 0.2s"
            >
              카카오로 시작하기
            </Button>

            <Text
              fontSize="xs"
              color="gray.400"
              textAlign="center"
              letterSpacing="tight"
            >
              카카오 로그인 시 별도의 회원가입이 필요하지 않습니다
            </Text>
          </VStack>

          <HStack justify="center" spacing={4} fontSize="sm" color="gray.500">
            <Text
              as="a"
              href="/consent"
              _hover={{ color: 'blue.600', textDecoration: 'underline' }}
              transition="color 0.2s"
            >
              이용약관
            </Text>
            <Text>|</Text>
            <Text
              as="a"
              href="/consent"
              _hover={{ color: 'blue.600', textDecoration: 'underline' }}
              transition="color 0.2s"
            >
              개인정보처리방침
            </Text>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
