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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
  Badge,
  Icon,
  Button,
  IconButton as ChakraIconButton,
  Tooltip,
} from '@chakra-ui/react';
import { SearchIcon, ArrowBackIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaHeart, FaRegHeart, FaTag, FaMapMarkerAlt, FaWifi, FaParking, FaTv } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchHotelList,
  fetchHotelPhotos,
  fetchCustomerHotelSettings,
} from '../api/api';
import BottomNavigation from '../components/BottomNavigation';
import pLimit from 'p-limit';
import { format, addDays } from 'date-fns';

// Map 컴포넌트 추가
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
};

const Map = ({ address, latitude, longitude, onCoordinatesChange = () => {} }) => {
  const [position, setPosition] = useState([37.5665, 126.978]); // Default: Seoul
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  console.log('[Map] Received props:', { address, latitude, longitude });

  // 주소 정규화 함수
  const normalizeAddress = (address) => {
    if (!address) return null;
    let normalized = address.trim();

    const provinceMap = {
      창원시: '경상남도',
      부산: '부산광역시',
      서울: '서울특별시',
      대구: '대구광역시',
      인천: '인천광역시',
      광주: '광주광역시',
      대전: '대전광역시',
      울산: '울산광역시',
      세종: '세종특별자치시',
    };

    const cityMatch = Object.keys(provinceMap).find((city) => normalized.includes(city));
    if (cityMatch && !normalized.includes(provinceMap[cityMatch])) {
      normalized = `${provinceMap[cityMatch]} ${normalized}`;
    }

    const cityMap = {
      창원시: 'Changwon-si',
      성산구: 'Seongsan-gu',
      마디미서로: 'Madimi-seoro',
      부산광역시: 'Busan',
      서울특별시: 'Seoul',
      대구광역시: 'Daegu',
      인천광역시: 'Incheon',
      광주광역시: 'Gwangju',
      대전광역시: 'Daejeon',
      울산광역시: 'Ulsan',
      세종특별자치시: 'Sejong',
    };

    Object.keys(cityMap).forEach((key) => {
      normalized = normalized.replace(key, cityMap[key]);
    });

    normalized = normalized.replace(/로\s/g, ' Road ').replace(/길\s/g, ' Street ');
    normalized = normalized.replace(/\s\d+번지/g, '');
    normalized = normalized.replace(/,\s*/g, ' ');

    return normalized;
  };

  // openTMap 함수를 useCallback으로 감싸기
  const openTMap = useCallback((latitude, longitude, name) => {
    if (!latitude || !longitude) {
      toast({
        title: '좌표 정보 없음',
        description: '호텔 좌표를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tmapUrl = `tmap://route?goalx=${longitude}&goaly=${latitude}&name=${encodeURIComponent(name || '호텔')}`;
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
      } else if (isIOS) {
        window.location.href = 'https://apps.apple.com/kr/app/tmap/id431589174';
      } else {
        toast({
          title: 'T맵 설치 필요',
          description: 'T맵 앱이 설치되어 있지 않습니다. 설치 페이지로 이동합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 2000);
  }, [toast]);

  useEffect(() => {
    const fetchCoordinates = async () => {
      console.log('[Map] Starting fetchCoordinates with:', { latitude, longitude, address });

      // 좌표가 제공된 경우 우선 사용
      if (latitude && longitude) {
        const newPosition = [latitude, longitude];
        console.log('[Map] Using provided coordinates:', newPosition);
        setPosition(newPosition);
        if (typeof onCoordinatesChange === 'function') {
          onCoordinatesChange({ lat: latitude, lng: longitude });
        }
        setError(null);
        setLoading(false);
        return;
      }

      // 좌표가 없고 주소가 없는 경우
      if (!address) {
        console.log('[Map] No address provided, setting error');
        setError('주소가 제공되지 않았습니다.');
        setLoading(false);
        openTMap(latitude, longitude, address);
        return;
      }

      // 주소 기반 좌표 조회
      try {
        setLoading(true);
        const normalizedAddress = normalizeAddress(address);
        console.log('[Map] Normalized address:', normalizedAddress);

        let data = [];
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedAddress)}`,
            {
              headers: {
                'User-Agent': 'DanjamApp/0.1.0 (nomac74@example.com)',
              },
            }
          );
          data = await response.json();
          console.log('[Map] Nominatim API response:', data);
        } catch (error) {
          console.error('[Map] Nominatim API failed:', error);
        }

        if (data && data.length > 0) {
          const newPosition = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          console.log('[Map] Using Nominatim coordinates:', newPosition);
          setPosition(newPosition);
          if (typeof onCoordinatesChange === 'function') {
            onCoordinatesChange({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          }
          setError(null);
        } else {
          console.log('[Map] No coordinates found for address:', address);
          setError(`해당 주소의 좌표를 찾을 수 없습니다: ${address}`);
          openTMap(latitude, longitude, address);
        }
      } catch (error) {
        console.error('[Map] Failed to fetch coordinates:', error);
        setError(`좌표를 가져오는 데 실패했습니다: ${error.message}`);
        openTMap(latitude, longitude, address);
      } finally {
        setLoading(false);
      }
    };
    fetchCoordinates();
  }, [address, latitude, longitude, onCoordinatesChange, openTMap]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px" w="100%">
        <Spinner size="lg" color="teal.500" />
        <Text ml={2}>지도 로딩 중...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction="column" align="center" justify="center" h="200px" w="100%">
        <Text color="red.500">{error}</Text>
        <Text mt={2} color="gray.500">T맵 내비게이션이 실행되었습니다.</Text>
      </Flex>
    );
  }

  return (
    <MapContainer center={position} zoom={15} style={{ height: '200px', width: '100%' }}>
      <MapUpdater position={position} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>{address || '위치 정보 없음'}</Popup>
      </Marker>
    </MapContainer>
  );
};

// 주소 정규화 함수
const normalizeAddress = (address) => {
  if (!address) return '주소 정보 없음';
  const patterns = [/프라잇베리 진해역점/, /대안빌딩/];
  let result = address;
  patterns.forEach((pat) => {
    result = result.replace(pat, '').trim();
  });
  if (result === '마디미서로 68') result = '창원시 성산구 마디미서로 68';
  if (result.startsWith('경남')) result = result.replace('경남', '경상남도');
  if (result.startsWith('창원시') && !result.includes('경상남도')) {
    result = `경상남도 ${result}`;
  }
  return result.replace(/\s+/g, ' ').trim();
};

const HotelList = ({ loadHotelSettings }) => {
  const { isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const {
    searchQuery: initialSearchQuery = '',
    checkIn = format(new Date(), 'yyyy-MM-dd'),
    checkOut = format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    guestCount = 1,
  } = location.state || {};

  const { isOpen, onToggle, onClose } = useDisclosure();
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [photosMap, setPhotosMap] = useState({});
  const [hotelCoupons, setHotelCoupons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('name');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [currentPhotoIndices, setCurrentPhotoIndices] = useState({});
  const [mapVisible, setMapVisible] = useState({}); // 호텔별 지도 표시 상태
  const mainRef = React.useRef(null);

  // load favorites from localStorage
  useEffect(() => {
    const fav = JSON.parse(localStorage.getItem('favorites')) || {};
    setFavorites(fav);
  }, []);

  // fetch hotel list, photos, coupons
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const list = await fetchHotelList();
        // enrich with additional data
        const enriched = await Promise.all(
          list.map(async (h) => {
            try {
              const settings = await fetchCustomerHotelSettings(h.hotelId);
              return {
                ...h,
                rating: Math.random() * 2 + 3,
                reviewCount: Math.floor(Math.random() * 100) + 10,
                price: Math.floor(Math.random() * 100000) + 50000,
                address: normalizeAddress(h.address),
                checkInTime: settings.checkInTime || '15:00',
                checkOutTime: settings.checkOutTime || '11:00',
                amenities: settings.amenities || ['WiFi', 'Parking', 'Netflix'], // 넷플릭스 추가
                latitude: settings.latitude,
                longitude: settings.longitude,
              };
            } catch {
              return {
                ...h,
                rating: Math.random() * 2 + 3,
                reviewCount: Math.floor(Math.random() * 100) + 10,
                price: Math.floor(Math.random() * 100000) + 50000,
                address: normalizeAddress(h.address),
                checkInTime: '15:00',
                checkOutTime: '11:00',
                amenities: ['WiFi', 'Parking', 'Netflix'], // 넷플릭스 추가
                latitude: null,
                longitude: null,
              };
            }
          })
        );
        setHotels(enriched);
        setFilteredHotels(enriched);

        if (isAuthenticated && customer && localStorage.getItem('customerToken')) {
          const limit = pLimit(3);
          // photos
          const photoPromises = enriched.map((h) =>
            limit(async () => {
              try {
                const data = await fetchHotelPhotos(h.hotelId, 'exterior');
                return { id: h.hotelId, photos: data.commonPhotos || [] };
              } catch {
                toast({
                  title: '사진 로드 실패',
                  description: h.hotelName + ' 사진을 표시할 수 없습니다.',
                  status: 'warning',
                  duration: 3000,
                });
                return { id: h.hotelId, photos: [] };
              }
            })
          );
          const photoResults = await Promise.all(photoPromises);
          const photos = photoResults.reduce((acc, { id, photos }) => {
            acc[id] = photos;
            return acc;
          }, {});
          setPhotosMap(photos);
          setCurrentPhotoIndices(
            enriched.reduce((acc, h) => {
              acc[h.hotelId] = 0;
              return acc;
            }, {})
          );

          // coupons
          const couponPromises = enriched.map((h) =>
            limit(async () => {
              try {
                const settings = await fetchCustomerHotelSettings(h.hotelId);
                const now = format(new Date(), 'yyyy-MM-dd');
                const avail = (settings.coupons || []).filter(
                  (c) =>
                    c.isActive &&
                    c.startDate <= now &&
                    c.endDate >= now &&
                    (!c.maxUses || c.usedCount < c.maxUses)
                );
                return { id: h.hotelId, coupons: avail };
              } catch {
                return { id: h.hotelId, coupons: [] };
              }
            })
          );
          const couponResults = await Promise.all(couponPromises);
          setHotelCoupons(
            couponResults.reduce((acc, { id, coupons }) => {
              acc[id] = coupons;
              return acc;
            }, {})
          );
        }
      } catch (err) {
        toast({
          title: '호텔 로드 실패',
          description: err.message || '서버 오류',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated, customer, toast]);

  // filtering & sorting
  useEffect(() => {
    let list = [...hotels];

    // search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((h) => {
        const nm = h.hotelName.toLowerCase();
        const ad = h.address.toLowerCase();
        return (
          nm.includes(q) ||
          ad.includes(q) ||
          ad.split(/\s+/).some((w) => w.includes(q))
        );
      });
    }

    // price
    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number);
      list = list.filter((h) => h.price >= min && (max ? h.price <= max : true));
    }

    // rating
    if (ratingFilter !== 'all') {
      const r = Number(ratingFilter);
      list = list.filter((h) => h.rating >= r);
    }

    // favorites first
    list.sort((a, b) => {
      const fa = favorites[a.hotelId] ? 0 : 1;
      const fb = favorites[b.hotelId] ? 0 : 1;
      if (fa !== fb) return fa - fb;
      switch (sortOption) {
        case 'name':
          return a.hotelName.localeCompare(b.hotelName);
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'ratingDesc':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    setFilteredHotels(list);
  }, [hotels, searchQuery, priceFilter, ratingFilter, sortOption, favorites]);

  const toggleFav = (id) => {
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleNav = async (id) => {
    try {
      await loadHotelSettings(id);
      navigate(`/rooms/${id}`, {
        state: { checkIn, checkOut, guestCount },
      });
    } catch {
      toast({
        title: '설정 로드 실패',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const openCoupons = (id) => {
    setSelectedCoupons(hotelCoupons[id] || []);
    setIsCouponModalOpen(true);
  };

  const openGallery = (photos) => {
    setSelectedPhotos(photos);
    setIsGalleryModalOpen(true);
  };

  const toggleMap = (hotelId) => {
    setMapVisible((prev) => ({
      ...prev,
      [hotelId]: !prev[hotelId],
    }));
  };

  const handlePrevPhoto = (hotelId) => {
    setCurrentPhotoIndices((prev) => {
      const photos = photosMap[hotelId] || [];
      const currentIndex = prev[hotelId] || 0;
      const newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
      return { ...prev, [hotelId]: newIndex };
    });
  };

  const handleNextPhoto = (hotelId) => {
    setCurrentPhotoIndices((prev) => {
      const photos = photosMap[hotelId] || [];
      const currentIndex = prev[hotelId] || 0;
      const newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
      return { ...prev, [hotelId]: newIndex };
    });
  };

  const onInteract = useCallback(() => {
    if (isOpen) onClose();
  }, [isOpen, onClose]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => isOpen && onClose();
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('mousedown', onInteract);
    el.addEventListener('touchstart', onInteract);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('mousedown', onInteract);
      el.removeEventListener('touchstart', onInteract);
    };
  }, [isOpen, onClose, onInteract]);

  if (!isAuthenticated || !customer) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container
      maxW="container.xl"
      p={0}
      bg="white"
      minH="100vh"
      ref={mainRef}
      display="flex"
      flexDirection="column"
      w="100%"
      overflow="hidden"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflowX="hidden"
    >
      {/* Fixed Header */}
      <Box
        pos="fixed"
        top={0}
        w="100%"
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        zIndex={1000}
        boxShadow={isOpen ? 'lg' : 'sm'}
      >
        <Container maxW="container.sm" py={4}>
          <Flex align="center" justify="space-between">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
              color="gray.700"
              _hover={{ bg: 'gray.100' }}
            />
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              호텔 탐색
            </Text>
            <IconButton
              icon={<SearchIcon />}
              variant="ghost"
              onClick={onToggle}
              aria-label="검색"
              color={isOpen ? 'teal.600' : 'gray.600'}
              _hover={{ bg: 'gray.100' }}
            />
          </Flex>
          <Collapse in={isOpen}>
            <VStack mt={3} spacing={3} bg="white" p={4} borderRadius="md" boxShadow="md">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="호텔 이름 또는 주소 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="md"
                  bg="gray.50"
                  _focus={{ borderColor: 'teal.400', boxShadow: '0 0 0 1px teal.400' }}
                />
              </InputGroup>
              <HStack spacing={2} w="100%">
                <Select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  flex={1}
                  borderRadius="md"
                  bg="gray.50"
                  _focus={{ borderColor: 'teal.400', boxShadow: '0 0 0 1px teal.400' }}
                >
                  <option value="name">이름순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="ratingDesc">평점 높은순</option>
                </Select>
                <Select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  flex={1}
                  borderRadius="md"
                  bg="gray.50"
                  _focus={{ borderColor: 'teal.400', boxShadow: '0 0 0 1px teal.400' }}
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
                  flex={1}
                  borderRadius="md"
                  bg="gray.50"
                  _focus={{ borderColor: 'teal.400', boxShadow: '0 0 0 1px teal.400' }}
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

      {/* List Body */}
      <Box
        flex="1"
        overflowY="auto"
        px={4}
        pt={isOpen ? '180px' : '80px'} // 헤더 높이
        pb={{ base: '58px', md: '50px' }} // BottomNavigation 높이(58px)에 맞춰 조정
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <Container maxW="container.sm" py={4}>
          {isLoading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" color="teal.500" />
            </Flex>
          ) : filteredHotels.length === 0 ? (
            <Text textAlign="center" color="gray.500" fontSize="lg">
              조건에 맞는 호텔이 없습니다.
            </Text>
          ) : (
            <VStack spacing={6} align="stretch">
              {filteredHotels.map((h) => {
                const photos = photosMap[h.hotelId] || [];
                const currentIndex = currentPhotoIndices[h.hotelId] || 0;
                const photoCount = photos.length;
                const isMapVisible = mapVisible[h.hotelId] || false;
                return (
                  <Box
                    key={h.hotelId}
                    borderRadius="lg"
                    overflow="hidden"
                    bg="white"
                    boxShadow="sm"
                    transition="all 0.3s ease"
                    _hover={{
                      boxShadow: 'md',
                    }}
                  >
                    {/* Image or Map Section */}
                    <Box position="relative">
                      {isMapVisible ? (
                        <Map
                          address={h.address}
                          latitude={h.latitude}
                          longitude={h.longitude}
                          onCoordinatesChange={() => {}}
                        />
                      ) : (
                        <>
                          <Image
                            src={photos[currentIndex]?.photoUrl || '/assets/default-hotel.jpg'}
                            alt={`${h.hotelName} 이미지`}
                            h="250px"
                            w="100%"
                            objectFit="cover"
                            fallbackSrc="/assets/default-hotel.jpg"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (photos.length > 0) {
                                openGallery(photos);
                              }
                            }}
                            cursor="pointer"
                          />
                          {photoCount > 1 && (
                            <>
                              <ChakraIconButton
                                icon={<ChevronLeftIcon />}
                                position="absolute"
                                top="50%"
                                left="2"
                                transform="translateY(-50%)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrevPhoto(h.hotelId);
                                }}
                                aria-label="이전 사진"
                                bg="whiteAlpha.800"
                                _hover={{ bg: 'white' }}
                                size="sm"
                                borderRadius="full"
                              />
                              <ChakraIconButton
                                icon={<ChevronRightIcon />}
                                position="absolute"
                                top="50%"
                                right="2"
                                transform="translateY(-50%)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextPhoto(h.hotelId);
                                }}
                                aria-label="다음 사진"
                                bg="whiteAlpha.800"
                                _hover={{ bg: 'white' }}
                                size="sm"
                                borderRadius="full"
                              />
                              <Text
                                position="absolute"
                                bottom="2"
                                right="2"
                                bg="blackAlpha.600"
                                color="white"
                                px="2"
                                py="1"
                                borderRadius="md"
                                fontSize="xs"
                              >
                                {currentIndex + 1}/{photoCount}
                              </Text>
                            </>
                          )}
                          <ChakraIconButton
                            icon={favorites[h.hotelId] ? <FaHeart /> : <FaRegHeart />}
                            position="absolute"
                            top="2"
                            right="2"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFav(h.hotelId);
                            }}
                            aria-label="즐겨찾기"
                            colorScheme={favorites[h.hotelId] ? 'red' : 'gray'}
                            variant="solid"
                            size="sm"
                            bg={favorites[h.hotelId] ? 'red.400' : 'white'}
                            color={favorites[h.hotelId] ? 'white' : 'gray.600'}
                            _hover={{
                              bg: favorites[h.hotelId] ? 'red.500' : 'gray.100',
                            }}
                          />
                        </>
                      )}
                    </Box>
                    {/* Information Section */}
                    <Box p={4}>
                      <Flex direction="column" gap={2}>
                        <Flex justify="space-between" align="center">
                          <Text fontSize="lg" fontWeight="bold" color="gray.800">
                            {h.hotelName}
                          </Text>
                          <Flex align="center" gap={1}>
                            <StarIcon color="teal.500" boxSize={4} />
                            <Text fontSize="sm" fontWeight="bold" color="gray.700">
                              {h.rating.toFixed(1)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              ({h.reviewCount} 리뷰)
                            </Text>
                          </Flex>
                        </Flex>
                        <Flex align="center" gap={1}>
                          <Icon as={FaMapMarkerAlt} color="teal.500" boxSize={4} />
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            noOfLines={1}
                            cursor="pointer"
                            onClick={() => toggleMap(h.hotelId)}
                            _hover={{ color: 'teal.500', textDecoration: 'underline' }}
                          >
                            {h.address}
                          </Text>
                        </Flex>
                        <HStack spacing={2}>
                          <Text fontSize="xs" color="gray.500">
                            체크인: {h.checkInTime}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            체크아웃: {h.checkOutTime}
                          </Text>
                        </HStack>
                        <HStack spacing={2} wrap="wrap">
                          {h.amenities.slice(0, 3).map((amenity, idx) => {
                            let icon;
                            let color;
                            if (amenity.toLowerCase() === 'wifi') {
                              icon = FaWifi;
                              color = 'teal.500';
                            } else if (amenity.toLowerCase() === 'parking') {
                              icon = FaParking;
                              color = 'teal.500';
                            } else if (amenity.toLowerCase() === 'netflix') {
                              icon = FaTv; // 넷플릭스는 FaTv 아이콘 사용
                              color = 'red.500'; // 넷플릭스 붉은색
                            } else {
                              return (
                                <Badge key={idx} colorScheme="teal" variant="outline" fontSize="xs">
                                  {amenity}
                                </Badge>
                              );
                            }
                            return (
                              <Tooltip label={amenity} key={idx}>
                                <Box>
                                  <Icon as={icon} color={color} boxSize={4} />
                                </Box>
                              </Tooltip>
                            );
                          })}
                          {h.amenities.length > 3 && (
                            <Text fontSize="xs" color="gray.500">
                              +{h.amenities.length - 3}
                            </Text>
                          )}
                        </HStack>
                        <Flex justify="space-between" align="center" mt={2}>
                          <Text fontSize="md" fontWeight="bold" color="teal.600">
                            ₩{h.price.toLocaleString()} / 박
                          </Text>
                          {hotelCoupons[h.hotelId]?.length > 0 && (
                            <Badge
                              colorScheme="teal"
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="full"
                              bg="teal.500"
                              color="white"
                              display="flex"
                              alignItems="center"
                              gap={1}
                              onClick={(e) => {
                                e.stopPropagation();
                                openCoupons(h.hotelId);
                              }}
                              cursor="pointer"
                            >
                              <Icon as={FaTag} boxSize={3} />
                              {hotelCoupons[h.hotelId].length}개 쿠폰
                            </Badge>
                          )}
                        </Flex>
                        <HStack spacing={2} mt={2}>
                          <Button
                            colorScheme="teal"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNav(h.hotelId);
                            }}
                          >
                            예약하기
                          </Button>
                          <Button
                            colorScheme="gray"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/rooms/${h.hotelId}/details`);
                            }}
                          >
                            자세히 보기
                          </Button>
                        </HStack>
                      </Flex>
                    </Box>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Container>
      </Box>

      {/* 쿠폰 모달 */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>사용 가능 쿠폰</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCoupons.length > 0 ? (
              <VStack spacing={3}>
                {selectedCoupons.map((c) => (
                  <Box
                    key={c.uuid}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    w="100%"
                  >
                    <Text fontWeight="bold">{c.name}</Text>
                    <Text>코드: {c.code}</Text>
                    <Text>
                      할인:{' '}
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}%`
                        : `${c.discountValue.toLocaleString()}원`}
                    </Text>
                    <Text>유효: {c.startDate} ~ {c.endDate}</Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text>사용 가능한 쿠폰이 없습니다.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 갤러리 모달 */}
      <Modal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>호텔 사진 갤러리</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {selectedPhotos.map((photo, idx) => (
                <Image
                  key={idx}
                  src={photo.photoUrl}
                  alt={`호텔 사진 ${idx + 1}`}
                  h="300px"
                  w="100%"
                  objectFit="cover"
                  borderRadius="md"
                  fallbackSrc="/assets/default-hotel.jpg"
                />
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <BottomNavigation />
    </Container>
  );
};

export default HotelList;