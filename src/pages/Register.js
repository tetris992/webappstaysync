// webapp/src/pages/Register.js
import React from 'react';
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

const schema = yup.object().shape({
  name: yup.string().required('이름은 필수입니다.'),
  phoneNumber: yup
    .string()
    .notRequired()
    .matches(/^\d{10,11}$|^\d{3}-\d{3,4}-\d{4}$/, {
      message: '전화번호는 10~11자리 숫자여야 합니다.',
      excludeEmptyString: true,
    }),
  email: yup
    .string()
    .notRequired()
    .email('유효한 이메일 주소를 입력해주세요.')
    .nullable(),
  password: yup
    .string()
    .required('비밀번호는 필수입니다.')
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다.'),
});

const Register = () => {
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
      // 전화번호, 이메일 미입력 시 기본값 처리
      if (!data.phoneNumber) {
        data.phoneNumber = '01000000000';
      }
      if (!data.email) {
        data.email = `${data.name.replace(/\s/g, '')}@example.com`;
      }
      const response = await customerRegister(data);
      // Mode B: 회원가입 후 받은 token, customer로 로그인 상태 갱신 (백엔드 재요청 없이)
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

  return (
    <Container maxW="container.sm" py={8} bg="white" borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" color="gray.800">
          회원가입
        </Text>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel color="gray.600">이름</FormLabel>
              <Input
                {...register('name')}
                placeholder="이름 입력"
                borderColor="gray.300"
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.phoneNumber}>
              <FormLabel color="gray.600">전화번호 (선택)</FormLabel>
              <Input
                {...register('phoneNumber')}
                placeholder="010-1234-5678"
                onChange={handlePhoneNumberChange}
                borderColor="gray.300"
              />
              <FormErrorMessage>{errors.phoneNumber?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel color="gray.600">이메일 (선택)</FormLabel>
              <Input
                {...register('email')}
                placeholder="이메일 입력"
                borderColor="gray.300"
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

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
    </Container>
  );
};

export default Register;
