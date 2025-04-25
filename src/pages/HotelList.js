import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
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
  Divider,
} from '@chakra-ui/react';
import {
  SearchIcon,
  ArrowBackIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { fetchHotelList, fetchHotelPhotos, fetchCustomerHotelSettings } from '../api/api';
import BottomNavigation from '../components/BottomNavigation';
import pLimit from 'p-limit';
import { format, addDays } from 'date-fns';
import HotelCard from '../components/HotelCard';

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
  const [mapVisible, setMapVisible] = useState({});
  const mainRef = React.useRef(null);

  // Load favorites from localStorage
  useEffect(() => {
    const fav = JSON.parse(localStorage.getItem('favorites')) || {};
    setFavorites(fav);
  }, []);

  // Fetch hotel list, photos, coupons
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const list = await fetchHotelList();
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
                amenities: settings.amenities || ['WiFi', 'Parking', 'Netflix'],
                latitude: settings.latitude,
                longitude: settings.longitude,
              };
            } catch {
              return {
                ...h,
                rating: Math.random() * 2 + 3,
                reviewCount: Math.floor(Math.random() * 100) + 10,
                price: Math.floor(Math.random() * 100000) + 50_000,
                address: normalizeAddress(h.address),
                checkInTime: '15:00',
                checkOutTime: '11:00',
                amenities: ['WiFi', 'Parking sprinkling', 'Netflix'],
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

  // Filtering & sorting
  useEffect(() => {
    let list = [...hotels];

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

    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number);
      list = list.filter(
        (h) => h.price >= min && (max ? h.price <= max : true)
      );
    }

    if (ratingFilter !== 'all') {
      const r = Number(ratingFilter);
      list = list.filter((h) => h.rating >= r);
    }

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
      console.log(`[HotelList] Attempting to navigate to room selection for hotel ID: ${id}`);
      console.log('[HotelList] Calling loadHotelSettings...');
      await loadHotelSettings(id);
      console.log('[HotelList] loadHotelSettings completed successfully');
      console.log('[HotelList] Navigating to /rooms/...');
      navigate(`/rooms/${id}`, {
        state: { checkIn, checkOut, guestCount },
      });
      console.log('[HotelList] Navigation completed');
    } catch (err) {
      console.error('[HotelList] Failed to load hotel settings:', err);
      toast({
        title: '설정 로드 실패',
        description: err.message || '호텔 설정을 로드하지 못했습니다.',
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

  const handleCopyAddress = (address) => {
    if (address) {
      navigator.clipboard
        .writeText(address)
        .then(() => {
          toast({
            title: '주소 복사 완료',
            description: '호텔 주소가 클립보드에 복사되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
          toast({
            title: '주소 복사 실패',
            description: `주소를 복사하는 데 실패했습니다: ${error.message}`,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  };

  const handleTMapNavigation = (hotel) => {
    if (!hotel.latitude || !hotel.longitude) {
      toast({
        title: '좌표 정보 없음',
        description: '호텔 좌표를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const tmapUrl = `tmap://route?goalx=${hotel.longitude}&goaly=${hotel.latitude}&name=${encodeURIComponent(hotel.hotelName)}`;
    window.location.href = tmapUrl;
    setTimeout(() => {
      toast({
        title: 'T맵 설치 필요',
        description: 'T맵 앱이 설치되어 있지 않다면 설치 페이지로 이동합니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }, 2000);
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
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      flexDirection="column"
      w="100vw"
      maxW="100%"
      overflow="hidden"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      pt="env(safe-area-inset-top)"
      pb="env(safe-area-inset-bottom)"
    >
      {/* 상단바 - 고정 위치 */}
      <Box
        position="fixed"
        top={0}
        w="100%"
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        zIndex={1000}
        boxShadow={isOpen ? 'lg' : 'none'}
        pt="env(safe-area-inset-top)"
      >
        <Flex align="center" justify="space-between" py={4} px={4.5}>
          <IconButton
            icon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate(-1)}
            aria-label="뒤로"
            color="gray.700"
            _hover={{ bg: 'gray.100' }}
            size="lg"
          />
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            찜한 호텔
          </Text>
          <IconButton
            icon={<SearchIcon />}
            variant="ghost"
            onClick={onToggle}
            aria-label="검색"
            color={isOpen ? 'blue.600' : 'gray.600'}
            _hover={{ bg: 'gray.100' }}
            size="lg"
          />
        </Flex>
        <Collapse in={isOpen}>
          <VStack
            mt={3}
            spacing={3}
            bg="white"
            p={4}
            borderRadius="xl"
            boxShadow="md"
            mx={4.5}
          >
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="호텔 이름 또는 주소 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="lg"
                bg="gray.50"
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px blue.400',
                }}
              />
            </InputGroup>
            <HStack spacing={2} w="100%">
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                flex={1}
                borderRadius="lg"
                bg="gray.50"
                icon={<ChevronDownIcon />}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px blue.400',
                }}
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
                borderRadius="lg"
                bg="gray.50"
                icon={<ChevronDownIcon />}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px blue.400',
                }}
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
                borderRadius="lg"
                bg="gray.50"
                icon={<ChevronDownIcon />}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px blue.400',
                }}
              >
                <option value="all">모든 평점</option>
                <option value="4.5">4.5점 이상</option>
                <option value="4">4점 이상</option>
                <option value="3.5">3.5점 이상</option>
              </Select>
            </HStack>
          </VStack>
        </Collapse>
      </Box>

      {/* 본문 - 상하 스크롤 가능 */}
      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        pt={isOpen ? '180px' : '80px'} // 상단바 높이 고려
        pb="160px" // 하단 네비게이션 바 높이 + 여유분
        css={{
          '-webkit-overflow-scrolling': 'touch', // iOS 부드러운 스크롤
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.300',
            borderRadius: '4px',
          },
        }}
      >
        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : filteredHotels.length === 0 ? (
          <Text textAlign="center" color="gray.500" fontSize="lg" mt={8}>
            조건에 맞는 호텔이 없습니다.
          </Text>
        ) : (
          <VStack spacing={0} align="stretch" w="100%" px={4.5}>
            {filteredHotels.map((h, index) => (
              <Box key={h.hotelId}>
                <HotelCard
                  hotel={{
                    ...h,
                    photos: photosMap[h.hotelId] || [],
                    availableCoupons: hotelCoupons[h.hotelId]?.length || 0,
                  }}
                  isFavorite={favorites[h.hotelId] || false}
                  toggleFavorite={toggleFav}
                  onSelect={handleNav}
                  onViewCoupons={openCoupons}
                  onOpenGallery={openGallery}
                  currentPhotoIndex={currentPhotoIndices[h.hotelId] || 0}
                  handlePrevPhoto={handlePrevPhoto}
                  handleNextPhoto={handleNextPhoto}
                  photoCount={(photosMap[h.hotelId] || []).length}
                  toggleMap={toggleMap}
                  isMapVisible={mapVisible[h.hotelId] || false}
                  handleCopyAddress={handleCopyAddress}
                  handleTMapNavigation={handleTMapNavigation}
                  index={index}
                  totalHotels={filteredHotels.length}
                />
                {index < filteredHotels.length - 1 && (
                  <Divider borderColor="gray.200" borderWidth="0.3px" mb={2} />
                )}
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* 쿠폰 모달 */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent borderRadius="xl" mx={4.5}>
          <ModalHeader fontSize="md" fontWeight="semibold">
            사용 가능 쿠폰
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedCoupons.length > 0 ? (
              <VStack spacing={3}>
                {selectedCoupons.map((c) => (
                  <Box
                    key={c.uuid}
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    w="100%"
                    bg="gray.50"
                  >
                    <Text fontWeight="semibold" color="gray.800">
                      {c.name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      코드: {c.code}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      할인:{' '}
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}%`
                        : `${c.discountValue.toLocaleString()}원`}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      유효: {c.startDate} ~ {c.endDate}
                    </Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500">사용 가능한 쿠폰이 없습니다.</Text>
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
        <ModalContent borderRadius="xl" mx={4.5}>
          <ModalHeader fontSize="md" fontWeight="semibold">
            호텔 사진 갤러리
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              {selectedPhotos.map((photo, idx) => (
                <Image
                  key={idx}
                  src={photo.photoUrl}
                  alt={`호텔 사진 ${idx + 1}`}
                  h="300px"
                  w="100%"
                  objectFit="cover"
                  borderRadius="lg"
                  fallbackSrc="/assets/default-hotel.jpg"
                />
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 하단 네비게이션 바 - 고정 위치 */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={100}
        pb="env(safe-area-inset-bottom)"
      >
        <BottomNavigation />
      </Box>
    </Box>
  );
};

export default HotelList;