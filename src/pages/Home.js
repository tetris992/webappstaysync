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
  PopoverBody,
  PopoverArrow,
  PopoverFooter,
  Button as ChakraButton,
  useToast, // useToast 훅 추가
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
  const { customer, logout } = useAuth();
  const toast = useToast(); // useToast 훅 초기화
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState([
    {
      startDate: startOfDay(new Date()),
      endDate: addDays(startOfDay(new Date()), 1),
      key: 'selection',
    },
  ]);
  const [guestCount, setGuestCount] = useState(1);
  const [isOpen, setIsOpen] = useState(false); // Popover 상태 관리

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
    // 시작 날짜와 종료 날짜가 모두 선택되었으면 팝업 닫기 및 토스트 알림 표시
    if (item.selection.startDate && item.selection.endDate) {
      setIsOpen(false);
      toast({
        title: '날짜 선택 완료',
        description: `${format(item.selection.startDate, 'yyyy-MM-dd')} ~ ${format(item.selection.endDate, 'yyyy-MM-dd')}`,
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

  // 날짜 범위 표시용 라벨
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

            {/* 날짜 선택: 하나의 입력 필드에서 DateRange 팝업 */}
            <Popover
              placement="bottom"
              isOpen={isOpen}
              onOpen={() => setIsOpen(true)}
              onClose={() => setIsOpen(false)}
              closeOnBlur={true}
            >
              <PopoverTrigger>
                <InputGroup w={{ base: '90%', sm: '80%', md: 'sm' }} cursor="pointer">
                  <InputLeftElement pointerEvents="none">
                    <CalendarIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    readOnly
                    borderColor="gray.300"
                    borderRadius="full"
                    bg="white"
                    boxShadow="sm"
                    _hover={{ borderColor: 'brand.500', boxShadow: 'md' }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
                    }}
                    pl="2.5rem"
                    transition="all 0.3s ease"
                    value={startLabel && endLabel ? `${startLabel} ~ ${endLabel}` : '날짜 선택'}
                    aria-label="체크인 및 체크아웃 날짜 선택"
                  />
                </InputGroup>
              </PopoverTrigger>
              <PopoverContent
                zIndex={1500}
                w="fit-content" // 달력 너비에 맞게 컨테이너 크기 조정
                mx="auto"
                textAlign="center"
              >
                <PopoverArrow />
                <PopoverBody p={4} display="flex" justifyContent="center">
                  <Box>
                    <DateRange
                      editableDateInputs={true}
                      onChange={handleDateChange}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                      months={2}
                      direction="vertical"
                      scroll={{ enabled: true }}
                      minDate={startOfDay(new Date())}
                      maxDate={addMonths(startOfDay(new Date()), 3)}
                      locale={ko}
                    />
                  </Box>
                </PopoverBody>
                <PopoverFooter border="0" d="flex" justifyContent="flex-end" pb={4}>
                  <ChakraButton
                    size="sm"
                    colorScheme="gray"
                    onClick={() => setIsOpen(false)}
                  >
                    닫기
                  </ChakraButton>
                </PopoverFooter>
              </PopoverContent>
            </Popover>

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
              숙소 예약 하기
            </Button>
          </VStack>

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