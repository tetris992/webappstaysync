import React from 'react';
import { Container, VStack, Text, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { customer } = useAuth();

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6}>
        <Text fontSize="3xl" fontWeight="bold" color="teal.600">
          반갑습니다!
        </Text>
        <Text color="gray.600" textAlign="center">
          간편하게 호텔을 예약하고<br/>내 예약 정보를 확인해 보세요.
        </Text>
        <Button
          colorScheme="blue"
          onClick={() => navigate('/hotels')}
          w="full"
        >
          호텔 목록 보기
        </Button>
        <Button
          colorScheme="green"
          onClick={() => navigate('/history')}
          w="full"
        >
          나의 예약 보기
        </Button>
        {!customer && (
          <Button
            colorScheme="teal"
            variant="outline"
            onClick={() => navigate('/login')}
            w="full"
          >
            로그인 / 회원가입
          </Button>
        )}
      </VStack>
    </Container>
  );
};

export default Home;
