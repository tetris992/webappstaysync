import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import {
  Flex,
  Box,
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
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
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

  const onSubmit = async (data) => {
    try {
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
      if (!data.phoneNumber) {
        data.phoneNumber = '01000000000';
      }
      if (!data.email) {
        data.email = `${data.name.replace(/\s/g, '')}@example.com`;
      }
      data.consentChecked = true;

      const response = await customerRegister(data);
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

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    const formatted = formatPhoneNumber(value);
    setValue('phoneNumber', formatted, { shouldValidate: true });
  };

  const handleConsentComplete = () => {
    setAgreed(true);
  };

  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      minH="100vh"
      px={{ base: 3, md: 4 }} // Reduced padding
    >
      <Box
        w={{ base: '95%', sm: '85%', md: 'sm' }} // Fluid width
        p={{ base: 4, md: 5 }} // Reduced padding
        bg="white"
        borderRadius="lg"
        boxShadow="md"
      >
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            textAlign="center"
          >
            회원가입
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={2}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>이름</FormLabel>
                <Input {...register('name')} placeholder="이름 입력" />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.phoneNumber}>
                <FormLabel>전화번호</FormLabel>
                <Input
                  {...register('phoneNumber')}
                  placeholder="010-1234-5678"
                  onChange={handlePhoneNumberChange}
                />
                <FormErrorMessage>{errors.phoneNumber?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel>이메일</FormLabel>
                <Input {...register('email')} placeholder="이메일 입력" />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>비밀번호</FormLabel>
                <Input
                  type="password"
                  {...register('password')}
                  placeholder="비밀번호 입력"
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Text
                color="blue.500"
                textDecoration="underline"
                cursor="pointer"
                onClick={() => setShowConsentModal(true)}
              >
                개인정보 이용 및 서비스 약관
              </Text>

              <Button
                variant="solid"
                type="submit"
                w="full"
                isLoading={isSubmitting}
                loadingText="처리 중..."
                size="md"
              >
                회원가입
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" fontSize="xs">
            이미 회원이신가요?{' '}
            <Button as={Link} to="/login" variant="link" fontSize="xs">
              로그인
            </Button>
          </Text>
        </VStack>
      </Box>

      {showConsentModal && (
        <PrivacyConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onConsentComplete={handleConsentComplete}
        />
      )}
    </Flex>
  );
};

export default Register;