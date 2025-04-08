import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { SearchIcon, CalendarIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format, addDays, startOfDay, addMonths } from 'date-fns';

const Home = () => {
  const navigate = useNavigate();
  const { customer, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState([
    {
      startDate: startOfDay(new Date()),
      endDate: addDays(startOfDay(new Date()), 1),
      key: 'selection',
    },
  ]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [guestCount, setGuestCount] = useState(1);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = () => {
    navigate('/hotels', {
      state: {
        searchQuery,
        checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
        checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
        guestCount,
      },
    });
  };

  const handleDateChange = (ranges) => {
    const { selection } = ranges;
    setDateRange([selection]);
    if (selection.startDate && selection.endDate) {
      setShowCalendar(false);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false, // Hide default arrows for a cleaner look
    appendDots: (dots) => (
      <Box
        position="absolute"
        bottom="10px"
        width="100%"
        display="flex"
        justifyContent="center"
        zIndex={10}
      >
        <HStack spacing={2}>
          {dots.map((dot, index) => (
            <Box
              key={index}
              w="10px"
              h="10px"
              bg={
                dot.props.className.includes('slick-active')
                  ? 'white'
                  : 'gray.300'
              }
              borderRadius="full"
              opacity={0.8}
              boxShadow="0 0 5px rgba(0, 0, 0, 0.3)"
              transition="background-color 0.3s ease"
              _hover={{ opacity: 1 }}
            />
          ))}
        </HStack>
      </Box>
    ),
    customPaging: () => <Box w="10px" h="10px" borderRadius="full" />,
  };

  // Recommended hotels data
  const recommendedHotels = [
    { id: 1, name: '부산 호텔', image: '/assets/hotel1.jpg', rating: 4.5 },
    { id: 2, name: '서울 호텔', image: '/assets/hotel2.jpg', rating: 4.8 },
    { id: 3, name: '제주 호텔', image: '/assets/hotel3.jpg', rating: 4.2 },
    { id: 4, name: '대구 호텔', image: '/assets/hotel4.jpg', rating: 4.6 },
    { id: 5, name: '광주 호텔', image: '/assets/hotel5.jpg', rating: 4.7 },
    { id: 6, name: '인천 호텔', image: '/assets/hotel6.jpg', rating: 4.9 },
    { id: 7, name: '울산 호텔', image: '/assets/hotel7.jpg', rating: 4.3 },
    { id: 8, name: '경주 호텔', image: '/assets/hotel8.jpg', rating: 4.1 },
    { id: 9, name: '춘천 호텔', image: '/assets/hotel9.jpg', rating: 4.4 },
    { id: 10, name: '속초 호텔', image: '/assets/hotel10.jpg', rating: 4.0 },
    { id: 11, name: '여수 호텔', image: '/assets/hotel11.jpg', rating: 4.8 },
  ];

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Container
        maxW="container.sm"
        py={{ base: 4, md: 6 }}
        minH="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <VStack
          spacing={{ base: 4, md: 6 }}
          flex="1"
          justifyContent="center"
          align="center"
        >
          {/* Title and Subtitle */}
          <VStack spacing={1}>
            <Text
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="bold"
              textAlign="center"
              color="gray.800"
              bgGradient="linear(to-r, brand.500, teal.400)"
              bgClip="text"
              letterSpacing="tight"
            >
              단잠: 간편한 후불예약
            </Text>
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              textAlign="center"
              color="gray.500"
              opacity={0.7}
              lineHeight="shorter"
            >
              간편하게 호텔을 예약하고 내 예약 정보를 확인해 보세요.
            </Text>
          </VStack>

          {/* Search Bar */}
          <VStack spacing={3} w="full">
            <InputGroup w={{ base: '90%', sm: '80%', md: 'sm' }}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="목적지 검색 (예: 부산)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderColor="gray.300"
                borderRadius="full"
                bg="white"
                boxShadow="sm"
                _hover={{ borderColor: 'brand.500', boxShadow: 'md' }}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
                }}
                transition="all 0.3s ease"
              />
            </InputGroup>
            <HStack spacing={2} w={{ base: '90%', sm: '80%', md: 'sm' }}>
              <InputGroup flex="1">
                <InputLeftElement pointerEvents="none">
                  <CalendarIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  value={format(dateRange[0].startDate, 'yyyy-MM-dd')}
                  onClick={() => setShowCalendar(true)}
                  readOnly
                  pl="2.5rem"
                  aria-label="체크인 날짜 선택"
                  borderColor="gray.300"
                  borderRadius="full"
                  bg="white"
                  boxShadow="sm"
                  _hover={{ borderColor: 'brand.500', boxShadow: 'md' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
                  }}
                  transition="all 0.3s ease"
                />
              </InputGroup>
              <InputGroup flex="1">
                <InputLeftElement pointerEvents="none">
                  <CalendarIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  value={format(dateRange[0].endDate, 'yyyy-MM-dd')}
                  onClick={() => setShowCalendar(true)}
                  readOnly
                  pl="2.5rem"
                  aria-label="체크아웃 날짜 선택"
                  borderColor="gray.300"
                  borderRadius="full"
                  bg="white"
                  boxShadow="sm"
                  _hover={{ borderColor: 'brand.500', boxShadow: 'md' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
                  }}
                  transition="all 0.3s ease"
                />
              </InputGroup>
            </HStack>
            {showCalendar && (
              <Box
                position="absolute"
                zIndex={1000}
                bg="white"
                boxShadow="lg"
                borderRadius="md"
                p={4}
                border="1px solid"
                borderColor="gray.200"
              >
                <DateRange
                  editableDateInputs={true}
                  onChange={handleDateChange}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  minDate={startOfDay(new Date())}
                  maxDate={addMonths(startOfDay(new Date()), 3)}
                  direction="horizontal"
                  rangeColors={['#319795']}
                />
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                  mt={2}
                  w="full"
                  borderRadius="full"
                >
                  닫기
                </Button>
              </Box>
            )}
            <Select
              w={{ base: '90%', sm: '80%', md: 'sm' }}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              placeholder="인원 수 선택"
              borderColor="gray.300"
              borderRadius="full"
              bg="white"
              boxShadow="sm"
              _hover={{ borderColor: 'brand.500', boxShadow: 'md' }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
              }}
              transition="all 0.3s ease"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}명
                </option>
              ))}
            </Select>
            <Button
              colorScheme="brand"
              w={{ base: '90%', sm: '80%', md: 'sm' }}
              onClick={handleSearch}
              borderRadius="full"
              boxShadow="md"
              _hover={{
                bg: 'brand.600',
                transform: 'scale(1.05)',
                boxShadow: 'lg',
              }}
              _active={{ bg: 'brand.700', transform: 'scale(0.95)' }}
              transition="all 0.3s ease"
            >
              검색
            </Button>
          </VStack>

          {/* Recommended Hotels Carousel */}
          <Box w={{ base: '90%', sm: '80%', md: 'sm' }} mb={4}>
            <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.700">
              추천 호텔
            </Text>
            <Slider {...sliderSettings}>
              {recommendedHotels.map((hotel) => (
                <Box
                  key={hotel.id}
                  onClick={() => navigate(`/rooms/${hotel.id}`)}
                  position="relative"
                  cursor="pointer"
                >
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    h="200px"
                    w="100%"
                    objectFit="cover"
                    borderRadius="lg"
                    boxShadow="md"
                  />
                  {/* Gradient Overlay for Text Readability */}
                  <Box
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    h="60px"
                    bgGradient="linear(to-t, rgba(0, 0, 0, 0.7), transparent)"
                    borderBottomRadius="lg"
                  />
                  <Text
                    position="absolute"
                    bottom="20px"
                    left="0"
                    right="0"
                    fontSize="md"
                    fontWeight="bold"
                    textAlign="center"
                    color="white"
                    textShadow="0 1px 2px rgba(0, 0, 0, 0.5)"
                  >
                    {hotel.name}
                  </Text>
                </Box>
              ))}
            </Slider>
          </Box>

          {/* User Status */}
          {customer && (
            <Box
              w={{ base: '90%', sm: '80%', md: 'sm' }}
              p={4}
              bg="white"
              borderRadius="lg"
              boxShadow="md"
              transition="all 0.3s ease"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
            >
              <Text
                fontSize="md"
                fontWeight="bold"
                textAlign="center"
                mb={2}
                color="gray.700"
              >
                History
              </Text>
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
                    {(customer.points || 0).toLocaleString()}점
                  </Text>
                </Box>
              </Flex>
            </Box>
          )}

          {/* Navigation Buttons */}
          <Button
            variant="homeButtonSecondary"
            onClick={() => navigate('/history')}
            w={{ base: '90%', sm: '80%', md: 'sm' }}
            size="md"
            borderRadius="full"
            boxShadow="md"
            _hover={{
              bg: 'teal.50',
              transform: 'scale(1.05)',
              boxShadow: 'lg',
            }}
            _active={{ transform: 'scale(0.95)' }}
            transition="all 0.3s ease"
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
              borderRadius="full"
              boxShadow="md"
              _hover={{
                bg: 'brand.50',
                transform: 'scale(1.05)',
                boxShadow: 'lg',
              }}
              _active={{ transform: 'scale(0.95)' }}
              transition="all 0.3s ease"
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
              borderRadius="full"
              boxShadow="md"
              _hover={{
                bg: 'red.50',
                transform: 'scale(1.05)',
                boxShadow: 'lg',
              }}
              _active={{ transform: 'scale(0.95)' }}
              transition="all 0.3s ease"
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
