import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  Select,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { checkDuplicate, registerCustomer, updateCustomer } from '../api/api';
import { formatPhoneNumber } from '../utils/formatPhoneNumber';

// yup 스키마 정의
const schema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required('전화번호는 필수입니다.')
    .matches(
      /^\d{10,11}$|^\d{3}-\d{3,4}-\d{4}$/,
      '전화번호는 10~11자리 숫자여야 합니다.'
    ),
  nickname: yup
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .nullable(),
  email: yup.string().email('유효한 이메일 주소를 입력해주세요.').nullable(),
  ageRange: yup.string().nullable(),
  name: yup.string().nullable(),
});

const Register = () => {
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  // 수정 모드 여부 및 기존 회원정보는 location.state에서 받아오며,
  // useMemo로 감싸서 불필요한 재생성을 막음
  const isEditMode = location.state?.isEditMode || false;
  const userProfile = useMemo(() => location.state?.userProfile || {}, [location.state]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // 수정 모드일 경우, 기존 회원정보를 폼에 주입
  useEffect(() => {
    if (isEditMode && userProfile) {
      setValue('phoneNumber', userProfile.phoneNumber || '');
      setValue('nickname', userProfile.nickname || '');
      setValue('email', userProfile.email || '');
      setValue('ageRange', userProfile.ageRange || '');
      setValue('name', userProfile.name || '');
    }
  }, [isEditMode, userProfile, setValue]);

  const onSubmit = async (data, event) => {
    event.preventDefault();
    if (isSubmitting || isCheckingDuplicate) return;

    try {
      if (isEditMode) {
        // 수정 모드: 회원정보 수정 API 호출
        await updateCustomer({
          phoneNumber: data.phoneNumber,
          email: data.email,
          nickname: data.nickname,
          ageRange: data.ageRange,
          name: data.name,
        });
        toast({
          title: '수정 완료',
          description: '회원정보가 성공적으로 수정되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/'); // 수정 후 적절한 페이지로 이동
      } else {
        // 회원가입 모드: 중복 체크 후 registerCustomer 호출
        setIsCheckingDuplicate(true);
        const duplicateCheck = await checkDuplicate({
          phoneNumber: data.phoneNumber,
          email: data.email || null,
          nickname: data.nickname || null,
        });

        if (duplicateCheck.isDuplicate) {
          const errorMessages = [];
          if (duplicateCheck.details.nickname) {
            errorMessages.push(duplicateCheck.details.nickname);
          }
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
          return;
        }

        // API 호출 결과에서 바로 customerId 추출하여 사용
        const { customerId } = await registerCustomer({
          phoneNumber: data.phoneNumber,
          email: data.email || null,
          nickname: data.nickname || null,
          ageRange: data.ageRange || null,
          name: data.name || null,
        });

        if (!customerId) {
          throw new Error('customerId가 응답에 포함되지 않았습니다.');
        }
        // 회원가입 완료 후 약관 동의 페이지로 이동 (customerId 포함)
        navigate('/consent', { state: { formData: { ...data, customerId } } });
      }
    } catch (error) {
      let errorMessage = '처리 중 오류가 발생했습니다.';
      if (error.status === 404) {
        errorMessage = 'API를 찾을 수 없습니다. 서버 설정을 확인해주세요.';
      } else if (error.status === 409) {
        const details = error.details || {};
        const errorMessages = [];
        if (details.nickname) errorMessages.push(details.nickname);
        if (details.phoneNumber) errorMessages.push(details.phoneNumber);
        if (details.email) errorMessages.push(details.email);
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join(' ');
        } else {
          errorMessage =
            error.message || '이미 가입된 닉네임, 전화번호 또는 이메일입니다.';
        }
      } else if (error.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else {
        errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      }
      toast({
        title: '오류',
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

  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      minH="100vh"
      px={{ base: 3, md: 4 }}
      bg="gray.50"
    >
      <Box
        w={{ base: '95%', sm: '85%', md: 'sm' }}
        p={{ base: 4, md: 5 }}
        bg="white"
        borderRadius="lg"
        boxShadow="md"
      >
        <VStack spacing={{ base: 8, md: 10 }} align="stretch">
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            textAlign="center"
            color="teal.500"
          >
            {isEditMode ? '회원정보 수정' : '회원가입'}
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={{ base: 6, md: 8 }} align="stretch">
              <FormControl isInvalid={!!errors.phoneNumber}>
                <FormLabel>전화번호 (필수)</FormLabel>
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

              <Box w="full">
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="bold">
                    선택 항목
                  </Text>
                  <IconButton
                    icon={showOptionalFields ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                    size="sm"
                    variant="ghost"
                  />
                </Flex>
                <Collapse in={showOptionalFields} animateOpacity>
                  <VStack spacing={{ base: 4, md: 6 }} mt={2} w="full">
                    <FormControl isInvalid={!!errors.nickname}>
                      <FormLabel>닉네임 (선택)</FormLabel>
                      <Input {...register('nickname')} placeholder="닉네임 입력" w="full" />
                      <FormErrorMessage>{errors.nickname?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.email}>
                      <FormLabel>이메일 (선택)</FormLabel>
                      <Input {...register('email')} placeholder="이메일 입력" w="full" />
                      <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel>연령대 (선택)</FormLabel>
                      <Select {...register('ageRange')} placeholder="연령대 선택" w="full">
                        <option value="10대">10대</option>
                        <option value="20대">20대</option>
                        <option value="30대">30대</option>
                        <option value="40대">40대</option>
                        <option value="50대 이상">50대 이상</option>
                      </Select>
                    </FormControl>

                    <FormControl isInvalid={!!errors.name}>
                      <FormLabel>이름 (선택)</FormLabel>
                      <Input {...register('name')} placeholder="이름 입력" w="full" />
                      <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                    </FormControl>
                  </VStack>
                </Collapse>
              </Box>

              <Button
                colorScheme="teal"
                type="submit"
                w="full"
                isLoading={isSubmitting || isCheckingDuplicate}
                loadingText="처리 중..."
                size="md"
              >
                {isEditMode ? '수정하기' : '다음 (약관동의)'}
              </Button>
            </VStack>
          </form>

          {!isEditMode && (
            <Text textAlign="center" fontSize="xs">
              이미 회원이신가요?{' '}
              <Button as={Link} to="/login" variant="link" fontSize="xs" color="teal.500">
                로그인
              </Button>
            </Text>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

export default Register;
