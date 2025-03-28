// webApp/src/pages/HotelList.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, VStack, Text, Button, useToast } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext'; // 경로 수정
import { fetchHotelList } from '../api/api';
import HotelCard from '../components/HotelCard';

const HotelList = ({ loadHotelSettings }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelList = await fetchHotelList();
        setHotels(hotelList);
      } catch (error) {
        toast({
          title: '호텔 목록 로딩 실패',
          description: error.message || '호텔 목록을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    loadHotels();
  }, [toast]);

  const handleNavigate = (hotelId) => {
    loadHotelSettings(hotelId);
    navigate(`/rooms/${hotelId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container
      maxW="container.sm"
      py={8}
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      sx={{
        '@media (max-width: 480px)': {
          padding: '16px',
        },
        '@media (max-width: 768px)': {
          padding: '20px',
        },
      }}
    >
      <VStack spacing={6} align="stretch">
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="bold"
          color="gray.800"
          textAlign="center"
        >
          호텔 목록
        </Text>
        {hotels.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            등록된 호텔이 없습니다.
          </Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.hotelId}
                hotel={hotel}
                onSelect={() => handleNavigate(hotel.hotelId)}
              />
            ))}
          </VStack>
        )}
        <Button
          colorScheme="teal"
          variant="outline"
          onClick={() => navigate('/history')}
          w="full"
          borderRadius="md"
        >
          예약 내역
        </Button>
        <Button
          colorScheme="red"
          variant="outline"
          onClick={handleLogout}
          w="full"
          borderRadius="md"
        >
          로그아웃
        </Button>
      </VStack>
    </Container>
  );
};

export default HotelList;
