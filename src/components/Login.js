import React, { useState } from 'react';
import { Box, VStack, Button, Divider, Text, InputGroup, Input, useToast } from '@chakra-ui/react';
import { FaKakao } from 'react-icons/fa';

const Login = () => {
  // showOTPInput state 제거 (인증번호 입력 화면 전환 방지)
  const toast = useToast();

  // 카카오 로그인 처리
  const handleKakaoLogin = () => {
    // ... 기존 카카오 로그인 로직 ...
  };

  // 전화번호 입력 시도 시 안내 메시지만 표시
  const handlePhoneLoginAttempt = () => {
    toast({
      title: "카카오톡으로 로그인해주세요",
      description: "현재 일반 전화번호 로그인은 준비 중입니다. 카카오톡으로 로그인해주세요.",
      status: "info",
      duration: 5000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* 카카오 로그인 버튼 */}
        <Button
          leftIcon={<FaKakao />}
          onClick={handleKakaoLogin}
          size="lg"
          colorScheme="yellow"
          bg="#FEE500"
          color="#000000"
          _hover={{ bg: "#FDD800" }}
          height="50px"
          fontSize="md"
          fontWeight="bold"
        >
          카카오톡으로 로그인
        </Button>

        <Divider />

        {/* 전화번호 입력 섹션 - 항상 비활성화 상태 유지 */}
        <Box 
          opacity="0.6" 
          cursor="not-allowed"
          position="relative"
        >
          <Text mb={2} fontSize="sm" color="gray.500">
            전화번호 로그인 (준비 중)
          </Text>
          <InputGroup>
            <Input
              placeholder="전화번호를 입력하세요"
              disabled
              _disabled={{ opacity: 0.7, cursor: "not-allowed" }}
              onClick={handlePhoneLoginAttempt}
            />
          </InputGroup>
          
          {/* 인증번호 받기 버튼도 비활성화 상태로 유지 */}
          <Button
            mt={2}
            isDisabled
            width="100%"
            onClick={handlePhoneLoginAttempt}
          >
            인증번호 받기
          </Button>
          
          {/* 안내 메시지 */}
          <Text 
            fontSize="xs" 
            color="gray.500" 
            mt={2}
            textAlign="center"
          >
            ⓘ 현재는 카카오톡 로그인만 사용 가능합니다
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default Login; 