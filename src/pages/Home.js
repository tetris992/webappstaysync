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
  PopoverBody,
  PopoverArrow,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon, CalendarIcon, ArrowForwardIcon } from '@chakra-ui/icons';
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
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 스크롤 이벤트 리스너 추가 (필요한 경우 사용)
    const updateScrollPosition = () => {
      // 스크롤 위치 업데이트 로직
    };

    window.addEventListener("scroll", updateScrollPosition);
    return () => window.removeEventListener("scroll", updateScrollPosition);
  }, []);

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
    const { startDate, endDate } = item.selection;
    if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
      setIsOpen(false);
      toast({
        title: '날짜 선택 완료',
        description: `${format(startDate, 'yyyy-MM-dd')} ~ ${format(endDate, 'yyyy-MM-dd')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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
          {dots.map((dot, index) => (
            <Box
              key={index}
              w="6px"
              h="6px"
              bg={
                dot.props.className.includes('slick-active')
                  ? 'black'
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
    customPaging: () => <Box w="6px" h="6px" borderRadius="full" />,
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

  const startLabel = isValid(dateRange[0].startDate)
    ? format(dateRange[0].startDate, 'yyyy-MM-dd')
    : '';
  const endLabel = isValid(dateRange[0].endDate)
    ? format(dateRange[0].endDate, 'yyyy-MM-dd')
    : '';

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      flexDirection="column"
      w="100%"
    >
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        width="100%"
        py={4}
      >
        <Container maxW="container.sm">
          <Flex align="center" justify="center" position="relative">
            <Box
              position="relative"
              display="flex"
              flexDirection="column"
              alignItems="center"
              p={4}
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
              boxShadow="sm"
              bg="white"
              _before={{
                content: '""',
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                border: '1px solid',
                borderColor: 'blue.200',
                borderRadius: 'lg',
                zIndex: -1,
              }}
            >
              <Text
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                fontWeight="bold"
                color="blue.700"
                letterSpacing="tight"
                position="relative"
                display="inline-block"
                textAlign="center"
              >
                단 잠
              </Text>
              <Text
                fontSize={{ base: "xs", md: "sm" }}
                color="gray.600"
                mt={1}
                letterSpacing="wider"
                fontWeight="medium"
                textTransform="uppercase"
                opacity={0.9}
                textAlign="center"
              >
                편안한 후불예약
              </Text>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Box
        flex={1}
        overflowY="auto"
        sx={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.300',
            borderRadius: '24px',
          },
        }}
      >
        <Container
          maxW={{ base: "100%", sm: "95%", md: "container.md" }}
          py={{ base: 4, sm: 6 }}
          px={{ base: 4, sm: 6 }}
        >
          <VStack
            spacing={4}
            align="stretch"
            w="100%"
            pb={{ base: "90px", md: "100px" }}
          >
            <VStack 
              spacing={{ base: 3, sm: 4 }} 
              w="100%"
              align="center"
            >
              <InputGroup size={{ base: "md", md: "lg" }} w="100%">
                <InputLeftElement pointerEvents="none" h="100%">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="목적지 검색 (예: 부산)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderColor="gray.200"
                  borderRadius="full"
                  bg="white"
                  boxShadow="sm"
                  _hover={{ borderColor: 'brand.500' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px rgba(49, 151, 149, 0.2)',
                  }}
                  fontSize={{ base: "sm", md: "md" }}
                  h={{ base: "48px", md: "52px" }}
                />
              </InputGroup>

              <Popover
                placement="bottom"
                isOpen={isOpen}
                onOpen={() => setIsOpen(true)}
                onClose={() => setIsOpen(false)}
                closeOnBlur={true}
              >
                <PopoverTrigger>
                  <InputGroup size={{ base: "sm", md: "md" }} w="100%" cursor="pointer">
                    <InputLeftElement pointerEvents="none">
                      <CalendarIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                      readOnly
                      borderColor="gray.200"
                      borderRadius="full"
                      bg="white"
                      boxShadow="sm"
                      _hover={{ borderColor: 'brand.500' }}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px rgba(49, 151, 149, 0.2)',
                      }}
                      fontSize={{ base: "sm", md: "md" }}
                      h={{ base: "40px", md: "45px" }}
                      value={startLabel && endLabel ? `${startLabel} ~ ${endLabel}` : '날짜 선택'}
                    />
                  </InputGroup>
                </PopoverTrigger>
                <PopoverContent
                  zIndex={1500}
                  w="fit-content"
                  maxW="95vw"
                  mx="auto"
                  textAlign="center"
                >
                  <PopoverArrow />
                  <PopoverBody p={{ base: 2, md: 4 }}>
                    <Box
                      maxW="100%"
                      overflowX="auto"
                      sx={{
                        '.rdrMonth': {
                          width: { base: '100%', md: 'auto' }
                        }
                      }}
                    >
                      <DateRange
                        editableDateInputs={true}
                        onChange={handleDateChange}
                        moveRangeOnFirstSelection={false}
                        ranges={dateRange}
                        months={window.innerWidth > 768 ? 2 : 1}
                        direction={window.innerWidth > 768 ? "horizontal" : "vertical"}
                        locale={ko}
                        minDate={startOfDay(new Date())}
                        maxDate={addMonths(startOfDay(new Date()), 3)}
                        rangeColors={['#3182CE']}
                        showSelectionPreview={true}
                        showDateDisplay={true}
                        retainEndDateOnFirstSelection={true}
                      />
                    </Box>
                  </PopoverBody>
                </PopoverContent>
              </Popover>

              <Select
                size={{ base: "sm", md: "md" }}
                w="100%"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                borderColor="gray.200"
                borderRadius="full"
                bg="white"
                boxShadow="sm"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px rgba(49, 151, 149, 0.2)',
                }}
                fontSize={{ base: "sm", md: "md" }}
                h={{ base: "40px", md: "45px" }}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}명
                  </option>
                ))}
              </Select>

              <Button
                variant="solid"
                w="100%"
                onClick={handleSearch}
                size={{ base: "md", md: "lg" }}
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="700"
                h={{ base: "48px", md: "52px" }}
                bgGradient="linear(to-r, blue.600, teal.500)"
                color="white"
                borderRadius="full"
                boxShadow="0 4px 12px rgba(49, 151, 149, 0.3)"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(49, 151, 149, 0.4)',
                  bgGradient: 'linear(to-r, blue.700, teal.600)',
                  color: 'yellow.200',
                }}
                _active={{ 
                  transform: 'translateY(1px)',
                  boxShadow: '0 2px 8px rgba(49, 151, 149, 0.3)',
                }}
                transition="all 0.3s ease"
                rightIcon={<ArrowForwardIcon />}
              >
                숙소 예약하기
              </Button>
            </VStack>

            <Box w="100%" mb={{ base: 3, sm: 4 }}>
              <Text 
                fontSize={{ base: "md", md: "lg" }} 
                fontWeight="bold" 
                mb={{ base: 2, md: 3 }} 
                color="gray.700"
                px={1}
              >
                추천 호텔
              </Text>
              <Box
                sx={{
                  '.slick-slide': {
                    px: { base: 1, md: 2 }
                  },
                  '.slick-list': {
                    mx: { base: -1, md: -2 }
                  }
                }}
              >
                <Slider {...sliderSettings}>
                  {recommendedHotels.map((hotel) => (
                    <Box
                      key={hotel.id}
                      onClick={() => navigate(`/rooms/${hotel.id}`)}
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
                p={{ base: 4, sm: 5 }}
                bg="white"
                borderRadius="xl"
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
                  const container = document.getElementById('animation-container');
                  const elements = container.querySelectorAll('.animation-element');
                  
                  // 애니메이션 요소들이 퍼져나가는 효과
                  elements.forEach((element, index) => {
                    element.style.animation = `spreadOut 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`;
                    element.style.animationDelay = `${index * 0.05}s`;
                  });
                  
                  // 이벤트 페이지 확장 애니메이션
                  const eventPage = document.createElement('div');
                  eventPage.className = 'event-page-expand';
                  
                  // 애니메이션 영역의 위치와 크기 정보 가져오기
                  const rect = container.getBoundingClientRect();
                  eventPage.style.top = `${rect.top}px`;
                  eventPage.style.left = `${rect.left}px`;
                  eventPage.style.width = `${rect.width}px`;
                  eventPage.style.height = `${rect.height}px`;
                  
                  document.body.appendChild(eventPage);
                  
                  // 애니메이션 시작
                  setTimeout(() => {
                    eventPage.classList.add('expanded');
                  }, 100);
                  
                  setTimeout(() => {
                    navigate('/events');
                  }, 1500);
                }}
                id="animation-container"
                _hover={{
                  transform: 'scale(1.02)',
                  boxShadow: '0 6px 16px rgba(159, 122, 234, 0.4)',
                }}
                _active={{
                  transform: 'scale(0.98)',
                }}
                sx={{
                  '@keyframes spreadOut': {
                    '0%': { 
                      transform: 'translate(0, 0) scale(1)',
                      opacity: 1,
                      backgroundColor: 'var(--original-color, white)'
                    },
                    '50%': { 
                      transform: 'translate(var(--spread-x, 100px), var(--spread-y, -100px)) scale(1.5)',
                      opacity: 0.8,
                      backgroundColor: 'var(--spread-color, #FF6B6B)'
                    },
                    '100%': { 
                      transform: 'translate(var(--spread-x, 100px), var(--spread-y, -100px)) scale(0)',
                      opacity: 0,
                      backgroundColor: 'var(--spread-color, #FF6B6B)'
                    }
                  },
                  '.event-page-expand': {
                    position: 'fixed',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    zIndex: 1000,
                    borderRadius: 'xl',
                    overflow: 'hidden',
                    transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.expanded': {
                      top: '0',
                      left: '0',
                      width: '100%',
                      height: '100%',
                      borderRadius: '0',
                    }
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
                    className="animation-element"
                    sx={{
                      '--spread-x': '200px',
                      '--spread-y': '-200px',
                      '--spread-color': '#FF6B6B',
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
                      className="animation-element"
                      animation={`floatPattern${i} ${Math.random() * 10 + 15}s infinite linear`}
                      sx={{
                        '--spread-x': `${Math.random() * 400 - 200}px`,
                        '--spread-y': `${Math.random() * 400 - 200}px`,
                        '--spread-color': i % 3 === 0 ? '#FF6B6B' : i % 3 === 1 ? '#4ECDC4' : '#FFE66D',
                        '--original-color': 'rgba(255, 255, 255, 0.1)',
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
                      className="animation-element"
                      animation={`lightBeam${i} ${Math.random() * 5 + 5}s infinite linear`}
                      sx={{
                        '--spread-x': `${Math.random() * 300 - 150}px`,
                        '--spread-y': `${Math.random() * 300 - 150}px`,
                        '--spread-color': '#FF9F1C',
                        '--original-color': 'white',
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
                      className="animation-element"
                      animation={`particle${i} ${Math.random() * 20 + 10}s infinite linear`}
                      sx={{
                        '--spread-x': `${Math.random() * 500 - 250}px`,
                        '--spread-y': `${Math.random() * 500 - 250}px`,
                        '--spread-color': i % 5 === 0 ? '#FF6B6B' : 
                                         i % 5 === 1 ? '#4ECDC4' : 
                                         i % 5 === 2 ? '#FFE66D' : 
                                         i % 5 === 3 ? '#FF9F1C' : '#A8E6CF',
                        '--original-color': 'white',
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