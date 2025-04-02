import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  useToast,
  Box,
  Flex,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchHotelList } from '../api/api';
import HotelCard from '../components/HotelCard';

const HotelList = ({ loadHotelSettings }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [hotels, setHotels] = useState([]);
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || {};
    setFavorites(storedFavorites);
  }, []);

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

  const toggleFavorite = (hotelId) => {
    setFavorites((prevFavorites) => {
      const updatedFavorites = {
        ...prevFavorites,
        [hotelId]: !prevFavorites[hotelId],
      };
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      return updatedFavorites;
    });
  };

  const handleNavigate = (hotelId) => {
    loadHotelSettings(hotelId);
    navigate(`/rooms/${hotelId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      <Container
        maxW="container.sm"
        py={6}
        flex="1"
        display="flex"
        flexDirection="column"
      >
        <Box>
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color="gray.800"
            textAlign="center"
            mb={4}
          >
            호텔 목록
          </Text>
        </Box>

        <Box
          flex="1"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
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
                  isFavorite={favorites[hotel.hotelId] || false}
                  toggleFavorite={() => toggleFavorite(hotel.hotelId)}
                  onSelect={() => handleNavigate(hotel.hotelId)}
                />
              ))}
            </VStack>
          )}
        </Box>

        <Box mt={4}>
          <VStack spacing={2}>
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={() => navigate('/history')}
              w="full"
              size="md"
            >
              예약 내역
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleLogout}
              w="full"
              size="md"
            >
              로그아웃
            </Button>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default HotelList;
