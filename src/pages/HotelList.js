import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  useToast,
  Box,
  Flex,
  Select,
  HStack,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { SearchIcon, ArrowBackIcon } from '@chakra-ui/icons';
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
  const { isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const { searchQuery: initialSearchQuery, checkIn, checkOut, guestCount } = location.state || {};
  const { isOpen, onToggle, onClose } = useDisclosure();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [exteriorPhotosMap, setExteriorPhotosMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('name');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  // 스크롤 이벤트를 처리할 ref 생성
  const mainContentRef = React.useRef(null);

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
    
    // 검색어 필터링
    if (searchQuery) {
      updatedHotels = updatedHotels.filter((hotel) =>
        hotel.hotelName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 가격 필터링
    if (priceFilter !== 'all') {
      const [minPrice, maxPrice] = priceFilter.split('-').map(Number);
      updatedHotels = updatedHotels.filter((hotel) => {
        const price = hotel.price || 0;
        return price >= minPrice && (maxPrice ? price <= maxPrice : true);
      });
    }

    // 평점 필터링
    if (ratingFilter !== 'all') {
      const minRating = Number(ratingFilter);
      updatedHotels = updatedHotels.filter((hotel) => (hotel.rating || 0) >= minRating);
    }

    // 즐겨찾기 및 정렬 순서 적용
    updatedHotels.sort((a, b) => {
      // 즐겨찾기 상태 비교 (즐겨찾기된 항목이 먼저 오도록)
      const aFavorite = favorites[a.hotelId] || false;
      const bFavorite = favorites[b.hotelId] || false;
      
      if (aFavorite !== bFavorite) {
        return bFavorite ? 1 : -1;
      }

      // 즐겨찾기 상태가 같은 경우 선택된 정렬 옵션에 따라 정렬
      switch (sortOption) {
        case 'name':
          return a.hotelName.localeCompare(b.hotelName);
        case 'priceAsc':
          return (a.price || 0) - (b.price || 0);
        case 'priceDesc':
          return (b.price || 0) - (a.price || 0);
        case 'ratingDesc':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    setFilteredHotels(updatedHotels);
  }, [hotels, sortOption, priceFilter, ratingFilter, searchQuery, favorites]);

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

  // 본문 영역 스크롤 및 상호작용 핸들러
  const handleMainContentInteraction = useCallback(() => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) return;

    const handleScroll = () => {
      if (isOpen) {
        onClose();
      }
    };

    mainContent.addEventListener('scroll', handleScroll, { passive: true });
    mainContent.addEventListener('touchstart', handleMainContentInteraction, { passive: true });
    mainContent.addEventListener('mousedown', handleMainContentInteraction);

    return () => {
      mainContent.removeEventListener('scroll', handleScroll);
      mainContent.removeEventListener('touchstart', handleMainContentInteraction);
      mainContent.removeEventListener('mousedown', handleMainContentInteraction);
    };
  }, [isOpen, onClose, handleMainContentInteraction]);

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
        boxShadow={isOpen ? "lg" : "sm"}
      >
        <Container maxW="container.sm" py={4}>
          <Flex align="center" justify="space-between">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
            />
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="700"
              color="gray.900"
              textAlign="center"
            >
              편안한 후불예약
            </Text>
            <IconButton
              icon={<SearchIcon />}
              variant="ghost"
              onClick={onToggle}
              aria-label="검색 열기"
              color={isOpen ? "teal.500" : "gray.500"}
            />
          </Flex>

          <Collapse in={isOpen} animateOpacity>
            <VStack spacing={3} mt={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="호텔 이름 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="white"
                  borderColor="gray.300"
                  _hover={{ borderColor: 'teal.500' }}
                  _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
                />
              </InputGroup>

              <HStack spacing={2} w="full" flexWrap="wrap">
                <Select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  w={{ base: 'full', md: '32%' }}
                  borderColor="gray.300"
                  _hover={{ borderColor: 'teal.500' }}
                  _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
                >
                  <option value="name">이름순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="ratingDesc">평점 높은순</option>
                </Select>
                <Select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  w={{ base: 'full', md: '32%' }}
                  borderColor="gray.300"
                  _hover={{ borderColor: 'teal.500' }}
                  _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
                >
                  <option value="all">모든 가격</option>
                  <option value="0-50000">5만원 이하</option>
                  <option value="50000-100000">5-10만원</option>
                  <option value="100000-150000">10-15만원</option>
                  <option value="150000-">15만원 이상</option>
                </Select>
                <Select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  w={{ base: 'full', md: '32%' }}
                  borderColor="gray.300"
                  _hover={{ borderColor: 'teal.500' }}
                  _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
                >
                  <option value="all">모든 평점</option>
                  <option value="4.5">4.5점 이상</option>
                  <option value="4">4점 이상</option>
                  <option value="3.5">3.5점 이상</option>
                </Select>
              </HStack>
            </VStack>
          </Collapse>
        </Container>
      </Box>

      {/* 메인 컨텐츠 */}
      <Box
        ref={mainContentRef}
        pt={isOpen ? "200px" : "80px"}
        pb={{ base: "60px", md: "70px" }}
        minH="100vh"
        maxH="100vh"
        overflowY="auto"
        position="relative"
        onClick={handleMainContentInteraction}
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
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Container maxW="container.sm" py={4}>
          {isLoading ? (
            <Flex justify="center" align="center" h="200px" flexDirection="column">
              <Spinner size="lg" color="teal.500" thickness="4px" />
              <Text mt={4} color="gray.500">
                호텔 목록을 불러오는 중입니다...
              </Text>
            </Flex>
          ) : filteredHotels.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={4}>
              조건에 맞는 호텔이 없습니다.
            </Text>
          ) : (
            <VStack spacing={4} align="stretch" pb={20}>
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