import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
import { fetchHotelList, fetchHotelPhotos } from '../api/api';
import HotelCard from '../components/HotelCard';

const HotelList = ({ loadHotelSettings }) => {
  const { logout, isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [hotels, setHotels] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [exteriorPhotosMap, setExteriorPhotosMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || {};
    setFavorites(storedFavorites);
  }, []);

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setIsLoading(true);
        const hotelList = await fetchHotelList();
        setHotels(hotelList);

        // 인증된 상태에서만 사진 로드
        if (isAuthenticated && customer && localStorage.getItem('customerToken')) {
          console.log('[HotelList] User authenticated, fetching photos');
          console.log('[HotelList] customerToken:', localStorage.getItem('customerToken'));
          const photosPromises = hotelList.map(async (hotel) => {
            try {
              const photosData = await fetchHotelPhotos(hotel.hotelId, 'exterior');
              console.log(`[HotelList] Photos for hotel ${hotel.hotelId}:`, photosData);
              return {
                hotelId: hotel.hotelId,
                exteriorPhotos: photosData.commonPhotos || [],
              };
            } catch (error) {
              console.error(`Failed to fetch exterior photos for hotel ${hotel.hotelId}:`, error);
              // 401 에러 처리
              if (error.status === 401) {
                toast({
                  title: '인증 오류',
                  description: '세션이 만료되었습니다. 다시 로그인해주세요.',
                  status: 'error',
                  duration: 3000,
                  isClosable: true,
                });
                logout();
                navigate('/login');
              }
              return { hotelId: hotel.hotelId, exteriorPhotos: [] };
            }
          });
          const photosResults = await Promise.all(photosPromises);
          const photosMap = photosResults.reduce((acc, { hotelId, exteriorPhotos }) => {
            acc[hotelId] = exteriorPhotos;
            return acc;
          }, {});
          setExteriorPhotosMap(photosMap);
        } else {
          console.warn('[HotelList] User not authenticated or no token, skipping photo fetch');
          setExteriorPhotosMap({});
        }
      } catch (error) {
        toast({
          title: '호텔 목록 로딩 실패',
          description: error.message || '호텔 목록을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadHotels();
  }, [toast, isAuthenticated, customer, logout, navigate]);

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

  if (!isAuthenticated || !customer) {
    console.log('[HotelList] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      <Container maxW="container.sm" py={6} flex="1" display="flex" flexDirection="column">
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
          {isLoading ? (
            <Text textAlign="center" color="gray.500">
              로딩 중...
            </Text>
          ) : hotels.length === 0 ? (
            <Text textAlign="center" color="gray.500">
              등록된 호텔이 없습니다.
            </Text>
          ) : (
            <VStack spacing={4} align="stretch">
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel.hotelId}
                  hotel={{
                    ...hotel,
                    photos: exteriorPhotosMap[hotel.hotelId] || [],
                  }}
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