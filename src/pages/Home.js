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
  useToast,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { DateRange } from 'react-date-range';
import {
  format,
  addDays,
  startOfDay,
  addMonths,
  isValid,
  differenceInCalendarDays,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
  fetchHotelList,
  fetchHotelPhotos,
  fetchCustomerHotelSettings,
} from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import io from 'socket.io-client';
import pLimit from 'p-limit';

// 기본 호텔 데이터 (API 호출 실패 시 사용)
const recommendedHotels = [
  {
    id: 1,
    name: '부산 호텔',
    image: '/assets/hotel1.jpg',
    address: '부산 해운대구 해운대해변로 264',
    price: 120000,
  },
  {
    id: 11,
    name: '여수 호텔',
    image: '/assets/hotel11.jpg',
    address: '여수시 돌산공원길 1',
    price: 150000,
  },
  {
    id: 12,
    name: '제주 호텔',
    image: '/assets/hotel12.jpg',
    address: '제주시 서귀포',
    price: 180000,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    customerCoupons,
    isCouponsLoading,
    couponsLoadError,
    availableCouponsError,
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
  const [events, setEvents] = useState([]);
  const [photosMap, setPhotosMap] = useState({});
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);
  const [isCouponPanelOpen, setIsCouponPanelOpen] = useState(false);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);

  // Socket.io 연결 및 쿠폰 이벤트
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
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
    return () => socket.disconnect();
  }, [toast]);

  // 호텔 데이터 및 사진 불러오기
  useEffect(() => {
    const fetchHotels = async () => {
      setLoadingHotels(true);
      setError(null);
      try {
        const list = await fetchHotelList();
        const withDetails = list.map((h) => ({
          ...h,
          image: '/assets/hotel1.jpg', // 임시 이미지, 나중에 photosMap으로 대체
          price: Math.floor(Math.random() * 100000) + 50000,
        }));
        setHotels(withDetails);

        // 호텔 사진 가져오기
        const limit = pLimit(3);
        const photoPromises = withDetails.map((h) =>
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
      } catch (e) {
        setError(e.message);
        setHotels(recommendedHotels);
        toast({
          title: '호텔 목록 로드 실패',
          description: e.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingHotels(false);
      }
    };
    fetchHotels();
  }, [toast]);

  // 이벤트 데이터 불러오기 및 사진 매핑
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const hotels = await fetchHotelList();
        console.log('[Events] Fetched hotels:', hotels);

        if (!hotels || !Array.isArray(hotels) || hotels.length === 0) {
          console.warn('[Events] No hotels found or invalid response');
          toast({
            title: '호텔 목록 로드 실패',
            description: '등록된 호텔이 없습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          setEvents([]);
          return;
        }

        const validHotels = hotels.filter(
          (hotel) =>
            hotel.hotelId &&
            typeof hotel.hotelId === 'string' &&
            hotel.hotelId.trim() !== ''
        );
        console.log('[Events] Valid hotels:', validHotels);

        if (validHotels.length === 0) {
          console.warn('[Events] No valid hotels with hotelId');
          toast({
            title: '호텔 목록 오류',
            description: '유효한 호텔 데이터가 없습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          setEvents([]);
          return;
        }

        const todayKST = format(new Date(), 'yyyy-MM-dd', { locale: ko });
        console.log('[Events] Today (KST):', todayKST);

        const eventPromises = validHotels.map(async (hotel) => {
          try {
            console.log(
              `[Events] Fetching settings for hotelId: ${hotel.hotelId}`
            );
            const settings = await fetchCustomerHotelSettings(hotel.hotelId, {
              checkIn: todayKST,
              checkOut: todayKST,
            });
            console.log(`[Events] Settings for ${hotel.hotelId}:`, settings);
            const hotelEvents = (settings.events || [])
              .filter((event) => {
                return (
                  event.isActive &&
                  event.startDate <= todayKST &&
                  event.endDate >= todayKST
                );
              })
              .map((event) => {
                console.log(
                  `[Events] Event for ${hotel.hotelId}:`,
                  event.startDate,
                  event.endDate
                );
                return {
                  ...event,
                  uuid:
                    event.uuid ||
                    `event-${hotel.hotelId}-${Math.random()
                      .toString(36)
                      .slice(2)}`,
                  hotelId: hotel.hotelId,
                  hotelName:
                    settings.hotelName || hotel.hotelName || '알 수 없는 호텔',
                  address: settings.address || hotel.address || null,
                };
              });
            console.log(
              `[Events] Active Events for ${hotel.hotelId}:`,
              hotelEvents
            );
            return hotelEvents;
          } catch (error) {
            console.error(
              `[Events] Failed to fetch events for hotel ${hotel.hotelId}:`,
              error
            );
            toast({
              title: `호텔 이벤트 로드 실패`,
              description: `${
                hotel.hotelName || hotel.hotelId
              }: 이벤트를 불러오지 못했습니다.`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            return [];
          }
        });

        const allEvents = (await Promise.all(eventPromises)).flat();
        console.log(
          '[Events] All active events:',
          allEvents.map((e) => ({
            uuid: e.uuid,
            startDate: e.startDate,
            endDate: e.endDate,
            eventName: e.eventName,
            discountType: e.discountType,
            discountValue: e.discountValue,
          }))
        );

        if (allEvents.length === 0) {
          toast({
            title: '이벤트 없음',
            description: '현재 진행 중인 이벤트가 없습니다.',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        }

        setEvents(allEvents);
      } catch (error) {
        console.error('[Events] Event data fetch failed:', error);
        toast({
          title: '이벤트 로드 실패',
          description: error.message || '이벤트 데이터를 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [toast]);

  // 쿠폰 로드 에러
  useEffect(() => {
    if (couponsLoadError) setError(couponsLoadError);
    if (availableCouponsError) setError(availableCouponsError);
  }, [couponsLoadError, availableCouponsError]);

  // 날짜 선택
  const handleDateChange = ({ selection }) => {
    setDateRange([selection]);
    setIsCalendarOpen(false);
  };

  // 검색
  const handleSearch = () => {
    const { startDate, endDate } = dateRange[0];
    if (!isValid(startDate) || !isValid(endDate)) {
      return toast({
        title: '날짜 오류',
        description: '체크인/체크아웃 날짜가 올바르지 않습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    navigate('/hotels', {
      state: {
        searchQuery,
        checkIn: format(startDate, 'yyyy-MM-dd'),
        checkOut: format(endDate, 'yyyy-MM-dd'),
        guestCount,
      },
    });
  };

  // 이벤트 클릭 핸들러 (Events.js에서 가져옴)
  const handleEventClick = (event) => {
    console.log('[Events] Event clicked:', {
      event,
      startDate: event.startDate,
      endDate: event.endDate,
      discountType: event.discountType,
      discountValue: event.discountValue,
    });

    const todayKST = format(new Date(), 'yyyy-MM-dd', { locale: ko });
    const parsedStartDate = event.startDate;
    const parsedEndDate = event.endDate;

    const eventDuration =
      differenceInCalendarDays(
        new Date(parsedEndDate),
        new Date(parsedStartDate)
      ) || 1;

    const adjustedCheckIn =
      parsedStartDate < todayKST ? todayKST : parsedStartDate;

    const adjustedCheckOut = format(
      addDays(new Date(adjustedCheckIn), Math.max(eventDuration, 1)),
      'yyyy-MM-dd'
    );

    console.log('[Events] Adjusted dates:', {
      adjustedCheckIn,
      adjustedCheckOut,
    });

    navigate(`/rooms/${event.hotelId}`, {
      state: {
        checkIn: adjustedCheckIn,
        checkOut: adjustedCheckOut,
        applicableRoomTypes: event.applicableRoomTypes || [],
        discountType: event.discountType,
        discountValue: event.discountValue,
      },
    });
  };

  const eventSliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    afterChange: (idx) => setCurrentEventIdx(idx),
  };

  return (
    <Box
      minH="100vh"
      bg="gray.100"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      pt="env(safe-area-inset-top)"
      pb="env(safe-area-inset-bottom)"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bg="white"
        boxShadow="sm"
        zIndex={100}
        px={5}
        py={5}
      >
        <Flex justify="space-between" align="center">
          <Image
            src="/assets/Logo.svg"
            alt="단잠"
            h="36px"
            cursor="pointer"
            onClick={() => navigate('/')}
          />
          <Flex gap={3}>
            <Box
              position="relative"
              cursor="pointer"
              onClick={() => setIsCouponPanelOpen((o) => !o)}
            >
              <Image src="/assets/Notification.svg" boxSize={8} />
              <Box
                position="absolute"
                top="1"
                right="1"
                w="2"
                h="2"
                bg="red.500"
                border="1px solid white"
                borderRadius="full"
              />
            </Box>
            <Popover
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              placement="bottom-end"
            >
              <PopoverTrigger>
                <Box
                  cursor="pointer"
                  onClick={() => setIsSearchOpen((o) => !o)}
                >
                  <Image src="/assets/Search.svg" boxSize={8} />
                </Box>
              </PopoverTrigger>
              <PopoverContent w="90vw" maxW="360px" p={4} borderRadius="xl">
                <PopoverArrow />
                <VStack spacing={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Image src="/assets/Search.svg" boxSize={5} />
                    </InputLeftElement>
                    <Input
                      placeholder="목적지"
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
                      placeholder="날짜"
                      value={`${format(
                        dateRange[0].startDate,
                        'yyyy.MM.dd'
                      )} - ${format(dateRange[0].endDate, 'yyyy.MM.dd')}`}
                      readOnly
                      onClick={() => setIsCalendarOpen(true)}
                      borderRadius="lg"
                      bg="gray.100"
                    />
                  </InputGroup>
                  <Select
                    value={guestCount}
                    onChange={(e) => setGuestCount(+e.target.value)}
                    borderRadius="lg"
                    bg="gray.100"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}명
                      </option>
                    ))}
                  </Select>
                  <Button
                    w="100%"
                    colorScheme="blue"
                    onClick={handleSearch}
                    borderRadius="lg"
                  >
                    검색
                  </Button>
                </VStack>
              </PopoverContent>
            </Popover>
          </Flex>
        </Flex>
      </Box>

      {/* 날짜 모달 */}
      {isCalendarOpen && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%,-50%)"
          bg="white"
          p={4}
          borderRadius="xl"
          boxShadow="xl"
          zIndex={200}
          w="90vw"
          maxW="360px"
        >
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="bold">날짜 선택</Text>
            <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
              닫기
            </Button>
          </Flex>
          <DateRange
            editableDateInputs
            ranges={dateRange}
            onChange={handleDateChange}
            minDate={startOfDay(new Date())}
            maxDate={addMonths(startOfDay(new Date()), 3)}
            locale={ko}
            months={1}
            direction="vertical"
            rangeColors={['#3B82F6']}
          />
        </Box>
      )}

      {/* Main Scroll Area */}
      <Box
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        mt="72px"
        mb="80px"
        css={{ WebkitOverflowScrolling: 'touch' }}
        boxShadow="inset 0 7px 9px -7px rgba(0,0,0,0.1)"
      >
        <VStack spacing={10} align="stretch" px={4}>
          {error && (
            <Text color="red.500" textAlign="center">
              {error}
            </Text>
          )}
          {/* 액션 섹션 */}
          <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <Button
                size="lg"
                colorScheme="blue"
                borderRadius="50px"
                onClick={() => navigate('/past-bookings')}
              >
                지난 숙소 재예약
              </Button>
              <Text
                textAlign="center"
                color="gray.600"
                cursor="pointer"
                onClick={() =>
                  navigate('/hotels', {
                    state: {
                      checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
                      checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
                      guestCount,
                    },
                  })
                }
              >
                다른 숙소 예약하기
              </Text>
            </VStack>
          </Box>

          {/* 추천 호텔 */}
          <Box px={0}>
            <Text fontWeight="bold" mb={2}>
              추천 호텔
            </Text>
            <Box overflowX="auto">
              <HStack spacing="20px" pl={0} pr={0}>
                {(loadingHotels ? recommendedHotels : hotels).map((hotel) => (
                  <Box
                    key={hotel.id}
                    w="200px"
                    cursor="pointer"
                    onClick={() => navigate('/hotels')}
                  >
                    <Image
                      src={
                        photosMap[hotel.hotelId]?.length > 0
                          ? photosMap[hotel.hotelId][0].photoUrl
                          : '/assets/default-hotel.jpg'
                      }
                      alt={hotel.name}
                      h="180px"
                      w="100%"
                      objectFit="cover"
                      borderRadius="lg"
                      fallbackSrc="/assets/default-hotel.jpg"
                    />
                    <VStack align="start" mt={2} spacing={0}>
                      <Text fontWeight="bold">{hotel.name}</Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {hotel.address.length > 10
                          ? hotel.address.slice(0, 10) + '...'
                          : hotel.address}
                      </Text>
                      <Text fontWeight="bold">
                        ₩{hotel.price.toLocaleString()} / 박
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </HStack>
            </Box>
          </Box>

          {/* 이벤트 섹션 */}
          <Box w="100%" mb={4}>
            <Text fontWeight="bold" mb={2}>
              이벤트
            </Text>
            <Box position="relative">
              {loadingEvents ? (
                <Flex justify="center" py={8}>
                  <Spinner size="xl" />
                </Flex>
              ) : events.length > 0 ? (
                <>
                  <Slider {...eventSliderSettings}>
                    {events.map((event, idx) => (
                      <Box
                        key={`${event.uuid}-${idx}`}
                        position="relative"
                        borderRadius="2xl"
                        overflow="hidden"
                        cursor="pointer"
                        onClick={() => handleEventClick(event)}
                        transition="transform 0.2s"
                        _hover={{ transform: 'translateY(-4px)' }}
                      >
                        <Image
                          src={
                            photosMap[event.hotelId]?.length > 0
                              ? photosMap[event.hotelId][0].photoUrl
                              : '/assets/default-event.jpg'
                          }
                          alt={`${event.eventName || '이벤트'} 이미지`}
                          w="100%"
                          h="160px"
                          objectFit="cover"
                          fallbackSrc="/assets/default-event.jpg"
                        />
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg="rgba(0, 0, 0, 0.5)" // 이미지 전체에 50% 블랙 필름
                          zIndex={1} // 텍스트 위에 오도록 레이어 순서 조정
                        />
                       <Box position="absolute" top={4} right={4} zIndex={2}>
                          <Badge
                            colorScheme="red"
                            fontSize="md"
                            px={3}
                            py={1.5}
                            borderRadius="full"
                            bg="rgba(255,255,255,0.9)"
                            boxShadow="md"
                            zIndex={3}
                          >
                            {event.discountType === 'fixed'
                              ? `${(
                                  event.discountValue || 0
                                ).toLocaleString()}원 할인`
                              : `${event.discountValue || 0}% 할인`}
                          </Badge>
                        </Box>
                        <Box
                          position="absolute"
                          bottom={0}
                          left={0}
                          right={0}
                          p={4}
                          color="white"
                          zIndex={2} 
                        >
                          <Flex direction="column" gap={2}>
                            <Text fontSize="sm" fontWeight="500" opacity={0.9}>
                              {event.hotelName} |{' '}
                              {(event.applicableRoomTypes || []).join(', ') ||
                                '모든 객실'}
                            </Text>
                            <Text
                              fontSize="lg"
                              fontWeight="700"
                              lineHeight="1.2"
                            >
                              {event.eventName || '특가 이벤트'}
                            </Text>
                            <Text fontSize="sm" opacity={0.8} mt={1}>
                              {event.startDate.replace(/-/g, '.')} ~{' '}
                              {event.endDate.replace(/-/g, '.')}
                            </Text>
                          </Flex>
                        </Box>
                      </Box>
                    ))}
                  </Slider>

                  {/* 페이지 카운터 */}
                  <Text
                    position="absolute"
                    bottom="12px"
                    right="12px"
                    fontSize="sm"
                    color="gray.700"
                    bg="whiteAlpha.800"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {currentEventIdx + 1}/{events.length}
                  </Text>
                </>
              ) : (
                <Text textAlign="center" color="gray.500" py={8}>
                  현재 진행 중인 이벤트가 없습니다.
                </Text>
              )}
            </Box>
          </Box>

          {/* 회사 정보 (ZeroToOne) */}
          <Box w="100%" mb={4}>
            <VStack spacing={3} align="start">
              <Image
                src="/assets/ZeroToOne.svg"
                alt="ZeroToOne 로고"
                w="100px"
                h="14px"
              />
              <Text fontSize="10px" color="gray.600">
                주소: 경상남도 창원시 성산구 마디미로 61, 601호(상남동,
                위드빌딩)
                <br />
                대표이사: 최정환 | 사업자등록번호: 835-87-03326
              </Text>
              <HStack spacing={2}>
                <Text fontSize="11px" color="gray.600" cursor="pointer">
                  이용약관
                </Text>
                <Text fontSize="11px" color="gray.600">
                  │
                </Text>
                <Text fontSize="11px" color="gray.600" cursor="pointer">
                  개인정보 처리방침
                </Text>
              </HStack>
              <Text fontSize="10px" color="gray.600">
                (주) 제로투원은 통신판매중개자로서 통신판매의 당사자가 아니며,
                <br />
                상품의 예약, 이용 및 환불 등과 관련한 의무와 책임은 각
                판매자에게 있습니다.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* 쿠폰 패널 */}
      {isCouponPanelOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          onClick={() => setIsCouponPanelOpen(false)}
        />
      )}
      <SlideFade in={isCouponPanelOpen} offsetY="-20px">
        <Box
          position="fixed"
          top="60px"
          left={4}
          right={4}
          bg="white"
          borderRadius="lg"
          boxShadow="lg"
          p={4}
          maxH="50vh"
          overflowY="auto"
        >
          <VStack align="stretch" spacing={3}>
            {/* 쿠폰 리스트 */}
            {isCouponsLoading ? (
              <Text>쿠폰 로드 중...</Text>
            ) : customerCoupons.length ? (
              customerCoupons.map((c) => (
                <Box key={c.couponUuid} p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold">{c.name}</Text>
                  <Text fontSize="sm">코드: {c.code}</Text>
                  <Text fontSize="sm">
                    할인:{' '}
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}%`
                      : `₩${c.discountValue.toLocaleString()}`}
                  </Text>
                  <Text fontSize="sm">
                    유효기간: {c.startDate} ~ {c.endDate}
                  </Text>
                </Box>
              ))
            ) : (
              <Text>보유한 쿠폰이 없습니다.</Text>
            )}
            <Button
              w="full"
              mt={2}
              colorScheme="blue"
              onClick={() => navigate('/coupon-wallet')}
            >
              쿠폰 보관함 이동
            </Button>
          </VStack>
        </Box>
      </SlideFade>

      {/* 하단 네비게이션 */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        boxShadow="md"
      >
        <BottomNavigation />
      </Box>
    </Box>
  );
};

export default Home;
