// webapp/src/pages/Home.js
import React from 'react';
import { Container, VStack, Text, Button, Box, Image } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { customer, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, white, gray.100)" // 흰색에서 회색으로 부드러운 그라데이션
      position="relative"
      overflow="hidden"
    >
      {/* 배경 이미지 */}
      <Image
        src="/assets/welcome-team.jpg" // 제공된 이미지를 assets 폴더에 저장 후 경로 지정
        alt="Welcome Team"
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        objectFit="cover"
        opacity={0.3} // 이미지 투명도 조정으로 콘텐츠 가독성 확보
        zIndex={0}
      />

      {/* 콘텐츠 */}
      <Container
        maxW="container.md"
        py={6}
        minH="100vh"
        display="flex"
        flexDirection="column"
        position="relative"
        zIndex={1}
      >
        <Box textAlign="center" mb={4}>
          <Text
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="bold"
            color="gray.800"
            textShadow="0 2px 4px rgba(0, 0, 0, 0.1)" // 부드러운 조명 효과
          >
            단잠 호텔 예약
          </Text>
        </Box>

        <VStack spacing={6} flex="1" justifyContent="center" align="center">
          <Text
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="bold"
            textAlign="center"
            color="gray.800"
            textShadow="0 2px 4px rgba(0, 0, 0, 0.1)" // 부드러운 조명 효과
          >
            반갑습니다{customer ? `, ${customer.name}님` : ''}!
          </Text>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            textAlign="center"
            color="gray.600"
          >
            간편하게 호텔을 예약하고
            <br />내 예약 정보를 확인해 보세요.
          </Text>
          <Button
            colorScheme="teal"
            bg="teal.500"
            _hover={{ bg: 'teal.600' }}
            onClick={() => navigate('/hotels')}
            w="full"
            size="lg"
            boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)" // 부드러운 그림자 효과
          >
            호텔 목록 보기
          </Button>
          <Button
            colorScheme="teal"
            bg="teal.400"
            _hover={{ bg: 'teal.500' }}
            onClick={() => navigate('/history')}
            w="full"
            size="lg"
            boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)" // 부드러운 그림자 효과
          >
            나의 예약 보기
          </Button>
          {!customer ? (
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={() => navigate('/login')}
              w="full"
              size="lg"
              color="teal.500"
              borderColor="teal.500"
              _hover={{ bg: 'teal.50' }}
              boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)" // 부드러운 그림자 효과
            >
              로그인 / 회원가입
            </Button>
          ) : (
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleLogout}
              w="full"
              size="lg"
              color="red.500"
              borderColor="red.500"
              _hover={{ bg: 'red.50' }}
              boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)" // 부드러운 그림자 효과
            >
              로그아웃
            </Button>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Home;
