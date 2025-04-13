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
                h={{ base: "240px", sm: "300px", md: "400px" }}
                bg="black"
                borderRadius="xl"
                overflow="hidden"
                boxShadow="md"
                onClick={(e) => {
                  // Create ripple effect
                  const ripple = document.createElement('div');
                  ripple.className = 'ripple';
                  ripple.style.left = `${e.clientX - e.currentTarget.getBoundingClientRect().left}px`;
                  ripple.style.top = `${e.clientY - e.currentTarget.getBoundingClientRect().top}px`;
                  e.currentTarget.appendChild(ripple);
                  
                  // Remove ripple after animation completes
                  setTimeout(() => {
                    ripple.remove();
                  }, 1000);
                }}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  '.ripple': {
                    position: 'absolute',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    animation: 'ripple 1s linear',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 10,
                  },
                  '@keyframes ripple': {
                    to: {
                      transform: 'scale(4)',
                      opacity: 0,
                    }
                  }
                }}
              >
                {/* Cosmic Space Animation */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  overflow="hidden"
                  bg="black"
                >
                  {/* Space Background with Stars */}
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bgGradient="radial(circle at center, blue.900, black)"
                    opacity="0.8"
                  />
                  
                  {/* Stars */}
                  {[...Array(100)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w={`${Math.random() * 3 + 1}px`}
                      h={`${Math.random() * 3 + 1}px`}
                      bg="white"
                      borderRadius="full"
                      boxShadow={`0 0 ${Math.random() * 5 + 2}px rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`}
                      animation={`starTwinkle${i} ${Math.random() * 5 + 3}s infinite alternate`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        [`@keyframes starTwinkle${i}`]: {
                          '0%': { opacity: 0.3, transform: 'scale(1)' },
                          '100%': { opacity: 1, transform: 'scale(1.5)' }
                        }
                      }}
                    />
                  ))}
                  
                  {/* Nebula Clouds */}
                  {[...Array(5)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w={`${Math.random() * 200 + 100}px`}
                      h={`${Math.random() * 200 + 100}px`}
                      borderRadius="full"
                      bgGradient={`radial(circle at center, ${i % 3 === 0 ? 'purple.500' : i % 3 === 1 ? 'pink.500' : 'blue.500'}, transparent)`}
                      opacity="0.3"
                      animation={`nebulaFloat${i} ${Math.random() * 20 + 20}s infinite alternate`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        [`@keyframes nebulaFloat${i}`]: {
                          '0%': { transform: 'translate(0, 0) scale(1)' },
                          '100%': { transform: 'translate(20px, 20px) scale(1.2)' }
                        }
                      }}
                    />
                  ))}
                  
                  {/* Central Portal */}
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    w="150px"
                    h="150px"
                    borderRadius="full"
                    bgGradient="radial(circle at center, blue.400, purple.600)"
                    boxShadow="0 0 30px rgba(66, 153, 225, 0.8)"
                    animation="portalPulse 5s infinite alternate"
                    sx={{
                      '@keyframes portalPulse': {
                        '0%': { transform: 'translate(-50%, -50%) scale(1)', boxShadow: '0 0 30px rgba(66, 153, 225, 0.8)' },
                        '100%': { transform: 'translate(-50%, -50%) scale(1.2)', boxShadow: '0 0 50px rgba(66, 153, 225, 0.8)' }
                      }
                    }}
                  >
                    {/* Event Button */}
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w="60px"
                      h="60px"
                      borderRadius="full"
                      bg="rgba(255, 255, 255, 0.1)"
                      backdropFilter="blur(5px)"
                      border="2px solid rgba(255, 255, 255, 0.2)"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      cursor="pointer"
                      transition="all 0.3s ease"
                      zIndex={20}
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.2)",
                        transform: "translate(-50%, -50%) scale(1.1)",
                      }}
                      onClick={() => {
                        const button = document.getElementById('portal-event-button');
                        button.style.animation = 'bounceAroundAndDisappear 4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
                        
                        // 애니메이션이 끝나고 페이지 이동
                        setTimeout(() => {
                          navigate('/events');
                        }, 3800);
                      }}
                      id="portal-event-button"
                      sx={{
                        '@keyframes bounceAroundAndDisappear': {
                          '0%': { 
                            transform: 'translate(-50%, -50%) scale(1)',
                            opacity: 1 
                          },
                          '10%': { 
                            transform: 'translate(-200%, -150%) scale(1.2)',
                            opacity: 0.9 
                          },
                          '20%': { 
                            transform: 'translate(150%, -100%) scale(0.9)',
                            opacity: 0.9 
                          },
                          '30%': { 
                            transform: 'translate(-150%, 150%) scale(1.1)',
                            opacity: 0.9 
                          },
                          '40%': { 
                            transform: 'translate(200%, 100%) scale(0.8)',
                            opacity: 0.9 
                          },
                          '50%': { 
                            transform: 'translate(-100%, -200%) scale(1.2)',
                            opacity: 0.9 
                          },
                          '60%': { 
                            transform: 'translate(100%, 150%) scale(0.9)',
                            opacity: 0.9 
                          },
                          '70%': { 
                            transform: 'translate(-150%, -50%) scale(1.1)',
                            opacity: 0.9 
                          },
                          '80%': { 
                            transform: 'translate(-50%, -50%) scale(1.2)',
                            opacity: 0.9 
                          },
                          '85%': { 
                            transform: 'translate(-50%, -50%) scale(1)',
                            opacity: 0.8
                          },
                          '90%': { 
                            transform: 'translate(-50%, -50%) scale(0.8)',
                            opacity: 0.6,
                            filter: 'brightness(1.2)'
                          },
                          '95%': { 
                            transform: 'translate(-50%, -50%) scale(0.4)',
                            opacity: 0.3,
                            filter: 'brightness(1.5)'
                          },
                          '100%': { 
                            transform: 'translate(-50%, -50%) scale(0)',
                            opacity: 0,
                            filter: 'brightness(2)'
                          }
                        }
                      }}
                    >
                      <Box
                        fontSize="1.5em"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        opacity={0.9}
                      >
                        🎉
                        <Box
                          position="absolute"
                          top="-2px"
                          right="-2px"
                          w="8px"
                          h="8px"
                          bg="yellow.300"
                          borderRadius="full"
                          boxShadow="0 0 0 2px rgba(255, 255, 255, 0.8)"
                          animation="pulse 1.5s infinite"
                          sx={{
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)', opacity: 1 },
                              '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                              '100%': { transform: 'scale(1)', opacity: 1 },
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Portal Rings */}
                    {[...Array(3)].map((_, i) => (
                      <Box
                        key={i}
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        w={`${150 + i * 30}px`}
                        h={`${150 + i * 30}px`}
                        borderRadius="full"
                        border={`2px solid ${i % 3 === 0 ? 'blue.300' : i % 3 === 1 ? 'purple.300' : 'pink.300'}`}
                        opacity="0.5"
                        animation={`ringRotate${i} ${10 + i * 5}s infinite linear`}
                        sx={{
                          [`@keyframes ringRotate${i}`]: {
                            '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                            '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' }
                          }
                        }}
                      />
                    ))}
                    
                    {/* Portal Core */}
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w="50px"
                      h="50px"
                      borderRadius="full"
                      bg="white"
                      boxShadow="0 0 20px rgba(255, 255, 255, 0.8)"
                      animation="corePulse 2s infinite alternate"
                      sx={{
                        '@keyframes corePulse': {
                          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
                          '100%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0.4 }
                        }
                      }}
                    />
                  </Box>
                  
                  {/* Floating Elements */}
                  {/* Geometric Shapes */}
                  {[...Array(10)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w={`${Math.random() * 30 + 20}px`}
                      h={`${Math.random() * 30 + 20}px`}
                      bg={i % 5 === 0 ? "blue.400" : i % 5 === 1 ? "purple.400" : i % 5 === 2 ? "pink.400" : i % 5 === 3 ? "teal.400" : "yellow.400"}
                      opacity="0.7"
                      animation={`shapeFloat${i} ${Math.random() * 15 + 10}s infinite alternate`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        clipPath: i % 3 === 0 ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : 
                                 i % 3 === 1 ? "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" : 
                                 "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                        [`@keyframes shapeFloat${i}`]: {
                          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                          '100%': { transform: 'translate(20px, 20px) rotate(360deg)' }
                        }
                      }}
                    />
                  ))}
                  
                  {/* Energy Particles */}
                  {[...Array(20)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w="4px"
                      h="4px"
                      bg={i % 4 === 0 ? "blue.300" : i % 4 === 1 ? "purple.300" : i % 4 === 2 ? "pink.300" : "teal.300"}
                      borderRadius="full"
                      boxShadow={`0 0 ${Math.random() * 5 + 2}px ${i % 4 === 0 ? "rgba(66, 153, 225, 0.8)" : i % 4 === 1 ? "rgba(159, 122, 234, 0.8)" : i % 4 === 2 ? "rgba(237, 100, 166, 0.8)" : "rgba(49, 151, 149, 0.8)"}`}
                      animation={`particleMove${i} ${Math.random() * 10 + 5}s infinite linear`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        [`@keyframes particleMove${i}`]: {
                          '0%': { transform: 'translate(0, 0)' },
                          '25%': { transform: 'translate(20px, -20px)' },
                          '50%': { transform: 'translate(40px, 0)' },
                          '75%': { transform: 'translate(20px, 20px)' },
                          '100%': { transform: 'translate(0, 0)' }
                        }
                      }}
                    />
                  ))}
                  
                  {/* Floating Text Elements */}
                  {[...Array(5)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      color="white"
                      fontSize={`${Math.random() * 10 + 10}px`}
                      fontWeight="bold"
                      opacity="0.7"
                      animation={`textFloat${i} ${Math.random() * 20 + 15}s infinite alternate`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        [`@keyframes textFloat${i}`]: {
                          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                          '100%': { transform: 'translate(30px, 30px) rotate(10deg)' }
                        }
                      }}
                    >
                      {i === 0 ? "EXPLORE" : i === 1 ? "DREAM" : i === 2 ? "DISCOVER" : i === 3 ? "JOURNEY" : "ADVENTURE"}
                    </Box>
                  ))}
                  
                  {/* Interactive Cursor Trail */}
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    sx={{
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: '10px',
                        height: '10px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        transition: 'all 0.1s ease',
                        zIndex: 5,
                      }
                    }}
                    onMouseMove={(e) => {
                      const trail = document.createElement('div');
                      trail.className = 'cursor-trail';
                      trail.style.left = `${e.clientX - e.currentTarget.getBoundingClientRect().left}px`;
                      trail.style.top = `${e.clientY - e.currentTarget.getBoundingClientRect().top}px`;
                      e.currentTarget.appendChild(trail);
                      
                      setTimeout(() => {
                        trail.remove();
                      }, 1000);
                    }}
                  >
                    <style>
                      {`
                        .cursor-trail {
                          position: absolute;
                          width: 5px;
                          height: 5px;
                          background: rgba(255, 255, 255, 0.8);
                          border-radius: 50%;
                          pointer-events: none;
                          animation: trailFade 1s linear forwards;
                          z-index: 5;
                        }
                        
                        @keyframes trailFade {
                          0% {
                            transform: scale(1);
                            opacity: 0.8;
                          }
                          100% {
                            transform: scale(0);
                            opacity: 0;
                          }
                        }
                      `}
                    </style>
                  </Box>
                  
                  {/* Shooting Stars */}
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w="2px"
                      h="2px"
                      bg="white"
                      boxShadow="0 0 10px rgba(255, 255, 255, 0.8)"
                      animation={`shootingStar${i} ${Math.random() * 10 + 10}s infinite linear`}
                      sx={{
                        top: `${Math.random() * 50}%`,
                        left: `${Math.random() * 50}%`,
                        [`@keyframes shootingStar${i}`]: {
                          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
                          '10%': { opacity: 1 },
                          '20%': { transform: 'translate(100px, 100px) rotate(45deg)', opacity: 1 },
                          '100%': { transform: 'translate(500px, 500px) rotate(45deg)', opacity: 0 }
                        }
                      }}
                    />
                  ))}
                  
                  {/* Cosmic Dust */}
                  {[...Array(15)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      w={`${Math.random() * 3 + 1}px`}
                      h={`${Math.random() * 3 + 1}px`}
                      bg="gray.300"
                      opacity="0.5"
                      animation={`dustFloat${i} ${Math.random() * 30 + 20}s infinite linear`}
                      sx={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        [`@keyframes dustFloat${i}`]: {
                          '0%': { transform: 'translate(0, 0)' },
                          '100%': { transform: 'translate(100px, 100px)' }
                        }
                      }}
                    />
                  ))}
                  
                  {/* Energy Waves */}
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w={`${200 + i * 50}px`}
                      h={`${200 + i * 50}px`}
                      borderRadius="full"
                      border={`1px solid ${i % 3 === 0 ? 'blue.300' : i % 3 === 1 ? 'purple.300' : 'pink.300'}`}
                      opacity="0.3"
                      animation={`waveExpand${i} ${5 + i * 2}s infinite ease-out`}
                      sx={{
                        [`@keyframes waveExpand${i}`]: {
                          '0%': { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0.5 },
                          '100%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 }
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