// pages/CompleteProfile.js
import React, { useState } from 'react';
import { Box, Input, Button, VStack, Text, useToast } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateCustomer } from '../api/api';

export default function CompleteProfile() {
  const { customer, setCustomer } = useAuth();
  const { state } = useLocation();
  const initial = state?.customer || customer || {};
  const [nickname, setNickname] = useState(initial.nickname || '');
  const [name, setName] = useState(initial.name || '');
  const toast = useToast();
  const navigate = useNavigate();

  console.log('[CompleteProfile] useAuth context:', { customer, setCustomer });
  console.log('[CompleteProfile] Is setCustomer a function?', typeof setCustomer === 'function');

  const handleSubmit = async () => {
    if (!nickname.trim() || !name.trim()) {
      return toast({
        title: '이름과 닉네임을 모두 입력해주세요.',
        status: 'warning',
        duration: 3000,
      });
    }
    try {
      console.log('[CompleteProfile] Calling updateCustomer with:', { name, nickname });
      const response = await updateCustomer({ name, nickname });
      console.log('[CompleteProfile] updateCustomer response:', response);
      const { customer: savedCustomer } = response;
      if (typeof setCustomer !== 'function') {
        throw new Error('setCustomer is not a function');
      }
      // 1) Context에 반영
      setCustomer(savedCustomer);
      // 2) 로컬 스토리지에도 반영
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
        <Text fontSize="lg">프로필 정보를 입력해주세요</Text>
        <Input
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <Button colorScheme="blue" w="full" onClick={handleSubmit}>
          완료
        </Button>
      </VStack>
    </Box>
  );
}