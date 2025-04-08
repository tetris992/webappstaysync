import React from 'react';
import { Container, VStack, Text, Button, Box, Image, Divider } from '@chakra-ui/react';
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
      bg="white"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Container
        maxW="container.sm"
        py={{ base: 3, md: 4 }} // Match padding with UnifiedLogin.js
        minH="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <VStack spacing={{ base: 3, md: 4 }} flex="1" justifyContent="center" align="center">
          {/* Title - Larger size */}
          <Text
            fontSize={{ base: '2xl', md: '3xl' }} // Increased size: 2xl (24px) on base, 3xl (30px) on md
            fontWeight="bold"
            textAlign="center"
            color="gray.800"
          >
            단잠: 간편한 후불예약😴
          </Text>
          <Divider />

          {/* Flower Image - Match button width */}
          <Image
            src="/assets/welcome-team.jpeg"
            alt="Welcome Image"
            w={{ base: '90%', sm: '80%', md: 'sm' }} // Match button width
            h={{ base: '250px', md: '300px' }} // Maintain aspect ratio
            objectFit="cover"
            borderRadius="md"
            opacity={0.8}
          />
                      <Divider />

          {/* Greeting */}
          <Text
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="bold"
            textAlign="center"
            color="gray.800"
          >
            반갑습니다{customer ? `, ${customer.name}님` : ''}😍
            
          </Text>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            textAlign="center"
            color="gray.600"
            mb={{ base: 6, md: 8 }} // Increased spacing below the text
          >
            간편하게 호텔을 예약하고
            <br />내 예약 정보를 확인해 보세요.
            
          </Text>

          <Button
            variant="homeButton" // New variant: white background, black text, border by default
            onClick={() => navigate('/hotels')}
            w={{ base: '90%', sm: '80%', md: 'sm' }} // Match width with UnifiedLogin.js
            size="md"
          >
            호텔 목록 보기
          </Button>
          <Button
            variant="homeButtonSecondary" // New variant with lighter brand color on hover
            onClick={() => navigate('/history')}
            w={{ base: '90%', sm: '80%', md: 'sm' }}
            size="md"
          >
            나의 예약 보기
          </Button>
          {!customer ? (
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              w={{ base: '90%', sm: '80%', md: 'sm' }}
              size="md"
              color="brand.500"
              borderColor="brand.500"
            >
              로그인 / 회원가입
            </Button>
            
          ) : (
            
            <Button
              variant="outline"
              onClick={handleLogout}
              w={{ base: '90%', sm: '80%', md: 'sm' }}
              size="md"
              color="red.400"
              borderColor="red.200"
              _hover={{ bg: 'red.50' }}
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