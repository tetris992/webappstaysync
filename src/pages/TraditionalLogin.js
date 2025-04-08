import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import {
  Flex, Box, VStack, Text, FormControl, FormLabel, FormErrorMessage,
  Input, Button, Divider, useToast,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { customerLogin } from '../api/api';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';

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

const TraditionalLogin = () => {
  const { login, customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (customer) navigate('/');
  }, [customer, navigate]);

  const onSubmit = async (data) => {
    try {
      const response = await customerLogin({
        phoneNumber: data.phoneNumber,
        password: data.password,
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

  if (customer) return null;

  return (
    <Flex direction="column" justify="center" align="center" minH="100vh" px={{ base: 3, md: 4 }}>
      <Box w={{ base: '95%', sm: '85%', md: 'sm' }} p={{ base: 3, md: 4 }} bg="white" borderRadius="lg" boxShadow="md">
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          <Text fontSize={{ base: '2xl', md: '2xl' }} fontWeight="bold" textAlign="center" mb={{ base: 6, md: 8 }}>
            단잠: 편안한 숙박예약
          </Text>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={2}>
              <FormControl isInvalid={!!errors.phoneNumber}>
                <FormLabel>전화번호</FormLabel>
                <Input {...register('phoneNumber')} placeholder="010-1234-5678" onChange={handlePhoneNumberChange} w="full" />
                <FormErrorMessage>{errors.phoneNumber?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.password}>
                <FormLabel>비밀번호</FormLabel>
                <Input type="password" {...register('password')} placeholder="비밀번호 입력" w="full" />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>
              <Button variant="solid" type="submit" w="full" isLoading={isSubmitting} loadingText="처리 중..." size="md">
                로그인
              </Button>
            </VStack>
          </form>
          <Text textAlign="center" fontSize="sm">
            회원이 아니신가요? <Button as={Link} to="/register" variant="link" fontSize="sm">회원가입</Button>
          </Text>
          <Divider />
          <Text textAlign="center" fontSize="sm" my={{ base: 6, md: 8 }}>
            OR
          </Text>
          <Button as={Link} to="/social-login" variant="outline" w="full" size="md">
            소셜 로그인으로 계속하기
          </Button>
          <Text textAlign="center" fontSize="xs" mt={{ base: 6, md: 8 }}>
            이용약관 | <Button as={Link} to="/privacy" variant="link" fontSize="xs">개인정보처리방침</Button>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default TraditionalLogin;