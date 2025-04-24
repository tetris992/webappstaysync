import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  Box,
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
  Badge,
} from '@chakra-ui/react';
import { SearchIcon, CalendarIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { DateRange } from 'react-date-range';
import { format, addDays, startOfDay, addMonths, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { fetchHotelList, fetchCustomerCoupons } from '../api/api';
import api from '../api/api';
import { useToast } from '@chakra-ui/react';
import BottomNavigation from '../components/BottomNavigation'; // 하단 네비게이션 바 추가

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
  const { customer } = useAuth();
  const toast = useToast();
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
  const [coupons, setCoupons] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [error, setError] = useState(null);

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

  // 고객 쿠폰 데이터 가져오기
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!customer?._id) return;
      try {
        setError(null);
        const customerCoupons = await fetchCustomerCoupons(customer._id);
        setCoupons(customerCoupons);
      } catch (error) {
        console.error('쿠폰 데이터 가져오기 실패:', error);
        setError(error.message || '쿠폰을 불러오지 못했습니다.');
        toast({
          title: '쿠폰 로드 실패',
          description: error.message || '쿠폰을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchCoupons();
  }, [customer, toast]);

  // 다운로드 가능한 쿠폰 가져오기
  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      if (!customer?._id) return;
      try {
        setError(null);
        const response = await api.get('/api/customer/available-coupons');
        setAvailableCoupons(response.data.coupons || []);
      } catch (error) {
        console.error('사용 가능 쿠폰 데이터 가져오기 실패:', error);
        setError(error.message || '사용 가능 쿠폰을 불러오지 못했습니다.');
        toast({
          title: '사용 가능 쿠폰 로드 실패',
          description: error.message || '사용 가능 쿠폰을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchAvailableCoupons();
  }, [customer, toast]);

  // 쿠폰 다운로드 처리
  const handleDownloadCoupon = async (couponUuid) => {
    try {
      setError(null);
      const response = await api.post('/api/customer/download-coupon', {
        couponUuid,
        customerId: customer._id,
      });
      setCoupons([...coupons, response.data.coupon]);
      setAvailableCoupons(
        availableCoupons.filter((coupon) => coupon.couponUuid !== couponUuid)
      );
      toast({
        title: '쿠폰 다운로드 성공',
        description: '쿠폰이 성공적으로 다운로드되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('쿠폰 다운로드 실패:', error);
      setError(error.message || '쿠폰 다운로드에 실패했습니다.');
      toast({
        title: '쿠폰 다운로드 실패',
        description: error.message || '쿠폰 다운로드에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
      bg="gray.50"
      display="flex"
      flexDirection="column"
      w="100%"
      overflowX="hidden"
      position="relative"
    >
      {/* 상단 헤더 - 고정 위치 */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
        width="100%"
        py={3}
        position="sticky"
        top={0}
        zIndex={100}
        boxShadow="sm"
      >
        <Container maxW="container.lg">
          <Flex align="center" justify="space-between" position="relative">
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              cursor="pointer"
              onClick={() => navigate('/')}
              mx="auto"
            >
              <Box
                bg="blue.500"
                w="36px"
                h="36px"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="lg"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 'lg',
                  background:
                    'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)',
                  opacity: 0.8,
                }}
              >
                <Text
                  color="white"
                  fontSize="xl"
                  fontWeight="black"
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

            <Box
              position="absolute"
              right={0}
              display="flex"
              alignItems="center"
              gap={4}
            >
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
                    bg="gray.50"
                    _hover={{ bg: 'gray.100' }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <SearchIcon boxSize={5} color="gray.600" />
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  w={{ base: '90vw', sm: '400px', md: '500px' }}
                  p={4}
                  boxShadow="xl"
                  border="none"
                  borderRadius="xl"
                  bg="white"
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
                        borderRadius="full"
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
                        )} - ${format(
                          dateRange[0].endDate,
                          'yyyy년 MM월 dd일'
                        )}`}
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        readOnly
                        cursor="pointer"
                        borderRadius="full"
                      />
                    </InputGroup>

                    <Select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      borderRadius="full"
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
                      borderRadius="full"
                    >
                      검색
                    </Button>
                  </VStack>
                </PopoverContent>
              </Popover>
            </Box>
          </Flex>
        </Container>
      </Box>

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
            rangeColors={['#3182CE']}
          />
        </Box>
      )}

      {/* 본문 영역 - 스크롤 가능하도록 설정 */}
      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        pb="60px" // 하단 네비게이션 바 높이만큼 여백 추가
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '24px',
          },
        }}
      >
        <Container maxW="container.md" py={6}>
          {error && (
            <Text color="red.500" textAlign="center" mb={4}>
              {error}
            </Text>
          )}
          <VStack spacing={6} align="stretch">
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
                borderRadius="xl"
                py={6}
                fontSize="lg"
                fontWeight="bold"
                boxShadow="md"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                _active={{
                  transform: 'translateY(0)',
                }}
              >
                숙소 예약하기
              </Button>
            </Box>

            <Box w="100%" mb={4}>
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="bold"
                mb={3}
                color="gray.700"
              >
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
                      h={{ base: '240px', sm: '300px', md: '400px' }}
                      borderRadius="xl"
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
                          boxShadow="md"
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
                        spacing={2}
                      >
                        <Text
                          color="white"
                          fontSize={{ base: 'xl', md: '2xl' }}
                          fontWeight="bold"
                          letterSpacing="tight"
                          transition="all 0.3s ease"
                          _groupHover={{ transform: 'translateY(-2px)' }}
                        >
                          {hotel.hotelName || hotel.name}
                        </Text>
                        <Text
                          color="gray.100"
                          fontSize={{ base: 'sm', md: 'md' }}
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
              <Box w="100%" bg="white" borderRadius="xl" boxShadow="md" p={4}>
                <Flex justify="space-between" align="center">
                  <Box textAlign="center">
                    <Text fontSize="xs" color="gray.500">
                      방문 횟수
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      {customer.totalVisits || 0}
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="xs" color="gray.500">
                      포인트
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      {(customer.points || 0).toLocaleString()}P
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="xs" color="gray.500">
                      쿠폰
                    </Text>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      {coupons.length}개
                    </Text>
                  </Box>
                </Flex>
              </Box>
            )}

            {customer && (
              <Box w="100%" mb={4}>
                <Button
                  w="100%"
                  size="lg"
                  variant="outline"
                  colorScheme="teal"
                  onClick={() => navigate('/coupon-wallet')}
                  borderRadius="xl"
                  py={6}
                  fontSize="lg"
                  fontWeight="bold"
                  boxShadow="md"
                  rightIcon={<ChevronRightIcon />}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                >
                  쿠폰 보관함
                </Button>
              </Box>
            )}

            {customer && availableCoupons.length > 0 && (
              <Box w="100%" mb={4}>
                <Text
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="bold"
                  mb={3}
                  color="gray.700"
                >
                  사용 가능 쿠폰
                </Text>
                <VStack spacing={3}>
                  {availableCoupons.map((coupon) => (
                    <Box
                      key={coupon.couponUuid}
                      bg="white"
                      p={4}
                      rounded="lg"
                      shadow="sm"
                      w="100%"
                    >
                      <Text fontWeight="bold">{coupon.name}</Text>
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
                      >
                        다운로드
                      </Button>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            <Box w="100%" position="relative" mb={4}>
              <Box
                position="relative"
                w="100%"
                h={{ base: '80px', sm: '100px', md: '133px' }}
                bg="gray.900"
                borderRadius="xl"
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
                            transform: `scale(${
                              Math.random() + 0.5
                            }) translate(${Math.random() * 200 - 100}px, ${
                              Math.random() * 200 - 100
                            }px)`,
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
                      fontSize={{ base: 'xl', md: '2xl' }}
                      fontWeight="bold"
                      mb={2}
                      textShadow="0 2px 4px rgba(0,0,0,0.3)"
                    >
                      이벤트
                    </Text>
                    <Text
                      fontSize={{ base: 'sm', md: 'md' }}
                      opacity={0.9}
                      textShadow="0 1px 2px rgba(0,0,0,0.3)"
                    >
                      클릭하여 이벤트 확인하기
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* 하단 네비게이션 바 */}
      <BottomNavigation />
    </Box>
  );
};

export default Home;