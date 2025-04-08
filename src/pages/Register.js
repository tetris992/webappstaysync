// src/pages/Register.js
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
  Icon,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { customerRegister, checkDuplicate } from '../api/api';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';
import PrivacyConsentModal from '../components/PrivacyConsentModal';

const schema = yup.object().shape({
  name: yup.string().required('이름은 필수입니다.'),
  phoneNumber: yup
    .string()
    .matches(
      /^\d{10,11}$|^\d{3}-\d{3,4}-\d{4}$/,
      '전화번호는 10~11자리 숫자여야 합니다.'
    )
    .nullable(),
  email: yup.string().email('유효한 이메일 주소를 입력해주세요.').nullable(),
  password: yup
    .string()
    .required('비밀번호는 필수입니다.')
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다.'),
});

const Register = () => {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [agreements, setAgreements] = useState(null); // 동의 항목 저장
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false); // 중복 체크 상태

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
      // 1. 클라이언트 측 입력값 검증은 이미 yup 스키마를 통해 완료됨 (errors 객체로 확인 가능)

      // 2. 중복 체크 수행
      setIsCheckingDuplicate(true);
      const { phoneNumber, email } = data;
      const duplicateCheck = await checkDuplicate(phoneNumber, email);

      if (duplicateCheck.isDuplicate) {
        const errorMessages = [];
        if (duplicateCheck.details.phoneNumber) {
          errorMessages.push(duplicateCheck.details.phoneNumber);
        }
        if (duplicateCheck.details.email) {
          errorMessages.push(duplicateCheck.details.email);
        }
        toast({
          title: '회원가입 실패',
          description: errorMessages.join(' '),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return; // 중복이 있으면 여기서 중단
      }

      // 3. 중복이 없으면 동의 모달 열기
      if (!agreements) {
        setShowConsentModal(true);
        return;
      }

      // 4. 동의 항목 확인
      if (!agreements.terms || !agreements.privacy) {
        toast({
          title: '동의 필요',
          description: '필수 약관에 동의하셔야 회원가입이 가능합니다.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // 5. 회원가입 데이터 준비
      if (!data.phoneNumber) {
        data.phoneNumber = '01000000000';
      }
      if (!data.email) {
        data.email = `${data.name.replace(/\s/g, '')}@example.com`;
      }

      data.agreements = {
        terms: agreements.terms,
        privacy: agreements.privacy,
        marketing: agreements.marketing || false,
      };

      console.log('[Register.js] Submitting customer data:', data);

      // 6. 회원가입 요청
      const response = await customerRegister(data);
      await login(response.customer, response.token);
      toast({
        title: '회원가입 성공',
        description: '소셜 계정을 연결하여 더 편리하게 로그인하세요.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/social-login');
    } catch (error) {
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      if (error.status === 400 && error.details) {
        const details = error.details;
        if (details.terms || details.privacy) {
          errorMessage = '필수 약관에 동의해야 합니다.';
        }
      } else if (error.status === 404) {
        errorMessage =
          '중복 체크 API를 찾을 수 없습니다. 서버 설정을 확인해주세요.';
      } else if (error.status === 409) {
        const details = error.details || {};
        const errorMessages = [];
        if (details.phoneNumber) {
          errorMessages.push(details.phoneNumber);
        }
        if (details.email) {
          errorMessages.push(details.email);
        }
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join(' ');
        } else {
          errorMessage =
            error.message || '이미 가입된 전화번호 또는 이메일입니다.';
        }
      } else if (error.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else {
        errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      }
      toast({
        title: '회원가입 실패',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    const formatted = formatPhoneNumber(value);
    setValue('phoneNumber', formatted, { shouldValidate: true });
  };

  const handleConsentComplete = (agreementsData) => {
    console.log('[Register.js] Consent completed with data:', agreementsData);
    setAgreements(agreementsData); // 동의 항목 저장
    setShowConsentModal(false);
    // 동의 완료 후 바로 회원가입 폼 제출
    handleSubmit(onSubmit)();
  };

  const handleConsentClick = () => {
    // 동의 완료 상태라면 모달을 열지 않음
    if (agreements && agreements.terms && agreements.privacy) {
      return;
    }
    setShowConsentModal(true);
  };

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
        p={{ base: 4, md: 5 }}
        bg="white"
        borderRadius="lg"
        boxShadow="md"
      >
        <VStack spacing={{ base: 4, md: 5 }} align="stretch">
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            textAlign="center"
          >
            회원가입
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
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
                <FormErrorMessage>
                  {errors.phoneNumber?.message}
                </FormErrorMessage>
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

              <Flex align="center">
                {agreements && agreements.terms && agreements.privacy && (
                  <Icon as={CheckIcon} color="green.500" mr={2} />
                )}
                <Text
                  color={
                    agreements && agreements.terms && agreements.privacy
                      ? 'green.500'
                      : 'blue.500'
                  }
                  textDecoration={
                    agreements && agreements.terms && agreements.privacy
                      ? 'none'
                      : 'underline'
                  }
                  cursor={
                    agreements && agreements.terms && agreements.privacy
                      ? 'default'
                      : 'pointer'
                  }
                  mt={{ base: 6, md: 8 }}
                  onClick={handleConsentClick}
                >
                  {agreements && agreements.terms && agreements.privacy
                    ? '개인정보 이용 및 서비스 약관에 동의함'
                    : '개인정보 이용 및 서비스 약관'}
                </Text>
              </Flex>
              <Button
                variant="solid"
                type="submit"
                w="full"
                isLoading={isSubmitting || isCheckingDuplicate}
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
