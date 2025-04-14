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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
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

const Home = () => {
  const navigate = useNavigate();
  const { customer } = useAuth();
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

  const handleSearch = () => {
    const checkIn = dateRange[0].startDate;
    const checkOut = dateRange[0].endDate;
    if (!isValid(checkIn) || !isValid(checkOut)) {
      alert('날짜가 올바르지 않습니다.');
      return;
    }

    navigate('/hotels', {
      state: {
        searchQuery,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        guestCount,
      },
    });
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
        <HStack spacing={2}>
          {dots}
        </HStack>
      </Box>
    ),
  };

  const recommendedHotels = [
    { 
      id: 1, 
      name: '부산 호텔', 
      image: '/assets/hotel1.jpg', 
      rating: 4.5,
      description: '해운대 해변 전망 객실',
      tag: 'BEST HOT',
      color: 'blue'
    },
    { 
      id: 2, 
      name: '서울 호텔', 
      image: '/assets/hotel2.jpg', 
      rating: 4.8,
      description: '도심 속 프리미엄 스위트',
      tag: 'SPECIAL',
      color: 'purple'
    },
    { 
      id: 3, 
      name: '제주 호텔', 
      image: '/assets/hotel3.jpg', 
      rating: 4.2,
      description: '자연과 함께하는 리조트',
      tag: 'HOT',
      color: 'green'
    },
    { 
      id: 4, 
      name: '대구 호텔', 
      image: '/assets/hotel4.jpg', 
      rating: 4.6,
      description: '비즈니스 여행객 추천',
      tag: 'NEW',
      color: 'orange'
    },
    { 
      id: 5, 
      name: '광주 호텔', 
      image: '/assets/hotel5.jpg', 
      rating: 4.7,
      description: '문화 중심지 인근 호텔',
      tag: 'BEST HOT',
      color: 'blue'
    },
    { 
      id: 6, 
      name: '인천 호텔', 
      image: '/assets/hotel6.jpg', 
      rating: 4.9,
      description: '공항 근처 프리미엄 호텔',
      tag: 'SPECIAL',
      color: 'purple'
    },
    { 
      id: 7, 
      name: '울산 호텔', 
      image: '/assets/hotel7.jpg', 
      rating: 4.3,
      description: '산업단지 인근 편리한 위치',
      tag: 'HOT',
      color: 'green'
    },
    { 
      id: 8, 
      name: '경주 호텔', 
      image: '/assets/hotel8.jpg', 
      rating: 4.1,
      description: '역사 문화 체험 호텔',
      tag: 'NEW',
      color: 'orange'
    },
    { 
      id: 9, 
      name: '춘천 호텔', 
      image: '/assets/hotel9.jpg', 
      rating: 4.4,
      description: '호수 전망 레이크뷰 호텔',
      tag: 'BEST HOT',
      color: 'blue'
    },
    { 
      id: 10, 
      name: '속초 호텔', 
      image: '/assets/hotel10.jpg', 
      rating: 4.0,
      description: '해변 산책로 인근 호텔',
      tag: 'SPECIAL',
      color: 'purple'
    },
    { 
      id: 11, 
      name: '여수 호텔', 
      image: '/assets/hotel11.jpg', 
      rating: 4.8,
      description: '해양 도시 전망 호텔',
      tag: 'HOT',
      color: 'green'
    },
  ];

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      flexDirection="column"
      w="100%"
      overflowX="hidden"
    >
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
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: "lg",
                  background: "linear-gradient(135deg, #4299E1 0%, #3182CE 100%)",
                  opacity: 0.8,
                }}
              >
                <Text color="white" fontSize="xl" fontWeight="black" position="relative" zIndex={1}>
                  단
                </Text>
              </Box>
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="gray.800" letterSpacing="tight">
                  단잠
                </Text>
                <Text fontSize="xs" color="gray.500" letterSpacing="wider" lineHeight="1">
                  SWEET DREAMS
                </Text>
              </Box>
            </Box>

            <Box position="absolute" right={0} display="flex" alignItems="center" gap={4}>
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
                    _hover={{ bg: "gray.100" }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <SearchIcon boxSize={5} color="gray.600" />
                  </Box>
                </PopoverTrigger>
                <PopoverContent
                  w="300px"
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
                        placeholder="목적지 검색 (예: 부산)"
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
                        value={`${format(dateRange[0].startDate, 'yyyy년 MM월 dd일')} - ${format(dateRange[0].endDate, 'yyyy년 MM월 dd일')}`}
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

              {!customer && (
                <HStack spacing={2}>
                  <Button
                    variant="ghost"
                    size="sm"
                    color="gray.600"
                    onClick={() => navigate('/login')}
                  >
                    로그인
                  </Button>
                  <Button
                    variant="solid"
                    size="sm"
                    colorScheme="blue"
                    onClick={() => navigate('/signup')}
                  >
                    회원가입
                  </Button>
                </HStack>
              )}
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

      <Box flex={1} overflowY="auto">
        <Container maxW="container.md" py={6}>
          <VStack spacing={6} align="stretch">
            <Box w="100%" mb={4}>
              <Text 
                fontSize={{ base: "md", md: "lg" }} 
                fontWeight="bold" 
                mb={3}
                color="gray.700"
              >
                추천 호텔
              </Text>
              <Box>
                <Slider {...sliderSettings}>
                  {recommendedHotels.map((hotel) => (
                    <Box
                      key={hotel.id}
                      onClick={() => navigate('/hotels')}
                      position="relative"
                      cursor="pointer"
                      h={{ base: "240px", sm: "300px", md: "400px" }}
                      borderRadius="xl"
                      overflow="hidden"
                      role="group"
                    >
                      <Image
                        src={hotel.image}
                        alt={`${hotel.name} 호텔 이미지`}
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
                        _groupHover={{ bgGradient: 'linear(to-t, blackAlpha.800, blackAlpha.400)' }}
                      />
                      <Box
                        position="absolute"
                        top={4}
                        right={4}
                      >
                        <Badge
                          colorScheme={hotel.color}
                          fontSize="xs"
                          px={3}
                          py={1}
                          borderRadius="full"
                          boxShadow="md"
                        >
                          {hotel.tag}
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
                          fontSize={{ base: "xl", md: "2xl" }}
                          fontWeight="bold"
                          letterSpacing="tight"
                          transition="all 0.3s ease"
                          _groupHover={{ transform: 'translateY(-2px)' }}
                        >
                          {hotel.name}
                        </Text>
                        <Text
                          color="gray.100"
                          fontSize={{ base: "sm", md: "md" }}
                          opacity={0.9}
                          transition="all 0.3s ease"
                          _groupHover={{ opacity: 1 }}
                        >
                          {hotel.description}
                        </Text>
                        <HStack spacing={1}>
                          <Text color="yellow.300" fontSize="sm" fontWeight="bold">
                            {hotel.rating}
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
              <Box
                w="100%"
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                p={4}
              >
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
                </Flex>
              </Box>
            )}

            <Box w="100%" position="relative" mb={4}>
              <Box
                position="relative"
                w="100%"
                h={{ base: "80px", sm: "100px", md: "133px" }}
                bg="gray.900"
                borderRadius="xl"
                overflow="hidden"
                boxShadow="md"
                cursor="pointer"
                onClick={() => {
                  const button = document.getElementById('animation-button');
                  button.style.animation = 'bounceAndDisappear 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
                  
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
                    '20%': { transform: 'scale(1.2) translateY(-20px)', opacity: 0.9 },
                    '40%': { transform: 'scale(0.9) translateY(10px)', opacity: 0.8 },
                    '60%': { transform: 'scale(1.1) translateY(-10px)', opacity: 0.7 },
                    '80%': { transform: 'scale(0.8) translateY(5px)', opacity: 0.5 },
                    '100%': { transform: 'scale(0)', opacity: 0 }
                  }
                }}
              >
                {/* Dynamic Animation Area */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  overflow="hidden"
                >
                  {/* Animated Background */}
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
                        '100%': { transform: 'scale(1.5) rotate(360deg)' }
                      }
                    }}
                  />

                  {/* Animated Patterns */}
                  {[...Array(20)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w={`${Math.random() * 100 + 50}px`}
                      h={`${Math.random() * 100 + 50}px`}
                      bg="rgba(255, 255, 255, 0.1)"
                      backdropFilter="blur(5px)"
                      borderRadius="lg"
                      animation={`floatPattern${i} ${Math.random() * 10 + 15}s infinite linear`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                        [`@keyframes floatPattern${i}`]: {
                          '0%': { 
                            transform: `translate(0, 0) rotate(${Math.random() * 360}deg)`,
                            opacity: Math.random() * 0.5 + 0.3
                          },
                          '50%': { 
                            transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(${Math.random() * 360}deg)`,
                            opacity: Math.random() * 0.8 + 0.2
                          },
                          '100%': { 
                            transform: `translate(0, 0) rotate(${Math.random() * 360}deg)`,
                            opacity: Math.random() * 0.5 + 0.3
                          }
                        }
                      }}
                    />
                  ))}

                  {/* Light Beams */}
                  {[...Array(5)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w="2px"
                      h="100%"
                      bg="white"
                      opacity="0.3"
                      animation={`lightBeam${i} ${Math.random() * 5 + 5}s infinite linear`}
                      sx={{
                        left: `${Math.random() * 100}%`,
                        [`@keyframes lightBeam${i}`]: {
                          '0%': { transform: 'translateY(-100%) rotate(45deg)', opacity: 0 },
                          '50%': { opacity: 0.3 },
                          '100%': { transform: 'translateY(100%) rotate(45deg)', opacity: 0 }
                        }
                      }}
                    />
                  ))}

                  {/* Interactive Particles */}
                  {[...Array(30)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w="4px"
                      h="4px"
                      bg="white"
                      borderRadius="full"
                      animation={`particle${i} ${Math.random() * 20 + 10}s infinite linear`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        [`@keyframes particle${i}`]: {
                          '0%': { 
                            transform: 'scale(1) translate(0, 0)',
                            opacity: Math.random() * 0.5 + 0.3
                          },
                          '50%': { 
                            transform: `scale(${Math.random() + 0.5}) translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px)`,
                            opacity: Math.random() * 0.8 + 0.2
                          },
                          '100%': { 
                            transform: 'scale(1) translate(0, 0)',
                            opacity: Math.random() * 0.5 + 0.3
                          }
                        }
                      }}
                    />
                  ))}

                  {/* Event Text */}
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
                      fontSize={{ base: "xl", md: "2xl" }}
                      fontWeight="bold"
                      mb={2}
                      textShadow="0 2px 4px rgba(0,0,0,0.3)"
                    >
                      이벤트
                    </Text>
                    <Text
                      fontSize={{ base: "sm", md: "md" }}
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
    </Box>
  );
};

export default Home;