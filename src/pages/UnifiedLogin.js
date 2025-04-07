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
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Divider,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { SiKakao } from 'react-icons/si';
import { useAuth } from '../contexts/AuthContext';
import { customerLogin, customerLoginSocial } from '../api/api';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import useSocialLoginSettings from '../hooks/useSocialLoginSettings';

const schema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required('전화번호는 필수입니다.')
    .matches(
      /^\d{10,11}$|^\d{3}-\d{3,4}-\d{4}$/,
      '전화번호는 10~11자리 숫자여야 합니다.'
    ),
  password: yup
    .string()
    .required('비밀번호는 필수입니다.')
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다.'),
});

const UnifiedLogin = () => {
  const { login, customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSocialLoading, setIsSocialLoading] = useState({
    kakao: false,
  });
  const [isKakaoEnabled, setIsKakaoEnabled] = useState(true); // 카카오 로그인 활성화 상태
  const { socialLoginSettings, loading } = useSocialLoginSettings();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // 이미 로그인되어 있다면 바로 홈으로 리다이렉트
  useEffect(() => {
    if (customer) {
      navigate('/');
    }
  }, [customer, navigate]);

  // Kakao SDK 초기화
  useEffect(() => {
    console.log('REACT_APP_KAKAO_APP_KEY:', process.env.REACT_APP_KAKAO_APP_KEY);
    if (window.Kakao && !window.Kakao.isInitialized()) {
      if (!process.env.REACT_APP_KAKAO_APP_KEY) {
        console.error('Kakao App Key is not set in environment variables');
        toast({
          title: 'Kakao 로그인 오류',
          description:
            'Kakao App Key가 설정되지 않았습니다. 카카오 로그인은 비활성화됩니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsKakaoEnabled(false); // 카카오 로그인 비활성화
        return;
      }
      try {
        window.Kakao.init(process.env.REACT_APP_KAKAO_APP_KEY);
        console.log('Kakao SDK initialized');
      } catch (error) {
        console.error('Kakao SDK initialization failed:', error);
        toast({
          title: 'Kakao 로그인 오류',
          description:
            'Kakao SDK 초기화에 실패했습니다. 카카오 로그인은 비활성화됩니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsKakaoEnabled(false); // 카카오 로그인 비활성화
      }
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
    setIsSocialLoading((prev) => ({ ...prev, kakao: true }));
    try {
      // 환경에 따른 Redirect URI 설정
      const isProduction = process.env.NODE_ENV === 'production';
      const redirectUri = isProduction
        ? 'https://danjam.in/auth/kakao/callback'
        : 'http://localhost:3000/auth/kakao/callback';

      await new Promise((resolve, reject) => {
        window.Kakao.Auth.authorize({
          redirectUri,
          success: () => resolve(),
          fail: (error) => reject(error),
        });
      });
      const userInfo = await new Promise((resolve, reject) => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (response) => resolve(response),
          fail: (error) => reject(error),
        });
      });
      const socialData = {
        providerId: userInfo.id.toString(),
        name: userInfo.properties.nickname || 'Unknown',
        email: userInfo.kakao_account.email || '',
      };
      if (socialLoginSettings?.kakao?.openIdConnectEnabled) {
        const idToken = window.Kakao.Auth.getIdToken();
        if (idToken) {
          socialData.idToken = idToken;
        }
      }
      const data = await customerLoginSocial('kakao', socialData);
      if (data.redirectUrl) {
        console.log(`Kakao login successful: ${socialData.email}`);
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('리다이렉트 URL이 없습니다.');
      }
    } catch (error) {
      let errorMessage = '소셜 로그인 중 오류가 발생했습니다.';
      if (error.message.includes('popup_blocked_by_browser')) {
        errorMessage =
          '팝업 차단이 활성화되어 있습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
      } else if (error.message.includes('user_cancelled')) {
        errorMessage = '사용자가 로그인을 취소했습니다.';
      } else if (error.message.includes('network_error')) {
        errorMessage =
          '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('invalid_app_key')) {
        errorMessage = '앱 키가 유효하지 않습니다. 관리자에게 문의해주세요.';
      } else if (error.message.includes('invalid_scope')) {
        errorMessage =
          '요청된 권한이 유효하지 않습니다. 관리자에게 문의해주세요.';
      }
      console.error(`Social login failed for kakao: ${error.message}`);
      toast({
        title: '소셜 로그인 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSocialLoading((prev) => ({ ...prev, kakao: false }));
    }
  };

  const onSubmit = async (data) => {
    try {
      const response = await customerLogin({
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      await login(response.customer, response.token);
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: '로그인 실패',
        description: error.message || '전화번호 또는 비밀번호를 확인해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    const formatted = formatPhoneNumber(value);
    setValue('phoneNumber', formatted, { shouldValidate: true });
  };

  // 로딩 중이거나 이미 로그인된 상태라면 로딩 화면을 보여줍니다.
  if (loading || customer) {
    return (
      <Flex
        direction="column"
        justify="center"
        align="center"
        minH="100vh"
        px={{ base: 3, md: 4 }}
      >
        <Text>소셜 로그인 설정을 불러오는 중...</Text>
      </Flex>
    );
  }

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
            단잠: 편안한 숙박예약
          </Text>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={2}>
              <FormControl isInvalid={!!errors.phoneNumber}>
                <FormLabel>전화번호</FormLabel>
                <Input
                  {...register('phoneNumber')}
                  placeholder="010-1234-5678"
                  onChange={handlePhoneNumberChange}
                  w="full"
                />
                <FormErrorMessage>
                  {errors.phoneNumber?.message}
                </FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.password}>
                <FormLabel>비밀번호</FormLabel>
                <Input
                  type="password"
                  {...register('password')}
                  placeholder="비밀번호 입력"
                  w="full"
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>
              <Button
                variant="solid"
                type="submit"
                w="full"
                isLoading={isSubmitting}
                loadingText="처리 중..."
                size="md"
              >
                로그인
              </Button>
            </VStack>
          </form>
          <Text textAlign="center" fontSize="sm">
            회원이 아니신가요?{' '}
            <Button as={Link} to="/register" variant="link" fontSize="sm">
              회원가입
            </Button>
          </Text>
          <Divider />
          <Text textAlign="center" fontSize="sm" my={{ base: 6, md: 8 }}>
            OR
          </Text>
          <VStack spacing={3}>
            <Button
              variant="kakao"
              w="full"
              leftIcon={<Icon as={SiKakao} />}
              onClick={() => handleSocialLogin('kakao')}
              isLoading={isSocialLoading.kakao}
              isDisabled={isSocialLoading.kakao || !isKakaoEnabled} // 카카오 로그인 비활성화 시 버튼 비활성화
              loadingText="카카오 로그인 중..."
              size="md"
            >
              카카오로 계속하기
            </Button>
          </VStack>
          <Text textAlign="center" fontSize="xs" mt={{ base: 6, md: 8 }}>
            이용약관 |{' '}
            <Button as={Link} to="/privacy" variant="link" fontSize="xs">
              개인정보처리방침
            </Button>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default UnifiedLogin;