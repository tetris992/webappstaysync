import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Select,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  SlideFade,
  useToast,
  Spinner,
  Badge,
  Image,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { DateRange } from 'react-date-range';
import {
  format,
  addDays,
  startOfDay,
  addMonths,
  isValid,
  isSameDay,
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
  getReservationHistory,
} from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import io from 'socket.io-client';
import pLimit from 'p-limit';
import useImagePreloader from '../hooks/useImagePreloader';
import LazyImage from '../components/LazyImage';

// HTML <head>에 추가 권장 (프로젝트 설정에서 별도 처리)
// <link rel="preload" as="image" href="/assets/low-res-placeholder.jpg">

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
      endDate: addDays(startOfDay(new Date()), 1), // 기본 1박 설정
      key: 'selection',
    },
  ]);
  const [guestCount, setGuestCount] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [events, setEvents] = useState([]);
  const [photosMap, setPhotosMap] = useState({});
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState(null);
  const [isCouponPanelOpen, setIsCouponPanelOpen] = useState(false);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);

  // 사진 미리 로드
  useImagePreloader(
    hotels
      .slice(0, 3)
      .flatMap(
        (hotel) =>
          photosMap[hotel.hotelId]
            ?.slice(0, 2)
            ?.map((photo) => photo.photoUrl) || []
      ),
    6 // 최대 6장 프리로드 (3개 호텔 x 2장)
  );

  // "단골 숙소예약" 클릭 시
  const handleRebookFavorite = async () => {
    try {
      const resp = await getReservationHistory();
      const reservations = resp.history;
      if (!reservations || reservations.length === 0) {
        return toast({
          title: '예약 이력 없음',
          description: '지난 예약 내역이 없습니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      const last = reservations[0];
      if (!last || !last.hotelId) {
        return toast({
          title: '예약 데이터 오류',
          description: '최근 예약의 호텔 정보를 찾을 수 없습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
      const tomorrow = format(addDays(startOfDay(new Date()), 1), 'yyyy-MM-dd');
      navigate(`/rooms/${last.hotelId}`, {
        state: {
          checkIn: today,
          checkOut: tomorrow,
          guestCount: last.guestCount || 1,
        },
      });
    } catch (error) {
      console.error('[Home] Rebook favorite error:', error);
      toast({
        title: '단골 숙소 예약 실패',
        description: error.message || '다시 시도해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // "다른 숙소 예약하기" 및 "돋보기" 클릭 시 검색창 열기 + 기본값 설정
  const handleOpenSearch = () => {
    console.log('handleOpenSearch called'); // 이벤트 호출 확인
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    setDateRange([
      {
        startDate: today,
        endDate: tomorrow, // 기본 1박 설정
        key: 'selection',
      },
    ]);
    setGuestCount(2);
    setIsModalOpen(true); // 모달 열기
    setIsCalendarOpen(false); // 달력은 클릭 시 열림
  };

  // Socket.io 연결 및 쿠폰 이벤트
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_BASE_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
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
        setHotels(list || []);

        const limit = pLimit(3);
        const photoPromises = list.map((h) =>
          limit(async () => {
            try {
              const data = await fetchHotelPhotos(h.hotelId, 'exterior');
              return { id: h.hotelId, photos: data.commonPhotos || [] };
            } catch {
              toast({
                title: '사진 로드 실패',
                description: `${h.hotelName} 사진을 표시할 수 없습니다.`,
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
        setHotels([]);
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
    let { startDate, endDate } = selection;

    // 항상 작은 날짜가 체크인, 큰 날짜가 체크아웃
    if (startDate > endDate) [startDate, endDate] = [endDate, startDate];

    // 같은 날짜 선택 방지: 체크아웃을 체크인 다음 날로 설정
    if (isSameDay(startDate, endDate)) {
      endDate = addDays(startDate, 1);
    }

    setDateRange([{ startDate, endDate, key: 'selection' }]);

    toast({
      title: '날짜 선택 완료',
      description: `${format(startDate, 'yyyy.MM.dd')} - ${format(
        endDate,
        'yyyy.MM.dd'
      )}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
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
    setIsModalOpen(false);
    setIsCalendarOpen(false); // 검색 후 달력 닫기
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (event) => {
    console.log('[Events] Event clicked:', {
      event,
      startDate: event.startDate,
      endDate: event.endDate,
      discountType: event.discountType,
      discountValue: event.discountValue,
    });

    const todayKST = format(new Date(), 'yyyy-MM-dd', { locale: ko });
    const tomorrowKST = format(addDays(new Date(), 1), 'yyyy-MM-dd', {
      locale: ko,
    });

    console.log('[Events] Adjusted dates:', {
      checkIn: todayKST,
      checkOut: tomorrowKST,
    });

    navigate(`/rooms/${event.hotelId}`, {
      state: {
        checkIn: todayKST,
        checkOut: tomorrowKST,
        guestCount: 2,
        applicableRoomTypes: event.applicableRoomTypes || [],
        discountType: event.discountType,
        discountValue: event.discountValue,
      },
    });
  };

  const hotelSliderSettings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: 2.1,
    slidesToScroll: 1,
    arrows: false,
    centerMode: true,
    centerPadding: '16px',
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
      bg="white"
      position="fixed"
      inset={0}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        pt="env(safe-area-inset-top)"
        px={5}
        py={5}
        bg="white"
        boxShadow="sm"
        zIndex={100}
      >
        <Flex justify="space-between" align="center">
          <Image
            src="/assets/Logo.svg"
            alt="단잠"
            h="28px"
            cursor="pointer"
            onClick={() => navigate('/')}
          />
          <HStack spacing={3}>
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
            <Box
              cursor="pointer"
              onClick={handleOpenSearch} // 돋보기 클릭 시 handleOpenSearch 호출
            >
              <Image src="/assets/Search.svg" boxSize={8} />
            </Box>
          </HStack>
        </Flex>
      </Box>

      {/* 검색창 모달 ("다른 숙소 예약하기" 또는 "돋보기" 클릭 시) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          /* 검색 버튼 누르기 전에는 닫히지 않게 오버레이·ESC 클릭 막기 */
          setIsModalOpen(false);
          setIsCalendarOpen(false);
        }}
        closeOnEsc={false} // ESC 키로 닫히지 않도록
        closeOnOverlayClick={false} // 오버레이 클릭으로 닫히지 않도록
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="xl" mx={4} maxW="90vw">
          <ModalHeader>숙소 검색</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
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
              {isCalendarOpen && (
                <Box mt={4} w="100%">
                  <DateRange
                    ranges={dateRange}
                    onChange={handleDateChange}
                    minDate={startOfDay(new Date())} // 과거 날짜 선택 방지
                    maxDate={addMonths(startOfDay(new Date()), 3)}
                    locale={ko}
                    months={1}
                    direction="vertical"
                    showDateDisplay={false}
                    rangeColors={['transparent']}
                    showSelectionPreview={false}
                    moveRangeOnFirstSelection={false}
                    onPreviewChange={() => {}}
                    dayContentRenderer={(date) => {
                      const start = dateRange[0].startDate;
                      const end = dateRange[0].endDate;
                      const isStart = isSameDay(date, start);
                      const isEnd = isSameDay(date, end);
                      const sameDaySel = isSameDay(start, end);
                      const isSel = isStart || isEnd;

                      return (
                        <Box position="relative" w="100%" h="56px">
                          {/* 1) 날짜 숫자 */}
                          <Text
                            position="absolute"
                            top="4px"
                            w="100%"
                            textAlign="center"
                            fontSize="md"
                            fontWeight={isSel ? 'bold' : 'normal'}
                            color={isSel ? 'blue.500' : 'black'}
                          >
                            {date.getDate()}
                          </Text>

                          {/* 2) 라벨: 동일일이면 통합, 아니면 각각 */}
                          {sameDaySel && isStart ? (
                            <Text
                              position="absolute"
                              bottom="4px"
                              w="100%"
                              textAlign="center"
                              fontSize="xs"
                              color="blue.500"
                            >
                              체크인 / 체크아웃
                            </Text>
                          ) : (
                            <>
                              {isStart && (
                                <Text
                                  position="absolute"
                                  bottom="4px"
                                  w="100%"
                                  textAlign="center"
                                  fontSize="xs"
                                  color="blue.500"
                                >
                                  체크인
                                </Text>
                              )}
                              {isEnd && (
                                <Text
                                  position="absolute"
                                  bottom="4px"
                                  w="100%"
                                  textAlign="center"
                                  fontSize="xs"
                                  color="blue.500"
                                >
                                  체크아웃
                                </Text>
                              )}
                            </>
                          )}
                        </Box>
                      );
                    }}
                  />
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              w="100%"
              colorScheme="blue"
              onClick={handleSearch}
              borderRadius="lg"
            >
              검색
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
        <VStack spacing={12} align="stretch" px={4} pb="80px">
          {error && (
            <Text color="red.500" textAlign="center">
              {error}
            </Text>
          )}
          {/* 액션 섹션 */}
          <Box bg="transparent" pt={8} px={2} pb={0} borderRadius="lg">
            <VStack spacing={4} align="stretch" px={4} pt={1} pb={0}>
              <Button
                size="lg"
                colorScheme="blue"
                borderRadius="50px"
                onClick={handleRebookFavorite}
              >
                단골 숙소 예약
              </Button>
              <Text
                fontSize="sm"
                textAlign="center"
                color="gray.600"
                cursor="pointer"
                onClick={handleOpenSearch}
              >
                다른 숙소 예약하기
              </Text>
            </VStack>
          </Box>

          {/* 추천 호텔 */}
          <Box
            px={0}
            overflow="hidden"
            css={{
              '.slick-list': {
                paddingLeft: 0,
              },
            }}
          >
            <Text fontWeight="bold" mb={2}>
              추천 호텔
            </Text>
            {loadingHotels ? (
              <Flex justify="center" py={8}>
                <Spinner size="xl" />
              </Flex>
            ) : hotels.length > 0 ? (
              <Slider {...hotelSliderSettings}>
                {hotels.map((hotel) => {
                  const photo =
                    photosMap[hotel.hotelId]?.[0]?.photoUrl ||
                    '/assets/default-hotel.jpg';
                  const evt = events.find((e) => e.hotelId === hotel.hotelId);

                  return (
                    <Box
                      key={hotel.hotelId}
                      cursor="pointer"
                      px={2}
                      onClick={() => {
                        navigate(`/rooms/${hotel.hotelId}`, {
                          state: {
                            checkIn: format(
                              dateRange[0].startDate,
                              'yyyy-MM-dd'
                            ),
                            checkOut: format(
                              dateRange[0].endDate,
                              'yyyy-MM-dd'
                            ),
                            guestCount,
                          },
                        });
                      }}
                    >
                      <Box
                        w="100%"
                        borderRadius="lg"
                        overflow="hidden"
                        position="relative"
                      >
                        <LazyImage
                          src={photo}
                          alt={hotel.hotelName}
                          h="180px"
                          w="100%"
                          objectFit="cover"
                        />
                        {evt && (
                          <Badge
                            position="absolute"
                            top="2"
                            right="2"
                            colorScheme="red"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="full"
                            zIndex={2}
                          >
                            {evt.discountType === 'fixed'
                              ? `₩${evt.discountValue.toLocaleString()}`
                              : `${evt.discountValue}%`}
                          </Badge>
                        )}
                      </Box>
                      <VStack align="start" mt={2} spacing={1}>
                        <Text fontSize="md" fontWeight="bold" noOfLines={1}>
                          {hotel.hotelName}
                        </Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          {hotel.address.length > 10
                            ? hotel.address.slice(0, 10) + '…'
                            : hotel.address}
                        </Text>
                        <Text fontWeight="bold">
                          ₩
                          {(
                            hotel.price ||
                            Math.floor(Math.random() * 100000) + 50000
                          ).toLocaleString()}{' '}
                          / 박
                        </Text>
                      </VStack>
                    </Box>
                  );
                })}
              </Slider>
            ) : (
              <Text textAlign="center" color="gray.500" py={8}>
                추천 호텔이 없습니다.
              </Text>
            )}
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
                        <LazyImage
                          src={
                            photosMap[event.hotelId]?.[0]?.photoUrl ||
                            '/assets/default-event.jpg'
                          }
                          alt={`${event.eventName || '이벤트'} 이미지`}
                          w="100%"
                          h="160px"
                          objectFit="cover"
                        />
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg="rgba(0, 0, 0, 0.5)"
                          zIndex={1}
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
                              ? `${event.discountValue.toLocaleString()}원 할인`
                              : `${event.discountValue}% 할인`}
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

          {/* 회사 정보 */}
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
        bg="gray.100"
        boxShadow="md"
      >
        <BottomNavigation />
      </Box>
    </Box>
  );
};

export default Home;
