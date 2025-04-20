import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  useToast,
  FormControl,
  FormLabel,
  Center,
  Heading,
  HStack,
  InputGroup,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { sendPhoneOTP, verifyPhoneOTP } from '../api/api';

const PhoneVerification = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(300); // 5분(300초) 타이머
  const inputRefs = useRef([]);

  useEffect(() => {
    console.log('[PhoneVerification] Component mounted, customerId:', customerId);
    const token = localStorage.getItem('customerToken');
    console.log('[PhoneVerification] Current customerToken:', token ? `${token.substring(0, 10)}...` : 'No token');
    if (isAuthenticated && !otpSent && !otp.some((digit) => digit !== '')) {
      console.log('[PhoneVerification] User is authenticated, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, customerId, otpSent, otp]);

  useEffect(() => {
    if (otpSent && otpExpiryTimer > 0) {
      const timer = setInterval(() => {
        setOtpExpiryTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (otpExpiryTimer === 0) {
      toast({
        title: 'OTP 만료',
        description: '인증번호가 만료되었습니다. 다시 요청해 주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      setOtpSent(false);
      setOtp(['', '', '', '', '', '']);
      setOtpExpiryTimer(300);
    }
  }, [otpSent, otpExpiryTimer, toast]);

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) {
      toast({
        title: '잘못된 입력',
        description: '숫자만 입력 가능합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    console.log('[PhoneVerification] OTP updated:', newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) {
      toast({
        title: '잘못된 형식',
        description: '6자리 숫자만 붙여넣기 가능합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newOtp = pastedData.split('').slice(0, 6);
    setOtp(newOtp);
    console.log('[PhoneVerification] OTP pasted:', newOtp);
    inputRefs.current[5]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      console.log('[PhoneVerification] Phone number is empty');
      toast({
        title: '전화번호 입력',
        description: '전화번호를 입력해 주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    console.log('[PhoneVerification] Sending OTP for phone:', phoneNumber);
    setIsSendingOTP(true);
    try {
      await sendPhoneOTP(phoneNumber);
      setOtpSent(true);
      setOtpExpiryTimer(300);
      toast({
        title: 'OTP 발송',
        description: '인증번호가 발송되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('[PhoneVerification] sendPhoneOTP error:', error);
      toast({
        title: 'OTP 발송 실패',
        description: error.response?.data?.message || '서버 오류',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    console.log('[PhoneVerification] OTP Value before verification:', otpValue);

    if (otpValue.length !== 6) {
      console.log('[PhoneVerification] OTP is incomplete:', otpValue);
      toast({
        title: 'OTP 입력',
        description: '6자리 인증번호를 입력해 주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!/^\d{6}$/.test(otpValue)) {
      console.log('[PhoneVerification] Invalid OTP format:', otpValue);
      toast({
        title: '잘못된 OTP 형식',
        description: 'OTP는 6자리 숫자여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    console.log('[PhoneVerification] Verifying OTP:', otpValue);
    setIsVerifyingOTP(true);
    try {
      const response = await verifyPhoneOTP(phoneNumber, otpValue);
      if (response.success) {
        await login(response.customer, response.token);
        localStorage.setItem('customerToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        toast({
          title: '인증 성공',
          description: '전화번호 인증이 완료되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/', { replace: true });
      } else {
        throw new Error(response.message || '인증 실패');
      }
    } catch (error) {
      console.error('[PhoneVerification] verifyPhoneOTP error:', error);
      toast({
        title: 'OTP 인증 실패',
        description: error.response?.data?.message || error.message || 'OTP 인증 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  return (
    <Center minH="100vh" bg="gray.50" p={4}>
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="md"
        w={{ base: '100%', sm: '400px' }}
      >
        <VStack spacing={6} align="stretch">
          <Heading size="lg" textAlign="center">
            전화번호 인증
          </Heading>
          <Text textAlign="center" color="gray.600">
            서비스 이용을 위해 전화번호를 인증해 주세요.
          </Text>

          <FormControl>
            <FormLabel>전화번호</FormLabel>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="01012345678"
              isDisabled={otpSent}
              maxLength={11}
              borderColor="gray.300"
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
            />
          </FormControl>

          <Button
            colorScheme="blue"
            onClick={handleSendOTP}
            isLoading={isSendingOTP}
            isDisabled={otpSent}
          >
            인증번호 요청
          </Button>

          {otpSent && (
            <>
              <FormControl>
                <FormLabel>인증번호</FormLabel>
                <HStack spacing={{ base: 1, sm: 2 }} justifyContent="center">
                  {otp.map((digit, index) => (
                    <InputGroup key={index}>
                      <Input
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        maxLength={1}
                        textAlign="center"
                        width={{ base: "36px", sm: "42px" }}
                        height={{ base: "36px", sm: "42px" }}
                        fontSize="md"
                        lineHeight={{ base: "36px", sm: "42px" }}
                        padding={2}
                        borderRadius="md"
                        borderWidth="2px"
                        borderColor="gray.300"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                        ref={(el) => (inputRefs.current[index] = el)}
                      />
                    </InputGroup>
                  ))}
                </HStack>
                <Text mt={2} textAlign="center" color="gray.500" fontSize="sm">
                  남은 시간: {Math.floor(otpExpiryTimer / 60)}:{(otpExpiryTimer % 60).toString().padStart(2, '0')}
                </Text>
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={handleVerifyOTP}
                isLoading={isVerifyingOTP}
              >
                인증 확인
              </Button>
            </>
          )}
        </VStack>
      </Box>
    </Center>
  );
};

export default PhoneVerification;