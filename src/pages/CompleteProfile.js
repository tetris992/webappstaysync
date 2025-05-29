// src/pages/CompleteProfile.js
import React, { useState } from 'react';
import { Box, Input, Button, VStack, Text, useToast } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateCustomer } from '../api/api';

export default function CompleteProfile() {
  const { customer, setCustomer } = useAuth();
  const { state } = useLocation();
  const initial = state?.customer || customer || {};
  const defaultNickname = '카카오 사용자';
  const isSocial = customer?.isSocialLogin;

  const [name, setName] = useState(initial.name || '');
  const [nickname, setNickname] = useState(
    initial.nickname || (isSocial ? defaultNickname : '')
  );

  const toast = useToast();
  const navigate = useNavigate();

  // 버튼 활성화 여부:
  //  • 이름은 항상 필수
  //  • 소셜 로그인 유저라면 닉네임은 건너뛸 수 있음
  const canSubmit =
    name.trim().length > 0 && (isSocial ? true : nickname.trim().length > 0);

  const handleSubmit = async () => {
    // 이름 검증
    if (!name.trim()) {
      return toast({
        title: '이름을 입력해주세요.',
        status: 'warning',
        duration: 3000,
      });
    }
    // 닉네임 검증 (소셜 로그인 아닐 때만)
    if (!isSocial && !nickname.trim()) {
      return toast({
        title: '닉네임을 입력해주세요.',
        status: 'warning',
        duration: 3000,
      });
    }

    try {
      // 서버에 보낼 페이로드:
      //  • 항상 name
      //  • nickname은 소셜 로그인 유저이면서 기본값을 그대로 뒀다면 생략
      const payload = { name: name.trim() };
      if (!isSocial || nickname.trim() !== defaultNickname) {
        payload.nickname = nickname.trim();
      }

      const response = await updateCustomer(payload);
      const { customer: savedCustomer } = response;

      // Context와 로컬스토리지 갱신
      setCustomer(savedCustomer);
      localStorage.setItem('customer', JSON.stringify(savedCustomer));

      toast({
        title: '프로필 업데이트 완료!',
        status: 'success',
        duration: 3000,
      });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[CompleteProfile] updateCustomer error:', err);
      toast({
        title: '업데이트 실패',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      p={6}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={4} w="100%" maxW="320px">
        <Text fontSize="lg">이름이나 닉네임을 입력해주세요</Text>

        <Input
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* 소셜 로그인 유저인 경우에는 숨기고, 필요 시 코드로만 바꿀 수 있게 */}
        {!isSocial && (
          <Input
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        )}

        <Button
          colorScheme="blue"
          w="full"
          onClick={handleSubmit}
          isDisabled={!canSubmit}
        >
          완료
        </Button>
      </VStack>
    </Box>
  );
}