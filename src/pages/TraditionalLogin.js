import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import {
  Flex,
  Box,
  VStack,
  Text,
  FormControl,
  FormErrorMessage,
  Input,
  Button,
  Divider,
  useToast,
  Icon,
  Spinner,
  Select,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { SiKakao } from 'react-icons/si';
import { PhoneIcon, LockIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { sendOTP, verifyOTP } from '../api/api';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import useSocialLoginSettings from '../hooks/useSocialLoginSettings';
import { initKakao } from '../utils/kakao';
import { getDeviceToken } from '../utils/device';

const schema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required('전화번호는 필수입니다.')
    .matches(
      /^\d{10,11}$|^\d{3}-\d{3,4}-\d{4}$/,
      '전화번호는 10~11자리 숫자여야 합니다.'
    ),
  otp: yup.string().when('otpSent', {
    is: true,
    then: yup.string().required('인증번호를 입력해주세요.'),
  }),
});

const countryCodes = [
  { name: 'South Korea', code: '+82' },
  { name: 'United States', code: '+1' },
  { name: 'Japan', code: '+81' },
  { name: 'China', code: '+86' },
  { name: 'India', code: '+91' },
  { name: 'Indonesia', code: '+62' },
  { name: 'Russia', code: '+7' },
  { name: 'Brazil', code: '+55' },
  { name: 'Canada', code: '+1' },
  { name: 'France', code: '+33' },
  { name: 'Germany', code: '+49' },
  { name: 'Italy', code: '+39' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Australia', code: '+61' },
  { name: 'Saudi Arabia', code: '+966' },
  { name: 'South Africa', code: '+27' },
  { name: 'Turkey', code: '+90' },
  { name: 'Argentina', code: '+54' },
  { name: 'Mexico', code: '+52' },
  { name: 'Vietnam', code: '+84' },
  { name: 'Thailand', code: '+66' },
  { name: 'Mongolia', code: '+976' },
  { name: 'Philippines', code: '+63' },
  { name: 'Malaysia', code: '+60' },
  { name: 'Singapore', code: '+65' },
  { name: 'Cambodia', code: '+855' },
  { name: 'Laos', code: '+856' },
  { name: 'Myanmar', code: '+95' },
];

const TraditionalLogin = () => {
  const { login, customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSocialLoading, setIsSocialLoading] = useState({ kakao: false });
  const [isKakaoEnabled, setIsKakaoEnabled] = useState(true);
  const { loading } = useSocialLoginSettings();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countryCode, setCountryCode] = useState('+82');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      phoneNumber: localStorage.getItem('phoneNumber') || '',
      otp: '',
    },
    context: { otpSent },
  });

  // 인증된 사용자가 있으면 홈으로 리다이렉션
  useEffect(() => {
    if (customer) navigate('/');
  }, [customer, navigate]);

  // 카카오 SDK 초기화
  useEffect(() => {
    try {
      const initialized = initKakao();
      setIsKakaoEnabled(initialized);
      if (!initialized) {
        toast({
          title: '카카오 로그인 오류',
          description:
            '카카오 SDK 초기화에 실패했습니다. 관리자에게 문의하세요.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Kakao initialization error:', error);
      setIsKakaoEnabled(false);
      toast({
        title: '카카오 로그인 오류',
        description:
          error.message ||
          '카카오 SDK 초기화에 실패했습니다. 배포 환경 설정을 확인하세요.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleSocialLogin = async (provider) => {
    if (provider !== 'kakao') {
      toast({
        title: '미구현 기능',
        description: '현재는 카카오 로그인만 지원됩니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isAuthorizing) {
      toast({
        title: '로그인 진행 중',
        description: '이미 로그인 요청이 진행 중입니다. 잠시 기다려주세요.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsAuthorizing(true);
    setIsSocialLoading((prev) => ({ ...prev, kakao: true }));

    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const redirectUri = isProduction
        ? 'https://danjam.in/auth/kakao/callback'
        : 'http://localhost:3000/auth/kakao/callback';

      window.Kakao.Auth.authorize({
        redirectUri,
        scope: 'account_email profile',
        prompt: 'none',
      });
    } catch (error) {
      let errorMessage = '소셜 로그인 중 오류가 발생했습니다.';
      if (error.message.includes('popup_blocked_by_browser')) {
        errorMessage =
          '팝업 차단이 활성화되어 있습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
      } else if (error.message.includes('user_cancelled')) {
        errorMessage = '사용자가 로그인을 취소했습니다.';
      } else if (error.error_code === 'KOE205') {
        errorMessage =
          '카카오 서비스 설정 오류(KOE205): 관리자가 설정을 확인해야 합니다.';
        console.error('KOE205 Error Details:', error);
      } else if (error.response?.status === 429) {
        errorMessage =
          '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      toast({
        title: '소셜 로그인 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSocialLoading((prev) => ({ ...prev, kakao: false }));
      setIsAuthorizing(false);
    }
  };

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    const formatted = formatPhoneNumber(value);
    setValue('phoneNumber', formatted, { shouldValidate: true });
  };

  const handleSendOTP = async (data) => {
    try {
      let phone = data.phoneNumber.trim();
      if (countryCode !== '+82') {
        phone = countryCode + phone;
      }
      await sendOTP({ phoneNumber: phone });
      setOtpSent(true);
      toast({
        title: '인증번호 전송',
        description: 'SMS로 인증번호가 전송되었습니다. 5분 내에 입력해주세요.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '인증번호 전송 실패',
        description: error.message || '인증번호 전송에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const onSubmit = async (data) => {
    if (!otpSent) {
      await handleSendOTP(data);
      return;
    }

    try {
      let phone = data.phoneNumber.trim();
      if (countryCode !== '+82') {
        phone = countryCode + phone;
      }
      const deviceToken = getDeviceToken();
      const response = await verifyOTP({
        phoneNumber: phone,
        otp: data.otp,
        deviceToken,
      });
      await login(response.customer, response.token, response.refreshToken);
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      if (error.status === 403) {
        errorMessage = error.message;
        navigate(error.redirectUrl, {
          state: { customerId: error.customerId },
        });
      } else if (error.status === 404) {
        errorMessage = '가입되지 않은 전화번호입니다.';
      } else if (error.status === 400) {
        errorMessage = error.message;
        if (error.message.includes('인증번호가 만료되었습니다')) {
          setOtpSent(false); // OTP 재요청 유도
        }
      }
      toast({
        title: '로그인 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex
        direction="column"
        justify="center"
        align="center"
        minH="100vh"
        px={{ base: 3, md: 4 }}
      >
        <Spinner size="md" color="brand.500" />
        <Text mt={4}>소셜 로그인 설정을 불러오는 중...</Text>
      </Flex>
    );
  }

  if (customer) return null;

  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      minH="100vh"
      px={{ base: 3, md: 4 }}
    >
      <Box
        w={{ base: '95%', sm: '85%', md: 'sm' }}
        p={{ base: 3, md: 4 }}
        bg="white"
        borderRadius="lg"
        boxShadow="md"
      >
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          <Text
            fontSize={{ base: '2xl', md: '2xl' }}
            fontWeight="bold"
            textAlign="center"
            mb={{ base: 6, md: 8 }}
          >
            Welcome back
          </Text>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={2}>
              <FormControl>
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={otpSent}
                  borderColor="black"
                  bg="white"
                  color="black"
                >
                  {countryCodes.map((country, index) => (
                    <option
                      key={`${country.name}-${country.code}-${index}`}
                      value={country.code}
                    >
                      {`${country.name} (${country.code})`}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isInvalid={!!errors.phoneNumber}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <PhoneIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    {...register('phoneNumber')}
                    placeholder="Phone number *"
                    onChange={handlePhoneNumberChange}
                    disabled={otpSent}
                    borderColor="black"
                    bg="white"
                    color="black"
                  />
                </InputGroup>
                <FormErrorMessage>
                  {errors.phoneNumber?.message}
                </FormErrorMessage>
              </FormControl>
              {otpSent && (
                <>
                  <Text fontSize="sm" color="gray.600">
                    SMS로 전송된 인증번호를 입력하세요.
                  </Text>
                  <FormControl isInvalid={!!errors.otp}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <LockIcon color="gray.300" />
                      </InputLeftElement>
                      <Input
                        {...register('otp')}
                        placeholder="Enter verification code"
                        borderColor="black"
                        bg="white"
                        color="black"
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.otp?.message}</FormErrorMessage>
                  </FormControl>
                </>
              )}
              <Button
                variant="solid"
                type="submit"
                w="full"
                isLoading={isSubmitting}
                loadingText={otpSent ? 'Logging in...' : 'Sending code...'}
                size="md"
                bg="green.500"
                color="white"
                _hover={{ bg: 'green.600' }}
              >
                Continue
              </Button>
            </VStack>
          </form>
          <Text textAlign="center" fontSize="sm">
            Don't have an account?{' '}
            <Button as={Link} to="/register" variant="link" fontSize="sm">
              Sign Up
            </Button>
          </Text>
          <Divider />
          <Text textAlign="center" fontSize="sm" my={{ base: 6, md: 8 }}>
            OR
          </Text>
          <Button
            w="full"
            size="md"
            bg="yellow.400"
            color="black"
            leftIcon={<Icon as={SiKakao} />}
            onClick={() => handleSocialLogin('kakao')}
            isLoading={isSocialLoading.kakao}
            isDisabled={isSocialLoading.kakao || !isKakaoEnabled}
            loadingText="Logging in with Kakao..."
          >
            Continue with Kakao
          </Button>
          <Text textAlign="center" fontSize="xs" mt={{ base: 6, md: 8 }}>
            <Button
              as={Link}
              to="/terms"
              variant="link"
              fontSize="xs"
              color="teal.500"
            >
              Terms of Use
            </Button>{' '}
            |{' '}
            <Button
              as={Link}
              to="/privacy"
              variant="link"
              fontSize="xs"
              color="teal.500"
            >
              Privacy Policy
            </Button>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default TraditionalLogin;
