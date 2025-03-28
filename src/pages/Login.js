// webapp/src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  VStack,
  Input,
  Button,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { customerLogin, customerLoginSocial } from '../api/api';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import { SiKakao, SiNaver } from 'react-icons/si';
import { FaGoogle } from 'react-icons/fa';

// 일반 로그인에 필요한 스키마 (전화번호와 비밀번호)
const schema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required('전화번호는 필수입니다.')
    .matches(/^\d{10,11}$|^\d{3}-\d{3,4}-\d{4}$/, '전화번호는 10~11자리 숫자여야 합니다.'),
  password: yup
    .string()
    .required('비밀번호는 필수입니다.')
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다.'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  // 처음에는 소셜 로그인 옵션만 보여주고, 나중에 일반 로그인 폼을 보여주기 위한 상태
  const [showNormalLogin, setShowNormalLogin] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Kakao SDK 초기화 (소셜 로그인용)
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('YOUR_KAKAO_APP_KEY'); // 실제 키로 교체하세요.
    }
  }, []);

  // 일반 로그인 처리 (phoneNumber와 password만 전송)
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

  // 전화번호 입력 시 숫자만 추출하여 포맷팅
  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    const formatted = formatPhoneNumber(value);
    setValue('phoneNumber', formatted, { shouldValidate: true });
  };

  // 소셜 로그인 처리 (카카오만 임시 구현)
  const handleSocialLogin = async (provider) => {
    setIsSocialLoading(true);
    try {
      if (provider === 'kakao') {
        await new Promise((resolve, reject) => {
          window.Kakao.Auth.login({
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
        const data = await customerLoginSocial(provider, socialData);
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          throw new Error('리다이렉트 URL이 없습니다.');
        }
      } else {
        toast({
          title: '미구현 기능',
          description: `${provider} 로그인은 아직 구현되지 않았습니다.`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      let errorMessage = '소셜 로그인 중 오류가 발생했습니다.';
      if (error.message.includes('popup_blocked_by_browser')) {
        errorMessage = '팝업 차단이 활성화되어 있습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
      } else if (error.message.includes('user_cancelled')) {
        errorMessage = '사용자가 로그인을 취소했습니다.';
      } else if (error.message.includes('network_error')) {
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('invalid_app_key')) {
        errorMessage = '카카오 앱 키가 유효하지 않습니다. 관리자에게 문의해주세요.';
      }
      toast({
        title: '소셜 로그인 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSocialLoading(false);
    }
  };

  // "다음에 할께요" 버튼 클릭 시 일반 로그인 폼을 보여줌
  const handleSkipSocial = () => {
    setShowNormalLogin(true);
  };

  return (
    <Container
      maxW="container.sm"
      py={8}
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      sx={{
        '@media (max-width: 480px)': { padding: '16px' },
        '@media (max-width: 768px)': { padding: '20px' },
      }}
    >
      <VStack spacing={6} align="stretch">
        <Text
          fontSize={{ base: '1.5xl', md: '3xl' }}
          fontWeight="bold"
          textAlign="center"
          color="gray.800"
          w="full"
        >
          단잠 : 편안한 숙박예약
        </Text>

        {!showNormalLogin ? (
          <>
            <VStack spacing={3} align="stretch">
              <Button
                onClick={() => handleSocialLogin('kakao')}
                bg="#FEE500"
                color="black"
                leftIcon={<Icon as={SiKakao} />}
                iconSpacing={3}
                _hover={{ bg: '#E4D100' }}
                w="full"
                borderRadius="md"
                justifyContent="center"
                isLoading={isSocialLoading}
                loadingText="카카오 로그인 중..."
              >
                카카오로 계속하기
              </Button>
              <Button
                onClick={() => handleSocialLogin('naver')}
                bg="#03C75A"
                color="white"
                leftIcon={<Icon as={SiNaver} />}
                iconSpacing={3}
                _hover={{ bg: '#02B050' }}
                w="full"
                borderRadius="md"
                justifyContent="center"
                isLoading={isSocialLoading}
                loadingText="네이버 로그인 중..."
              >
                네이버로 계속하기
              </Button>
              <Button
                onClick={() => handleSocialLogin('google')}
                bg="white"
                color="black"
                border="1px solid"
                borderColor="gray.300"
                leftIcon={<Icon as={FaGoogle} />}
                iconSpacing={3}
                _hover={{ bg: 'gray.100' }}
                w="full"
                borderRadius="md"
                justifyContent="center"
                isLoading={isSocialLoading}
                loadingText="구글 로그인 중..."
              >
                구글로 계속하기
              </Button>
            </VStack>
            <Button variant="link" colorScheme="blue" onClick={handleSkipSocial} w="full" _hover={{ textDecoration: 'none', bg: 'transparent' }}>
              다음에 할께요
            </Button>
          </>
        ) : (
          // 일반 로그인 폼 표시
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.phoneNumber}>
                <FormLabel color="gray.600">전화번호</FormLabel>
                <Input
                  {...register('phoneNumber')}
                  placeholder="010-1234-5678"
                  onChange={handlePhoneNumberChange}
                  w="full"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'teal.500',
                    boxShadow: '0 0 0 1px teal.500',
                  }}
                />
                <FormErrorMessage>{errors.phoneNumber?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.password}>
                <FormLabel color="gray.600">비밀번호</FormLabel>
                <Input
                  type="password"
                  {...register('password')}
                  placeholder="비밀번호 입력"
                  w="full"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'teal.500',
                    boxShadow: '0 0 0 1px teal.500',
                  }}
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>
              <Button
                colorScheme="teal"
                type="submit"
                mt={4}
                w="full"
                isLoading={isSubmitting}
                loadingText="처리 중..."
                borderRadius="md"
                bg="teal.500"
                _hover={{ bg: 'teal.600' }}
              >
                로그인
              </Button>
            </VStack>
          </form>
        )}

        <Text textAlign="center" fontSize="xs" color="gray.500" w="full">
          회원이 아니신가요?{' '}
          <Button as={Link} to="/register" variant="link" colorScheme="blue" fontSize="xs" _hover={{ textDecoration: 'none', bg: 'transparent' }}>
            회원가입
          </Button>
        </Text>
      </VStack>
    </Container>
  );
};

export default Login;
