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
      alignItems="center"
      justifyContent="center"
      p={4}
      position="relative"
      overflow="auto"
    >
      <Container
        maxW={{ base: '100%', sm: '390px' }} // Responsive width: 100% on smaller screens, 390px on small screens and up
        w="100%"
        position="relative"
        zIndex="1"
      >
        <Box
          bg="white"
          p={6} // Padding inside the box: 6 (24px) on all sides
          borderRadius="md"
          boxShadow="sm"
        >
          <VStack spacing={0} align="stretch">
            {/* Logo Section */}
            <VStack spacing="16px" align="center">
              <Image
                src="/assets/danjamLogo.svg"
                alt="Danjam Logo"
                width="88px" // Logo width: 88px
                height="auto"
              />
              <Text
                fontSize="lg" // Font size: 18px (Chakra's lg)
                color="gray.700"
                fontWeight="medium"
                letterSpacing="tight"
                width="160px" // Subtitle width: 160px
                height="27px" // Subtitle height: 27px
                lineHeight="27px"
                textAlign="center"
              >
                편안한 숙박예약의 시작
              </Text>
            </VStack>

            {/* Gap between Logo Section and Button Section */}
            {/* Current: 80px (adjustable between 60px and 100px) */}
            {/* Options: Change h="80px" to h="60px" for a smaller gap, or h="100px" for a larger gap */}
            <Box h="80px" />

            {/* Button, Description, and Terms Links in a Single Container */}
            <VStack
              spacing="16px" // Vertical gap between button, description, and terms links: 16px
              w="100%"
              align="stretch"
            >
              <Button
                leftIcon={
                  <Box mr="6px">
                    <Image
                      src="/assets/kakaoLogo.svg"
                      alt="Kakao Icon"
                      width="18px" // Icon width: 18px
                      height="18px" // Icon height: 18px
                    />
                  </Box>
                }
                w="100%"
                maxW="326px" // Button max width: 326px (ensures responsiveness)
                h="56px" // Button height: 56px
                mx="auto" // Centers the button horizontally
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
                fontSize="16px" // Button text font size: 16px
                fontWeight="700"
                borderRadius="5px"
                boxShadow="md"
                transition="all 0.2s"
                pl="16px" // Left padding for icon positioning: 16px
                justifyContent="center"
              >
                카카오로 로그인
              </Button>

              <Text
                fontSize="xs" // Font size: 12px (Chakra's xs)
                color="gray.400"
                textAlign="center"
                letterSpacing="tight"
              >
                로그인하시면 아래 내용에 동의하는 것으로 간주됩니다.
              </Text>

              <HStack justify="center" spacing={2} fontSize="xs" color="blue.600">
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
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;