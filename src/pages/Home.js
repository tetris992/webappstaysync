import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Select,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  SlideFade,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon, CalendarIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { DateRange } from 'react-date-range';
import { format, addDays, startOfDay, addMonths, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { fetchHotelList } from '../api/api';
import { useToast } from '@chakra-ui/react';
import BottomNavigation from '../components/BottomNavigation';
import io from 'socket.io-client';

// 기본 호텔 데이터 (API 호출 실패 시 사용)
const recommendedHotels = [
  {
    id: 1,
    name: '부산 호텔',
    image: '/assets/hotel1.jpg',
    rating: 4.5,
    description: '해운대 해변 전망 객실',
    tag: 'BEST HOT',
    color: 'blue',
    address: '부산 해운대구 해운대해변로 264',
  },
  {
    id: 11,
    name: '여수 호텔',
    image: '/assets/hotel11.jpg',
    rating: 4.8,
    description: '해양 도시 전망 호텔',
    tag: 'HOT',
    color: 'green',
    address: '여수시 돌산공원길 1',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    customer,
    customerCoupons,
    isCouponsLoading,
    couponsLoadError,
    availableCoupons,
    isAvailableCouponsLoading,
    availableCouponsError,
    downloadCoupon,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState([
    {
      startDate: startOfDay(new Date()),
      endDate: addDays(startOfDay(new Date()), 1),
      key: 'selection',
    },
  ]);
  const [guestCount, setGuestCount] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCouponPanelOpen, setIsCouponPanelOpen] = useState(false);

  // Socket.io 연결 및 couponIssued 이벤트 처리
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Home] Socket.io connected');
    });

    socket.on('couponIssued', ({ message }) => {
      toast({
        title: '새 쿠폰 발행',
        description: message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('disconnect', () => {
      console.log('[Home] Socket.io disconnected, attempting to reconnect...');
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  // 서버에서 호텔 데이터 가져오기
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        setError(null);
        const hotelList = await fetchHotelList();
        console.log('서버에서 가져온 호텔 데이터:', hotelList);

        const hotelsWithDetails = hotelList.map((hotel) => ({
          ...hotel,
          rating: Number((Math.random() * 2 + 3).toFixed(1)),
          reviewCount: Math.floor(Math.random() * 100) + 10,
          price: Math.floor(Math.random() * 100000) + 50000,
          image: '/assets/hotel1.jpg',
          tag: 'HOT',
          color: 'blue',
          description: hotel.address,
        }));

        setHotels(hotelsWithDetails);
      } catch (error) {
        console.error('호텔 데이터 가져오기 실패:', error);
        setError(error.message || '호텔 목록을 불러오지 못했습니다.');
        setHotels(recommendedHotels);
        toast({
          title: '호텔 목록 로드 실패',
          description: error.message || '호텔 목록을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [toast]);

  // 에러 메시지 표시
  useEffect(() => {
    if (couponsLoadError) {
      setError(couponsLoadError);
    }
    if (availableCouponsError) {
      setError(availableCouponsError);
    }
  }, [couponsLoadError, availableCouponsError]);

  // 쿠폰 다운로드 처리
  const handleDownloadCoupon = async (couponUuid) => {
    try {
      setError(null);
      await downloadCoupon(couponUuid);
      toast({
        title: '쿠폰 다운로드 성공',
        description: (
          <Box>
            <Text>쿠폰이 성공적으로 다운로드되었습니다.</Text>
            <Button
              size="sm"
              mt={2}
              colorScheme="blue"
              onClick={() => setIsCouponPanelOpen(true)}
            >
              쿠폰 확인하기
            </Button>
          </Box>
        ),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('쿠폰 다운로드 실패:', error);
      setError(error.message || '쿠폰 다운로드에 실패했습니다.');
    }
  };

  const handleSearch = () => {
    const checkIn = dateRange[0].startDate;
    const checkOut = dateRange[0].endDate;
    if (!isValid(checkIn) || !isValid(checkOut)) {
      toast({
        title: '날짜 오류',
        description: '체크인/체크아웃 날짜가 올바르지 않습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const checkInFormatted = format(checkIn, 'yyyy-MM-dd');
    const checkOutFormatted = format(checkOut, 'yyyy-MM-dd');

    if (!searchQuery.trim()) {
      navigate('/hotels', {
        state: {
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted,
          guestCount,
        },
      });
      return;
    }

    const searchLower = searchQuery.toLowerCase().trim();
    console.log('검색어:', searchLower);

    const filteredHotels = [];

    const hotelsToSearch = hotels.length > 0 ? hotels : recommendedHotels;
    console.log('검색 대상 호텔 수:', hotelsToSearch.length);

    hotelsToSearch.forEach((hotel) => {
      const hotelName = hotel.hotelName || hotel.name || '';
      const nameMatch = hotelName.toLowerCase().includes(searchLower);
      const description = hotel.description || '';
      const descMatch = description.toLowerCase().includes(searchLower);
      const address = hotel.address || '';
      const addrMatch = address.toLowerCase().includes(searchLower);
      const addressParts = address.toLowerCase().split(/[\s,]+/);
      const addressPartMatch = addressParts.some((part) =>
        part.includes(searchLower)
      );

      console.log(`호텔: ${hotelName}, 주소: ${address}`);
      console.log(
        `이름 일치: ${nameMatch}, 설명 일치: ${descMatch}, 주소 일치: ${addrMatch}, 주소 부분 일치: ${addressPartMatch}`
      );
      console.log(`주소 부분: ${addressParts.join(', ')}`);

      if (nameMatch || descMatch || addrMatch || addressPartMatch) {
        console.log(`일치하는 호텔 추가: ${hotelName}`);
        filteredHotels.push(hotel);
      }
    });

    console.log('검색 결과 호텔 수:', filteredHotels.length);
    console.log(
      '검색 결과 호텔:',
      filteredHotels.map((h) => h.hotelName || h.name)
    );

    if (filteredHotels.length > 0) {
      navigate('/hotels', {
        state: {
          searchQuery,
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted,
          guestCount,
          filteredHotels: filteredHotels.map(
            (hotel) => hotel.hotelId || hotel.id
          ),
        },
      });
    } else {
      navigate('/hotels', {
        state: {
          searchQuery,
          checkIn: checkInFormatted,
          checkOut: checkOutFormatted,
          guestCount,
          noResults: true,
        },
      });
    }
  };

  const handleDateChange = (item) => {
    setDateRange([item.selection]);
    setIsCalendarOpen(false);
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    appendDots: (dots) => (
      <Box
        position="absolute"
        bottom="10px"
        width="100%"
        display="flex"
        justifyContent="center"
        zIndex={10}
      >
        <HStack spacing={2}>{dots}</HStack>
      </Box>
    ),
  };

  return (
    <Box
      minH="100vh"
      bg="gray.100"
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
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        width="100%"
        pt={5} // 상단 여백 (Safe Area와 별개로 타이틀 위 여백 확보)
        pb={3}
        position="fixed"
        top={0}
        zIndex={100}
        boxShadow="sm"
      >
        <Flex align="center" justify="space-between" px={4}>
          <Box flex="1" /> {/* 왼쪽 여백을 위한 빈 공간 */}
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            cursor="pointer"
            onClick={() => navigate('/')}
          >
            <Box
              bg="blue.600"
              w="36px"
              h="36px"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="sm"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'lg',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                opacity: 0.8,
              }}
            >
              <Text
                color="white"
                fontSize="xl"
                fontWeight="bold"
                position="relative"
                zIndex={1}
              >
                단
              </Text>
            </Box>
            <Box>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="gray.800"
                letterSpacing="tight"
              >
                단잠
              </Text>
              <Text
                fontSize="xs"
                color="gray.500"
                letterSpacing="wider"
                lineHeight="1"
              >
                SWEET DREAMS
              </Text>
            </Box>
          </Box>
          <Box flex="1" display="flex" justifyContent="flex-end">
            <Popover
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              placement="bottom-end"
              closeOnBlur={true}
            >
              <PopoverTrigger>
                <Box
                  as="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  p={2}
                  borderRadius="full"
                  bg="gray.100"
                  _hover={{ bg: 'gray.200' }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <SearchIcon boxSize={5} color="gray.600" />
                </Box>
              </PopoverTrigger>
              <PopoverContent
                w="90vw"
                maxW="400px"
                p={4}
                boxShadow="xl"
                border="none"
                borderRadius="xl"
                bg="white"
                mx={4}
              >
                <PopoverArrow />
                <VStack spacing={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="목적지 검색 (예: 부산, 해운대, 서울)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      borderRadius="lg"
                      bg="gray.100"
                    />
                  </InputGroup>

                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <CalendarIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="날짜 선택"
                      value={`${format(
                        dateRange[0].startDate,
                        'yyyy년 MM월 dd일'
                      )} - ${format(dateRange[0].endDate, 'yyyy년 MM월 dd일')}`}
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      readOnly
                      cursor="pointer"
                      borderRadius="lg"
                      bg="gray.100"
                    />
                  </InputGroup>

                  <Select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    borderRadius="lg"
                    bg="gray.100"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}명
                      </option>
                    ))}
                  </Select>

                  <Button
                    w="100%"
                    colorScheme="blue"
                    onClick={() => {
                      handleSearch();
                      setIsSearchOpen(false);
                    }}
                    borderRadius="lg"
                    bg="blue.600"
                    _hover={{ bg: 'blue.700' }}
                  >
                    검색
                  </Button>
                </VStack>
              </PopoverContent>
            </Popover>
          </Box>
        </Flex>
      </Box>

      {/* 날짜 선택 모달 */}
      {isCalendarOpen && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          p={4}
          borderRadius="xl"
          boxShadow="xl"
          zIndex={1000}
          w="90vw"
          maxW="400px"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold">날짜 선택</Text>
            <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
              닫기
            </Button>
          </Flex>
          <DateRange
            editableDateInputs={true}
            onChange={handleDateChange}
            moveRangeOnFirstSelection={false}
            ranges={dateRange}
            months={1}
            direction="vertical"
            locale={ko}
            minDate={startOfDay(new Date())}
            maxDate={addMonths(startOfDay(new Date()), 3)}
            rangeColors={['#3B82F6']}
          />
        </Box>
      )}

      {/* 본문 - 상하 스크롤 가능 */}
      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        mt="80px"
        pb="200px" // 하단 네비게이션 바 높이 + 여유분
        css={{
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#D1D5DB',
            borderRadius: '24px',
          },
        }}
      >
        <VStack spacing={6} align="stretch" px={4}>
          {error && (
            <Text color="red.500" textAlign="center" mb={4}>
              {error}
            </Text>
          )}
          <Box w="100%" mb={4}>
            <Button
              w="100%"
              size="lg"
              colorScheme="blue"
              onClick={() => {
                navigate('/hotels', {
                  state: {
                    checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
                    checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
                    guestCount,
                  },
                });
              }}
              borderRadius="lg"
              py={6}
              fontSize="lg"
              fontWeight="semibold"
              bg="blue.600"
              color="white"
              boxShadow="sm"
              _hover={{
                bg: 'blue.700',
                transform: 'translateY(-1px)',
                boxShadow: 'md',
              }}
              _active={{
                transform: 'translateY(0)',
                boxShadow: 'sm',
              }}
            >
              숙소 예약하기
            </Button>
          </Box>

          <Box w="100%" mb={4}>
            <Text fontSize="md" fontWeight="bold" mb={3} color="gray.800">
              추천 호텔
            </Text>
            <Box>
              <Slider {...sliderSettings}>
                {(loading
                  ? recommendedHotels
                  : hotels.length > 0
                  ? hotels
                  : recommendedHotels
                ).map((hotel) => (
                  <Box
                    key={hotel.hotelId || hotel.id}
                    onClick={() => navigate('/hotels')}
                    position="relative"
                    cursor="pointer"
                    h="240px"
                    borderRadius="lg"
                    overflow="hidden"
                    role="group"
                  >
                    <Image
                      src={hotel.image || '/assets/hotel1.jpg'}
                      alt={`${hotel.hotelName || hotel.name} 호텔 이미지`}
                      h="100%"
                      w="100%"
                      objectFit="cover"
                      transition="all 0.3s ease"
                      _groupHover={{ transform: 'scale(1.05)' }}
                    />
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bgGradient="linear(to-t, blackAlpha.700, blackAlpha.300)"
                      transition="all 0.3s ease"
                      _groupHover={{
                        bgGradient:
                          'linear(to-t, blackAlpha.800, blackAlpha.400)',
                      }}
                    />
                    <Box position="absolute" top={4} right={4}>
                      <Badge
                        colorScheme={hotel.color || 'blue'}
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                        boxShadow="sm"
                        bg="blue.600"
                        color="white"
                      >
                        {hotel.tag || 'HOT'}
                      </Badge>
                    </Box>
                    <VStack
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      p={5}
                      align="flex-start"
                      spacing={1}
                    >
                      <Text
                        color="white"
                        fontSize="xl"
                        fontWeight="bold"
                        letterSpacing="tight"
                        transition="all 0.3s ease"
                        _groupHover={{ transform: 'translateY(-2px)' }}
                      >
                        {hotel.hotelName || hotel.name}
                      </Text>
                      <Text
                        color="gray.100"
                        fontSize="sm"
                        opacity={0.9}
                        transition="all 0.3s ease"
                        _groupHover={{ opacity: 1 }}
                      >
                        {hotel.description || hotel.address}
                      </Text>
                      <HStack spacing={1}>
                        <Text
                          color="yellow.300"
                          fontSize="sm"
                          fontWeight="bold"
                        >
                          {hotel.rating || 4.5}
                        </Text>
                        <Text color="gray.200" fontSize="sm">
                          / 5.0
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </Slider>
            </Box>
          </Box>

          {customer && (
            <Box w="100%" mb={4}>
              <Text fontSize="md" fontWeight="bold" mb={3} color="gray.800">
                쿠폰
              </Text>
              {isAvailableCouponsLoading ? (
                <Text color="gray.500" textAlign="center">
                  사용 가능 쿠폰 로드 중...
                </Text>
              ) : availableCoupons.length > 0 ? (
                <VStack spacing={3}>
                  {availableCoupons.map((coupon) => (
                    <Box
                      key={coupon.couponUuid}
                      bg="white"
                      p={4}
                      rounded="lg"
                      shadow="sm"
                      w="100%"
                      border="1px solid"
                      borderColor="gray.200"
                      position="relative"
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        bg: 'blue.600',
                      }}
                    >
                      <Text fontWeight="bold" color="gray.800">
                        {coupon.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        코드: {coupon.code}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        할인:{' '}
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `${coupon.discountValue.toLocaleString()}원`}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        유효 기간: {coupon.startDate} ~ {coupon.endDate}
                      </Text>
                      <Button
                        mt={2}
                        colorScheme="blue"
                        size="sm"
                        onClick={() => handleDownloadCoupon(coupon.couponUuid)}
                        borderRadius="lg"
                        bg="blue.600"
                        _hover={{ bg: 'blue.700' }}
                      >
                        다운로드
                      </Button>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" textAlign="center">
                  사용 가능한 쿠폰이 없습니다.
                </Text>
              )}
              <Button
                w="100%"
                colorScheme="blue"
                size="md"
                onClick={() => setIsCouponPanelOpen(true)}
                borderRadius="lg"
                bg="blue.600"
                _hover={{ bg: 'blue.700' }}
                mt={4}
              >
                쿠폰 보관함
              </Button>
            </Box>
          )}

          <Box w="100%" mb={4}>
            <Box
              position="relative"
              w="100%"
              h="80px"
              bg="gray.900"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="md"
              cursor="pointer"
              onClick={() => {
                const button = document.getElementById('animation-button');
                button.style.animation =
                  'bounceAndDisappear 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';

                setTimeout(() => {
                  navigate('/events');
                }, 1300);
              }}
              id="animation-button"
              _hover={{
                transform: 'scale(1.02)',
                boxShadow: '0 6px 16px rgba(159, 122, 234, 0.4)',
              }}
              _active={{
                transform: 'scale(0.98)',
              }}
              sx={{
                '@keyframes bounceAndDisappear': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '20%': {
                    transform: 'scale(1.2) translateY(-20px)',
                    opacity: 0.9,
                  },
                  '40%': {
                    transform: 'scale(0.9) translateY(10px)',
                    opacity: 0.8,
                  },
                  '60%': {
                    transform: 'scale(1.1) translateY(-10px)',
                    opacity: 0.7,
                  },
                  '80%': {
                    transform: 'scale(0.8) translateY(5px)',
                    opacity: 0.5,
                  },
                  '100%': { transform: 'scale(0)', opacity: 0 },
                },
              }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  bgGradient="linear(to-r, purple.600, blue.400, teal.300)"
                  animation="gradientMove 15s ease infinite"
                  sx={{
                    '@keyframes gradientMove': {
                      '0%': { transform: 'scale(1.5) rotate(0deg)' },
                      '50%': { transform: 'scale(1.8) rotate(180deg)' },
                      '100%': { transform: 'scale(1.5) rotate(360deg)' },
                    },
                  }}
                />

                {[...Array(20)].map((_, i) => (
                  <Box
                    key={i}
                    position="absolute"
                    w={`${Math.random() * 100 + 50}px`}
                    h={`${Math.random() * 100 + 50}px`}
                    bg="rgba(255, 255, 255, 0.1)"
                    backdropFilter="blur(5px)"
                    borderRadius="lg"
                    animation={`floatPattern${i} ${
                      Math.random() * 10 + 15
                    }s infinite linear`}
                    sx={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      [`@keyframes floatPattern${i}`]: {
                        '0%': {
                          transform: `translate(0, 0) rotate(${
                            Math.random() * 360
                          }deg)`,
                          opacity: Math.random() * 0.5 + 0.3,
                        },
                        '50%': {
                          transform: `translate(${
                            Math.random() * 100 - 50
                          }px, ${Math.random() * 100 - 50}px) rotate(${
                            Math.random() * 360
                          }deg)`,
                          opacity: Math.random() * 0.8 + 0.2,
                        },
                        '100%': {
                          transform: `translate(0, 0) rotate(${
                            Math.random() * 360
                          }deg)`,
                          opacity: Math.random() * 0.5 + 0.3,
                        },
                      },
                    }}
                  />
                ))}

                {[...Array(5)].map((_, i) => (
                  <Box
                    key={i}
                    position="absolute"
                    w="2px"
                    h="100%"
                    bg="white"
                    opacity="0.3"
                    animation={`lightBeam${i} ${
                      Math.random() * 5 + 5
                    }s infinite linear`}
                    sx={{
                      left: `${Math.random() * 100}%`,
                      [`@keyframes lightBeam${i}`]: {
                        '0%': {
                          transform: 'translateY(-100%) rotate(45deg)',
                          opacity: 0,
                        },
                        '50%': { opacity: 0.3 },
                        '100%': {
                          transform: 'translateY(100%) rotate(45deg)',
                          opacity: 0,
                        },
                      },
                    }}
                  />
                ))}

                {[...Array(30)].map((_, i) => (
                  <Box
                    key={i}
                    position="absolute"
                    w="4px"
                    h="4px"
                    bg="white"
                    borderRadius="full"
                    animation={`particle${i} ${
                      Math.random() * 20 + 10
                    }s infinite linear`}
                    sx={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      [`@keyframes particle${i}`]: {
                        '0%': {
                          transform: 'scale(1) translate(0, 0)',
                          opacity: Math.random() * 0.5 + 0.3,
                        },
                        '50%': {
                          transform: `scale(${Math.random() + 0.5}) translate(${
                            Math.random() * 200 - 100
                          }px, ${Math.random() * 200 - 100}px)`,
                          opacity: Math.random() * 0.8 + 0.2,
                        },
                        '100%': {
                          transform: 'scale(1) translate(0, 0)',
                          opacity: Math.random() * 0.5 + 0.3,
                        },
                      },
                    }}
                  />
                ))}

                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  textAlign="center"
                  color="white"
                  zIndex={2}
                >
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    mb={1}
                    textShadow="0 1px 2px rgba(0,0,0,0.2)"
                  >
                    이벤트
                  </Text>
                  <Text
                    fontSize="sm"
                    opacity={0.9}
                    textShadow="0 1px 2px rgba(0,0,0,0.2)"
                  >
                    클릭하여 이벤트 확인하기
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </VStack>
      </Box>

      {/* 쿠폰 보관함 드랍다운 패널 */}
      {isCouponPanelOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={98}
          onClick={() => setIsCouponPanelOpen(false)}
          backdropFilter="blur(4px)"
        />
      )}
      <SlideFade in={isCouponPanelOpen} offsetY="-20px">
        <Box
          position="fixed"
          top="60px"
          left={0}
          right={0}
          bg="white"
          zIndex={99}
          boxShadow="md"
          maxH="50vh"
          overflowY="auto"
          borderBottomRadius="xl"
          p={4}
          mx={4}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold">
              쿠폰 보관함
            </Text>
            <Button
              size="sm"
              onClick={() => setIsCouponPanelOpen(false)}
              variant="ghost"
            >
              닫기
            </Button>
          </Flex>
          {isCouponsLoading ? (
            <Text color="gray.500" textAlign="center">
              쿠폰 로드 중...
            </Text>
          ) : customerCoupons.length === 0 ? (
            <Text color="gray.500" textAlign="center">
              보유한 쿠폰이 없습니다.
            </Text>
          ) : (
            <VStack spacing={3}>
              {customerCoupons.map((coupon) => (
                <Box
                  key={coupon.couponUuid}
                  bg="gray.50"
                  p={3}
                  rounded="lg"
                  w="100%"
                  borderTop="1px dashed"
                  borderColor="gray.300"
                >
                  <Text fontWeight="bold" color="gray.800">
                    {coupon.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    코드: {coupon.code}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    할인:{' '}
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : `${coupon.discountValue.toLocaleString()}원`}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    유효 기간: {coupon.startDate} ~ {coupon.endDate}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={coupon.used ? 'red.500' : 'green.500'}
                  >
                    상태: {coupon.used ? '사용됨' : '사용 가능'}
                  </Text>
                </Box>
              ))}
              <Button
                w="100%"
                colorScheme="blue"
                size="sm"
                onClick={() => {
                  setIsCouponPanelOpen(false);
                  setTimeout(() => navigate('/coupon-wallet'), 300);
                }}
                borderRadius="lg"
                bg="blue.600"
                _hover={{ bg: 'blue.700' }}
              >
                쿠폰 보관함으로 이동
              </Button>
            </VStack>
          )}
        </Box>
      </SlideFade>

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

export default Home;
