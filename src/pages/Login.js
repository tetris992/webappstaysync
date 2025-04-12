import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  useToast,
  Icon,
  Input,
  HStack,
  Heading,
  Container,
} from '@chakra-ui/react';
import { SiKakao } from 'react-icons/si';
import { FaPhone } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { initKakao } from '../utils/kakao';
import axios from 'axios';

const Login = () => {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [isKakaoEnabled, setIsKakaoEnabled] = useState(true);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);

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

  const handlePhoneLogin = async () => {
    if (!phoneNumber) {
      toast({
        title: "전화번호를 입력해주세요",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await axios.post('/api/customer/send-otp', { 
        phoneNumber: phoneNumber.replace(/[^0-9]/g, '') 
      });
      
      if (response.data.success) {
        setOtpSent(true);
        toast({
          title: "인증번호가 발송되었습니다",
          status: "success",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: error.response?.data?.message || '인증번호 발송 중 오류가 발생했습니다',
        status: "error",
        duration: 3000,
      });
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

            {!showPhoneInput ? (
              <Button
                leftIcon={<FaPhone />}
                w="100%"
                h="50px"
                variant="outline"
                borderColor="gray.300"
                borderWidth="1px"
                bg="white"
                _hover={{ bg: "gray.50", borderColor: "gray.400" }}
                onClick={() => setShowPhoneInput(true)}
                fontSize="16px"
                fontWeight="600"
              >
                전화번호 로그인
              </Button>
            ) : (
              <VStack w="100%" spacing={4}>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="전화번호 입력 (- 없이)"
                  size="lg"
                  h="50px"
                  bg="white"
                  borderColor="gray.200"
                />
                
                <Button
                  w="100%"
                  h="50px"
                  colorScheme="blue"
                  onClick={handlePhoneLogin}
                  fontSize="16px"
                  fontWeight="600"
                >
                  {otpSent ? '인증번호 재전송' : '인증번호 받기'}
                </Button>

                {otpSent && (
                  <OTPVerificationForm 
                    phoneNumber={phoneNumber}
                    onSuccess={(data) => {
                      if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('refreshToken', data.refreshToken);
                        window.location.href = '/';
                      }
                    }}
                  />
                )}

                <Button
                  w="100%"
                  variant="ghost"
                  onClick={() => {
                    setShowPhoneInput(false);
                    setOtpSent(false);
                    setPhoneNumber('');
                  }}
                  fontSize="14px"
                >
                  뒤로가기
                </Button>
              </VStack>
            )}
          </VStack>

          <HStack justify="center" spacing={4} fontSize="sm" color="gray.600">
            <Link to="/consent">이용약관</Link>
            <Text>|</Text>
            <Link to="/consent">개인정보처리방침</Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

const OTPVerificationForm = ({ phoneNumber, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const toast = useToast();

  const handleVerify = async () => {
    if (!otp) {
      toast({
        title: "인증번호를 입력해주세요",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await axios.post('/api/customer/verify-otp', {
        phoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
        otp
      });

      if (response.data.success) {
        toast({
          title: "로그인 성공",
          status: "success",
          duration: 3000,
        });
        onSuccess(response.data);
      }
    } catch (error) {
      toast({
        title: error.response?.data?.message || '인증 실패',
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <VStack spacing={4} w="100%">
      <Input
        type="number"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="인증번호 6자리 입력"
        size="lg"
        h="50px"
        bg="white"
        borderColor="gray.200"
      />
      <Button
        w="100%"
        h="50px"
        colorScheme="blue"
        onClick={handleVerify}
        isDisabled={!otp}
        fontSize="16px"
        fontWeight="600"
      >
        인증하기
      </Button>
    </VStack>
  );
};

export default Login;
