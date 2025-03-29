// webapp/src/pages/Register.js
import React, { useState } from 'react';
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
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { customerRegister } from '../api/api';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import PrivacyConsentModal from '../components/PrivacyConsentModal';

const schema = yup.object().shape({
  name: yup.string().required('이름은 필수입니다.'),
  phoneNumber: yup
    .string()
    .matches(/^\d{10,11}$|^\d{3}-\d{3,4}-\d{4}$/, '전화번호는 10~11자리 숫자여야 합니다.')
    .nullable(),
  email: yup
    .string()
    .email('유효한 이메일 주소를 입력해주세요.')
    .nullable(),
  password: yup
    .string()
    .required('비밀번호는 필수입니다.')
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다.'),
});

const Register = () => {
  const [showConsentModal, setShowConsentModal] = useState(false); // 모달 열림 여부
  const [agreed, setAgreed] = useState(false); // 모달에서 동의 완료 시 true
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // 회원가입 폼 전송
  const onSubmit = async (data) => {
    try {
      // 최종 동의 확인
      if (!agreed) {
        toast({
          title: '동의 필요',
          description: '약관에 동의하셔야 회원가입이 가능합니다.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      // 전화번호, 이메일 기본값 처리
      if (!data.phoneNumber) {
        data.phoneNumber = '01000000000';
      }
      if (!data.email) {
        data.email = `${data.name.replace(/\s/g, '')}@example.com`;
      }
      // 백엔드로 동의 여부 전송
      data.consentChecked = true;

      // 회원가입 API 호출
      const response = await customerRegister(data);

      // 로그인 처리
      await login(response.customer, response.token);

      toast({
        title: '회원가입 성공',
        description: '소셜 계정을 연결하여 더 편리하게 로그인하세요.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/connect-social');
    } catch (error) {
      toast({
        title: '회원가입 실패',
        description: error.message || '회원가입 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 전화번호 자동 포맷
  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    const formatted = formatPhoneNumber(value);
    setValue('phoneNumber', formatted, { shouldValidate: true });
  };

  // 모달에서 동의 완료 시
  const handleConsentComplete = () => {
    setAgreed(true);
  };

  return (
    <Container maxW="container.sm" py={8} bg="white" borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" color="gray.800">
          회원가입
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            {/* 이름 */}
            <FormControl isInvalid={!!errors.name}>
              <FormLabel color="gray.600">이름</FormLabel>
              <Input
                {...register('name')}
                placeholder="이름 입력"
                borderColor="gray.300"
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            {/* 전화번호 */}
            <FormControl isInvalid={!!errors.phoneNumber}>
              <FormLabel color="gray.600">전화번호</FormLabel>
              <Input
                {...register('phoneNumber')}
                placeholder="010-1234-5678"
                onChange={handlePhoneNumberChange}
                borderColor="gray.300"
              />
              <FormErrorMessage>{errors.phoneNumber?.message}</FormErrorMessage>
            </FormControl>

            {/* 이메일 */}
            <FormControl isInvalid={!!errors.email}>
              <FormLabel color="gray.600">이메일</FormLabel>
              <Input
                {...register('email')}
                placeholder="이메일 입력"
                borderColor="gray.300"
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            {/* 비밀번호 */}
            <FormControl isInvalid={!!errors.password}>
              <FormLabel color="gray.600">비밀번호</FormLabel>
              <Input
                type="password"
                {...register('password')}
                placeholder="비밀번호 입력"
                borderColor="gray.300"
              />
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>

            {/* 약관 보기 (모달 열기) */}
            <Text
              color="blue.500"
              textDecoration="underline"
              cursor="pointer"
              onClick={() => setShowConsentModal(true)}
            >
              개인정보 이용 및 서비스 약관
            </Text>

            {/* 회원가입 버튼 */}
            <Button
              colorScheme="teal"
              type="submit"
              mt={4}
              w="full"
              isLoading={isSubmitting}
              loadingText="처리 중..."
            >
              회원가입
            </Button>
          </VStack>
        </form>

        <Text textAlign="center" fontSize="xs" color="gray.500">
          이미 회원이신가요?{' '}
          <Button as={Link} to="/login" variant="link" colorScheme="blue" fontSize="xs">
            로그인
          </Button>
        </Text>
      </VStack>

      {/* 약관 모달 */}
      {showConsentModal && (
        <PrivacyConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onConsentComplete={handleConsentComplete}
        />
      )}
    </Container>
  );
};

export default Register;
