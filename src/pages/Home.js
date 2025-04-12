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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const updateScrollPosition = () => {
      const scrollY = window.pageYOffset;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction === "down" && scrollY > 50) {
        setIsHeaderVisible(false);
      } else if (direction === "up") {
        setIsHeaderVisible(true);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
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
      position="relative"
      overflow="hidden"
      w="100%"
    >
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        transform={isHeaderVisible ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s ease"
        zIndex={1000}
        boxShadow="sm"
        width="100%"
      >
        <Container 
          maxW="100%"
          px={4}
          py={3}
          mx="auto"
        >
          <VStack spacing={1} width="100%">
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="700"
              color="gray.900"
              textAlign="center"
              width="100%"
            >
              편안한 후불예약
            </Text>
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              color="gray.600"
              textAlign="center"
              width="100%"
            >
              간편하게 예약하고 체크인시 결제하세요
            </Text>
          </VStack>
        </Container>
      </Box>

      <Box
        pt={{ base: "70px", sm: "80px", md: "90px" }}
        pb={{ base: "70px", md: "80px" }}
        minH="100vh"
        h="100%"
        position="relative"
        overflowX="hidden"
      >
        <Container
          maxW={{ base: "100%", sm: "95%", md: "container.sm" }}
          h="100%"
          py={{ base: 2, sm: 3 }}
          px={{ base: 4, sm: 6 }}
          display="flex"
          flexDirection="column"
        >
          <VStack
            spacing={{ base: 4, md: 5 }}
            align="stretch"
            w="100%"
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
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'sm',
                }}
                _active={{ 
                  transform: 'translateY(1px)',
                }}
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
                    >
                      <Image
                        src={hotel.image}
                        alt={`${hotel.name} 호텔 이미지`}
                        h="200px"
                        w="100%"
                        objectFit="cover"
                        borderRadius="lg"
                        boxShadow="md"
                      />
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

            <Button
              variant="homeButton"
              w="100%"
              h={{ base: "48px", sm: "52px" }}
              onClick={() => navigate('/history')}
              size="lg"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="600"
            >
              나의 예약 보기
            </Button>
            
            <Button
              variant="outline"
              w="100%"
              h={{ base: "48px", sm: "52px" }}
              onClick={() => navigate('/events')}
              size="lg"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="600"
              color="brand.500"
              borderColor="brand.500"
              _hover={{
                bg: 'brand.50',
                transform: 'scale(1.02)',
                boxShadow: 'md'
              }}
              _active={{ 
                bg: 'brand.100',
                transform: 'scale(0.98)',
              }}
              leftIcon={
                <Box
                  as="span"
                  position="relative"
                  display="inline-block"
                >
                  🎉
                  <Box
                    position="absolute"
                    top="-2px"
                    right="-2px"
                    w="8px"
                    h="8px"
                    bg="red.500"
                    borderRadius="full"
                  />
                </Box>
              }
            >
              진행중인 이벤트
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;