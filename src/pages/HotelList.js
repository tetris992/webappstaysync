import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  useToast,
  Box,
  Flex,
  Select,
  HStack,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { fetchHotelList, fetchHotelPhotos } from '../api/api';
import HotelCard from '../components/HotelCard';
import pLimit from 'p-limit';

const MotionBox = motion(Box);

// 주소 정규화 함수
const normalizeAddress = (address) => {
  if (!address) return '주소 정보 없음';
  const buildingNamePatterns = [/프라잇베리 진해역점/, /대안빌딩/];
  let normalized = address;
  buildingNamePatterns.forEach((pattern) => {
    normalized = normalized.replace(pattern, '').trim();
  });
  if (normalized === '마디미서로 68') {
    normalized = '창원시 성산구 마디미서로 68';
  }
  if (normalized.startsWith('경남')) {
    normalized = normalized.replace('경남', '경상남도');
  }
  if (normalized.startsWith('창원시') && !normalized.includes('경상남도')) {
    normalized = `경상남도 ${normalized}`;
  }
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
};

const HotelList = ({ loadHotelSettings }) => {
  const { logout, isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const { searchQuery: initialSearchQuery, checkIn, checkOut, guestCount } = location.state || {};

  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [exteriorPhotosMap, setExteriorPhotosMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('name');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || {};
    setFavorites(storedFavorites);
  }, []);

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setIsLoading(true);
        const hotelList = await fetchHotelList();
        console.log('[HotelList] Raw hotel list from HMS server:', hotelList);

        // 각 호텔의 주소와 좌표를 콘솔에 출력
        hotelList.forEach((hotel, index) => {
          console.log(`[HotelList] Hotel ${index + 1}:`, {
            hotelId: hotel.hotelId,
            hotelName: hotel.hotelName,
            address: hotel.address,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
          });
        });

        const hotelsWithRatings = hotelList.map((hotel) => ({
          ...hotel,
          rating: Math.random() * 2 + 3,
          reviewCount: Math.floor(Math.random() * 100) + 10,
          price: Math.floor(Math.random() * 100000) + 50000,
          address: normalizeAddress(hotel.address) || '주소 정보 없음',
          latitude: hotel.latitude || null, // 좌표 보장
          longitude: hotel.longitude || null, // 좌표 보장
        }));
        setHotels(hotelsWithRatings);
        setFilteredHotels(hotelsWithRatings);

        if (isAuthenticated && customer && localStorage.getItem('customerToken')) {
          const limit = pLimit(3);
          const photosPromises = hotelsWithRatings.map((hotel) =>
            limit(async () => {
              try {
                const photosData = await fetchHotelPhotos(hotel.hotelId, 'exterior');
                return { hotelId: hotel.hotelId, exteriorPhotos: photosData.commonPhotos || [] };
              } catch (error) {
                toast({
                  title: '사진 로드 실패',
                  description: '호텔 사진을 불러오지 못했습니다. 기본 이미지를 표시합니다.',
                  status: 'warning',
                  duration: 3000,
                  isClosable: true,
                });
                return { hotelId: hotel.hotelId, exteriorPhotos: [] };
              }
            })
          );
          const photosResults = await Promise.all(photosPromises);
          const photosMap = photosResults.reduce((acc, { hotelId, exteriorPhotos }) => {
            acc[hotelId] = exteriorPhotos;
            return acc;
          }, {});
          setExteriorPhotosMap(photosMap);
        } else {
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
  }, [toast, isAuthenticated, customer, navigate]);

  useEffect(() => {
    let updatedHotels = [...hotels];
    if (searchQuery) {
      updatedHotels = updatedHotels.filter((hotel) =>
        hotel.hotelName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (priceFilter !== 'all') {
      const [minPrice, maxPrice] = priceFilter.split('-').map(Number);
      updatedHotels = updatedHotels.filter((hotel) => {
        const price = hotel.price || 0;
        return price >= minPrice && (maxPrice ? price <= maxPrice : true);
      });
    }
    if (ratingFilter !== 'all') {
      const minRating = Number(ratingFilter);
      updatedHotels = updatedHotels.filter((hotel) => (hotel.rating || 0) >= minRating);
    }
    updatedHotels.sort((a, b) => {
      if (sortOption === 'name') return a.hotelName.localeCompare(b.hotelName);
      if (sortOption === 'priceAsc') return (a.price || 0) - (b.price || 0);
      if (sortOption === 'priceDesc') return (b.price || 0) - (a.price || 0);
      if (sortOption === 'ratingDesc') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
    setFilteredHotels(updatedHotels);
  }, [hotels, sortOption, priceFilter, ratingFilter, searchQuery]);

  const toggleFavorite = (hotelId) => {
    setFavorites((prevFavorites) => {
      const updatedFavorites = { ...prevFavorites, [hotelId]: !prevFavorites[hotelId] };
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      return updatedFavorites;
    });
  };

  const handleNavigate = (hotelId) => {
    loadHotelSettings(hotelId);
    navigate(`/rooms/${hotelId}`, { state: { checkIn, checkOut, guestCount } });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated || !customer) return <Navigate to="/login" replace />;

  return (
    <Box minH="100vh" bg="gray.50" position="relative">
      {/* 상단 헤더 */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        zIndex={1000}
        boxShadow="sm"
      >
        <Container maxW="container.sm" py={{ base: 4, md: 5 }}>
          <VStack spacing={1}>
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="700"
              color="gray.900"
            >
              편안한 후불예약
            </Text>
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="gray.600"
              fontWeight="500"
            >
              간편하게 예약하고 체크인하세요
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* 메인 컨텐츠 */}
      <Box
        pt={{ base: "80px", sm: "90px", md: "100px" }}
        pb={{ base: "60px", md: "70px" }}
        minH="100vh"
        maxH="100vh"
        overflowY="auto"
        position="relative"
        sx={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.200',
            borderRadius: '24px',
          },
        }}
      >
        <Container maxW="container.sm" py={4}>
          <VStack spacing={3} mb={4}>
            <InputGroup w="full">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="호텔 이름 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderColor="gray.300"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #319795' }}
              />
            </InputGroup>
            <HStack spacing={2} w="full" flexWrap="wrap">
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                w={{ base: 'full', md: '30%' }}
                borderColor="gray.300"
              >
                <option value="name">이름순</option>
                <option value="priceAsc">가격 낮은순</option>
                <option value="priceDesc">가격 높은순</option>
                <option value="ratingDesc">평점 높은순</option>
              </Select>
              <Select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                w={{ base: 'full', md: '30%' }}
                borderColor="gray.300"
              >
                <option value="all">모든 가격</option>
                <option value="0-50000">0 ~ 50,000원</option>
                <option value="50000-100000">50,000 ~ 100,000원</option>
                <option value="100000-">100,000원 이상</option>
              </Select>
              <Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                w={{ base: 'full', md: '30%' }}
                borderColor="gray.300"
              >
                <option value="all">모든 평점</option>
                <option value="4">4점 이상</option>
                <option value="3">3점 이상</option>
              </Select>
            </HStack>
          </VStack>

          {isLoading ? (
            <Flex justify="center" align="center" h="200px" flexDirection="column">
              <Spinner size="lg" color="brand.500" thickness="4px" />
              <Text mt={4} color="gray.500">
                호텔 목록을 불러오는 중입니다...
              </Text>
            </Flex>
          ) : filteredHotels.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={4}>
              조건에 맞는 호텔이 없습니다.
            </Text>
          ) : (
            <VStack spacing={4} align="stretch">
              {filteredHotels.map((hotel) => (
                <MotionBox
                  key={hotel.hotelId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <HotelCard
                    hotel={{ ...hotel, photos: exteriorPhotosMap[hotel.hotelId] || [] }}
                    isFavorite={favorites[hotel.hotelId] || false}
                    toggleFavorite={() => toggleFavorite(hotel.hotelId)}
                    onSelect={() => handleNavigate(hotel.hotelId)}
                  />
                </MotionBox>
              ))}
            </VStack>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default HotelList;