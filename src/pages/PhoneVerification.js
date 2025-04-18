import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { sendPhoneOTP, verifyPhoneOTP } from '../api/api';

const PhoneVerification = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    console.log('[PhoneVerification] Component mounted, customerId:', customerId);
    const token = localStorage.getItem('customerToken');
    console.log('[PhoneVerification] Current customerToken:', token ? `${token.substring(0, 10)}...` : 'No token');
    // 인증 프로세스 중에는 리다이렉트 방지
    if (isAuthenticated && !otpSent && !otp) {
      console.log('[PhoneVerification] User is authenticated, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, customerId, otpSent, otp]);

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
      const response = await sendPhoneOTP(phoneNumber);
      console.log('[PhoneVerification] sendPhoneOTP response:', response);
      setOtpSent(true);
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
        description: error.message || 'OTP 발송 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      console.log('[PhoneVerification] OTP is empty');
      toast({
        title: 'OTP 입력',
        description: '인증번호를 입력해 주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    console.log('[PhoneVerification] Verifying OTP:', otp);
    setIsVerifyingOTP(true);
    try {
      const response = await verifyPhoneOTP(phoneNumber, otp);
      console.log('[PhoneVerification] verifyPhoneOTP full response:', JSON.stringify(response, null, 2));
      if (response.success) {
        await login(response.customer, response.token);
        localStorage.setItem('customerToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        console.log('[PhoneVerification] Stored tokens:', {
          customerToken: response.token,
          refreshToken: response.refreshToken,
        });
        toast({
          title: '전화번호 인증 성공',
          description: '전화번호가 성공적으로 인증되었습니다.',
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
        description: error.message || 'OTP 인증 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6자리 인증번호"
                />
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