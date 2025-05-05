import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  useToast,
  HStack,
  Container,
  Image,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { initKakao } from '../utils/kakao';

const Login = () => {
  const { customer, setHotelList, setCustomerCoupons } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [isKakaoEnabled, setIsKakaoEnabled] = useState(true);
  const [api, setApi] = useState(null);

  // API 모듈 동적 로드
  useEffect(() => {
    const loadApi = async () => {
      try {
        const apiModule = await import('../api/api');
        setApi(apiModule);
      } catch (error) {
        console.error('Failed to load API module:', error);
        toast({
          title: 'API 로드 실패',
          description: 'API 모듈을 로드하지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    loadApi();
  }, [toast]);

  useEffect(() => {
    if (customer && api) {
      const { fetchHotelList, fetchCustomerCoupons } = api;
      // 로그인 성공 후 호텔 목록과 쿠폰 로드
      const loadInitialData = async () => {
        try {
          const hotelList = await fetchHotelList();
          setHotelList(hotelList);

          const coupons = await fetchCustomerCoupons(customer._id);
          setCustomerCoupons(coupons);
        } catch (error) {
          console.error('Initial data load failed:', error);
          toast({
            title: '데이터 로드 실패',
            description: error.message || '호텔 목록 및 쿠폰을 불러오지 못했습니다.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      };
      loadInitialData();
      navigate('/');
    }
  }, [customer, api, navigate, setHotelList, setCustomerCoupons, toast]);

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
        scope: 'openid,account_email,phone_number',
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
      bg="white"
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
      p={4}
      position="relative"
      overflow="auto"
    >
      <Container
        maxW={{ base: '100%', sm: '390px' }} // Standard mobile width
        w="100%"
        position="relative"
        zIndex="1"
        pt="197.5px" // Top positioning for logo section
      >
        <VStack spacing={0} align="stretch">
          <VStack spacing="20px" align="center">
            <Image
              src="/assets/danjamLogo.svg"
              alt="Danjam Logo"
              width="88px"
              height="auto"
            />
            <Text
              fontSize="lg"
              color="gray.700"
              fontWeight="medium"
              letterSpacing="tight"
              width="160px"
              height="27px"
              lineHeight="27px"
              textAlign="center"
            >
              편안한 숙박예약의 시작
            </Text>
          </VStack>

          <Box h="69.5px" /> {/* Gap to position button at 445px from top */}

          <VStack spacing="24px" w="326px" mx="auto">
            <Button
              leftIcon={
                <Box mr="8px">
                  <Image
                    src="/assets/kakaoLogo.svg"
                    alt="Kakao Icon"
                    width="18px"
                    height="18px"
                  />
                </Box>
              }
              w="326px"
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
              fontSize="16px" // Adjusted font size to match screenshot
              fontWeight="700"
              borderRadius="5px"
              boxShadow="md"
              transition="all 0.2s"
              pl="16px" // Adjusted left padding for icon positioning
            >
              카카오로 로그인
            </Button>

            <Text
              fontSize="xs"
              color="gray.400"
              textAlign="center"
              letterSpacing="tight"
            >
              로그인하시면 아래 내용에 동의하는 것으로 간주됩니다.
            </Text>
          </VStack>

          <HStack justify="center" spacing={4} fontSize="sm" color="blue.600" mt={4}>
            <Text
              as="a"
              href="/consent"
              _hover={{ textDecoration: 'underline' }}
              transition="color 0.2s"
            >
              이용약관
            </Text>
            <Text>|</Text>
            <Text
              as="a"
              href="/consent"
              _hover={{ textDecoration: 'underline' }}
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