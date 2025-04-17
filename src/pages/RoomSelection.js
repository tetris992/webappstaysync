import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  Box,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  ModalBody,
  HStack,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaMapSigns, FaCopy } from 'react-icons/fa';
import { DateRange } from 'react-date-range';
import {
  format,
  addDays,
  startOfDay,
  differenceInCalendarDays,
  isBefore,
  addMonths,
  isValid,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import RoomCarouselCard from '../components/RoomCarouselCard';
import {
  fetchHotelAvailability,
  fetchCustomerHotelSettings,
  fetchHotelPhotos,
} from '../api/api';
import Map from '../components/Map';

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const {
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    applicableRoomTypes,
  } = location.state || {};

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const maxDate = addMonths(today, 3);

  const [dateRange, setDateRange] = useState([
    {
      startDate: initialCheckIn ? new Date(initialCheckIn) : today,
      endDate: initialCheckOut ? new Date(initialCheckOut) : tomorrow,
      key: 'selection',
    },
  ]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomPhotosMap, setRoomPhotosMap] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [shouldFetchAvailability, setShouldFetchAvailability] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [sortMode, setSortMode] = useState('event'); // 3단계 토글 상태: event, asc, desc

  const numDays = differenceInCalendarDays(
    dateRange[0].endDate,
    dateRange[0].startDate
  );

  const startLabel = isValid(dateRange[0].startDate)
    ? format(dateRange[0].startDate, 'yyyy-MM-dd')
    : '';
  const endLabel = isValid(dateRange[0].endDate)
    ? format(dateRange[0].endDate, 'yyyy-MM-dd')
    : '';

  const calculateDiscount = useCallback(
    (roomInfo, checkIn, checkOut) => {
      if (!hotelSettings?.events || !checkIn || !checkOut) {
        return { discount: 0, eventName: null, eventUuid: null };
      }
      const roomKey = roomInfo.toLowerCase();
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const applicableEvents = hotelSettings.events.filter(
        (event) =>
          event.isActive &&
          event.applicableRoomTypes.includes(roomKey) &&
          new Date(event.startDate) <= checkOutDate &&
          new Date(event.endDate) >= checkInDate
      );

      let maxDiscount = 0;
      let selectedEventName = null;
      let selectedEventUuid = null;

      applicableEvents.forEach((event) => {
        let discount = 0;
        if (event.discountType === 'percentage') {
          discount = event.discountValue;
        } else if (event.discountType === 'fixed') {
          const roomPrice =
            hotelSettings.roomTypes.find(
              (rt) => rt.roomInfo.toLowerCase() === roomKey
            )?.price || 0;
          discount = roomPrice ? (event.discountValue / roomPrice) * 100 : 0;
        }
        if (discount > maxDiscount) {
          maxDiscount = discount;
          selectedEventName = event.eventName;
          selectedEventUuid = event.uuid;
        }
      });

      return {
        discount: maxDiscount,
        eventName: selectedEventName,
        eventUuid: selectedEventUuid,
      };
    },
    [hotelSettings]
  );

  const handleCheckAvailability = useCallback(async () => {
    const checkIn = dateRange[0].startDate;
    const checkOut = dateRange[0].endDate;

    if (!checkIn || !checkOut || !isValid(checkIn) || !isValid(checkOut)) {
      toast({
        title: '날짜 오류',
        description: '체크인/체크아웃 날짜가 올바르지 않습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isBefore(checkIn, today)) {
      toast({
        title: '날짜 오류',
        description: '체크인 날짜는 오늘 이후여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (isBefore(maxDate, checkIn)) {
      toast({
        title: '날짜 범위 오류',
        description: '체크인 날짜는 현재로부터 3개월 이내여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (numDays <= 0) {
      toast({
        title: '날짜 오류',
        description: '체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const maxCheckOutDate = addMonths(checkIn, 3);
    if (isBefore(maxCheckOutDate, checkOut)) {
      toast({
        title: '날짜 범위 오류',
        description: '체크아웃 날짜는 체크인 날짜로부터 3개월 이내여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const hotelData = await fetchHotelAvailability(
        hotelId,
        format(checkIn, 'yyyy-MM-dd'),
        format(checkOut, 'yyyy-MM-dd')
      );
      if (!hotelSettings?.roomTypes) {
        toast({
          title: '호텔 설정 오류',
          description: '호텔 설정이 로드되지 않았습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const roomTypes = hotelSettings.roomTypes;
      const availabilityWithAmenities = (hotelData.availability || [])
        .map((room) => {
          const key = room.roomInfo.toLowerCase();
          const foundType = roomTypes.find(
            (rt) => rt.roomInfo.toLowerCase() === key
          );
          const activeAmenities =
            foundType?.roomAmenities
              ?.filter((amenity) => amenity.isActive)
              .map((amenity) => ({
                nameKor: amenity.nameKor,
                nameEng: amenity.nameEng,
                icon: amenity.icon,
              })) || [];
          const { discount, eventName, eventUuid } = calculateDiscount(
            room.roomInfo,
            checkIn,
            checkOut
          );
          const dayStayPrice = room.price;
          const dayUsePrice = Math.round(dayStayPrice * 0.5);
          return {
            ...room,
            activeAmenities,
            photos: roomPhotosMap[key] || [],
            discount,
            eventName,
            eventUuid,
            dayStayPrice,
            dayUsePrice,
          };
        })
        .filter(
          (room) =>
            !applicableRoomTypes ||
            applicableRoomTypes.includes(room.roomInfo.toLowerCase())
        );

      setAvailableRooms(availabilityWithAmenities);
      setIsAvailabilityChecked(true);
    } catch (error) {
      toast({
        title: '가용 객실 조회 실패',
        description: error.message || '가용 객실을 확인하지 못했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    dateRange,
    hotelId,
    hotelSettings,
    roomPhotosMap,
    toast,
    today,
    maxDate,
    numDays,
    applicableRoomTypes,
    calculateDiscount,
  ]);

  useEffect(() => {
    const loadHotelSettings = async () => {
      try {
        const settings = await fetchCustomerHotelSettings(hotelId, {
          checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
          checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
        });
        setHotelSettings(settings);

        const roomTypes = settings.roomTypes || [];
        const photosPromises = roomTypes.map(async (roomType) => {
          try {
            const photosData = await fetchHotelPhotos(
              hotelId,
              'room',
              roomType.roomInfo
            );
            return {
              roomInfo: roomType.roomInfo,
              photos: photosData.roomPhotos || [],
            };
          } catch (error) {
            console.error(
              'Failed to fetch photos for room:',
              roomType.roomInfo
            );
            return { roomInfo: roomType.roomInfo, photos: [] };
          }
        });

        const photosResults = await Promise.all(photosPromises);
        const photosMap = photosResults.reduce((acc, { roomInfo, photos }) => {
          acc[roomInfo.toLowerCase()] = photos;
          return acc;
        }, {});
        setRoomPhotosMap(photosMap);

        setShouldFetchAvailability(true);
      } catch (error) {
        toast({
          title: '호텔 설정 로딩 실패',
          description: error.message || '호텔 설정을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    loadHotelSettings();
  }, [hotelId, navigate, toast, dateRange]);

  useEffect(() => {
    if (shouldFetchAvailability && hotelSettings && roomPhotosMap) {
      handleCheckAvailability();
      setShouldFetchAvailability(false);
    }
  }, [
    shouldFetchAvailability,
    hotelSettings,
    roomPhotosMap,
    handleCheckAvailability,
  ]);

  const handleSelectRoom = (
    roomInfo,
    perNightPrice,
    discount,
    eventName,
    eventUuid
  ) => {
    const nights = differenceInCalendarDays(
      dateRange[0].endDate,
      dateRange[0].startDate
    );
    const originalPrice = perNightPrice * nights;
    const totalPrice = originalPrice * (1 - discount / 100);

    navigate('/confirm', {
      state: {
        hotelId,
        roomInfo,
        checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
        checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
        price: totalPrice,
        originalPrice,
        discount,
        eventName,
        eventUuid,
        numNights: nights,
        specialRequests: null,
      },
    });
  };

  const handleAddressClick = () => {
    if (hotelSettings && (hotelSettings.latitude || hotelSettings.longitude)) {
      setIsMapOpen(true);
    } else {
      toast({
        title: '위치 정보 없음',
        description: '호텔 좌표 정보를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTMapNavigation = () => {
    if (!hotelSettings?.latitude || !hotelSettings?.longitude) {
      toast({
        title: '좌표 정보 없음',
        description: '호텔 좌표를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tmapUrl = `tmap://route?goalx=${hotelSettings.longitude}&goaly=${
      hotelSettings.latitude
    }&name=${encodeURIComponent(hotelSettings?.hotelName || '호텔')}`;
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href =
          'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
      } else if (isIOS) {
        window.location.href = 'https://apps.apple.com/kr/app/tmap/id431589174';
      } else {
        toast({
          title: 'T맵 설치 필요',
          description:
            'T맵 앱이 설치되어 있지 않습니다. 설치 페이지로 이동합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 2000);
  };

  const handleCopyAddress = () => {
    if (hotelSettings && hotelSettings.address) {
      navigator.clipboard
        .writeText(hotelSettings.address)
        .then(() => {
          toast({
            title: '주소 복사 완료',
            description: '호텔 주소가 클립보드에 복사되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
          toast({
            title: '주소 복사 실패',
            description: `주소를 복사하는 데 실패했습니다: ${error.message}`,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  };

  return (
    <Container
      maxW="100%" // 스마트폰 화면 너비에 꽉 차게
      w="100%"
      p={0}
      h="100vh"
      display="flex"
      flexDirection="column"
      bg="gray.50"
      overflow="hidden"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflowX="hidden" // 좌우 스크롤 방지
    >
      {/* 상단 헤더 */}
      <Box
        w="100%"
        py={3}
        px={3}
        bg="white"
        position="sticky"
        top={0}
        zIndex={2}
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Flex align="center" justify="space-between">
          <Text
            fontSize={{ base: 'lg', md: '2xl' }}
            fontWeight="700"
            color="gray.900"
          >
            {hotelSettings?.hotelName || '객실 선택'}
          </Text>
          <HStack spacing={2}>
            {hotelSettings && (
              <Button
                variant="ghost"
                color="gray.700"
                onClick={handleAddressClick}
                _hover={{ color: 'blue.500', bg: 'blue.50' }}
                size="sm"
                leftIcon={<FaMapMarkerAlt size={14} />}
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
              >
                위치보기
              </Button>
            )}
            <Button
              variant="solid"
              colorScheme="blue"
              size="sm"
              fontWeight="600"
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={() => {
                // compute next sort mode
                const next = sortMode === 'event'
                  ? 'asc'
                  : sortMode === 'asc'
                    ? 'desc'
                    : 'event';

                // perform the sort
                let sorted;
                if (next === 'event') {
                  // 이벤트: rooms with an event first (by discount desc), then others
                  sorted = [...availableRooms].sort((a, b) => {
                    const ea = a.eventName ? 1 : 0;
                    const eb = b.eventName ? 1 : 0;
                    if (ea !== eb) return eb - ea;
                    // if both have events, sort by discount descending
                    return (b.discount || 0) - (a.discount || 0);
                  });
                } else if (next === 'asc') {
                  sorted = [...availableRooms].sort((a, b) => a.dayStayPrice - b.dayStayPrice);
                } else {
                  sorted = [...availableRooms].sort((a, b) => b.dayStayPrice - a.dayStayPrice);
                }

                setAvailableRooms(sorted);
                setSortMode(next);

                // toast message
                const labels = {
                  event: '이벤트 우선 정렬',
                  asc: '가격 낮은순 정렬',
                  desc: '가격 높은순 정렬',
                };
                toast({
                  title: labels[next],
                  status: 'success',
                  duration: 2000,
                  isClosable: true,
                });
              }}
              _hover={{ bg: 'blue.600' }}
            >
              {{
                event: '이벤트',
                asc: '가격 낮은순',
                desc: '가격 높은순',
              }[sortMode]}
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* 날짜 선택 영역 */}
      <Box
        w="100%"
        bg="white"
        position="sticky"
        top="60px"
        zIndex={1}
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
        p={3}
      >
        <VStack spacing={2}>
          <Box w="100%">
            <Popover
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              closeOnBlur={false}
              placement="bottom"
              matchWidth
            >
              <PopoverTrigger>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <CalendarIcon color="gray.600" />
                  </InputLeftElement>
                  <Input
                    readOnly
                    value={`${startLabel || '체크인'} ~ ${
                      endLabel || '체크아웃'
                    } (${numDays}박)`}
                    onClick={() => setIsOpen(true)}
                    placeholder="체크인 - 체크아웃"
                    bg="white"
                    color="gray.800"
                    fontWeight="500"
                    fontSize={{ base: 'sm', md: 'md' }}
                    _hover={{ borderColor: 'blue.500' }}
                  />
                </InputGroup>
              </PopoverTrigger>
              <PopoverContent
                width={{ base: '95vw', md: 'auto' }}
                maxWidth="95vw"
                border="none"
                boxShadow="xl"
                _focus={{ boxShadow: 'xl' }}
                bg="white"
              >
                <PopoverArrow />
                <PopoverBody p={0}>
                  <Box
                    className="custom-calendar-wrapper"
                    sx={{
                      '.rdrCalendarWrapper': {
                        width: '100%',
                        fontSize: { base: '12px', md: '14px' },
                        bg: 'white',
                      },
                      '.rdrMonth': {
                        width: '100%',
                      },
                      '.rdrDateDisplayWrapper': {
                        background: 'none',
                      },
                      '.rdrDayToday .rdrDayNumber span:after': {
                        background: 'blue.500',
                      },
                      '.rdrDateRangePickerWrapper': {
                        p: 2,
                      },
                      '@media (max-width: 480px)': {
                        '.rdrCalendarWrapper, .rdrMonth': {
                          width: '100%',
                        },
                        '.rdrDateRangeWrapper': {
                          flexDirection: 'column',
                        },
                      },
                    }}
                  >
                    <DateRange
                      onChange={(item) => {
                        setDateRange([item.selection]);
                        const { startDate, endDate } = item.selection;
                        if (
                          startDate &&
                          endDate &&
                          startDate.getTime() !== endDate.getTime()
                        ) {
                          setIsOpen(false);
                          setShouldFetchAvailability(true);
                        }
                      }}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                      months={window.innerWidth > 768 ? 2 : 1}
                      direction={
                        window.innerWidth > 768 ? 'horizontal' : 'vertical'
                      }
                      minDate={today}
                      maxDate={maxDate}
                      locale={ko}
                      rangeColors={['#3182CE']}
                      showSelectionPreview={true}
                      showDateDisplay={true}
                      editableDateInputs={true}
                      retainEndDateOnFirstSelection={true}
                    />
                  </Box>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Box>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
            최대 3개월 이내의 날짜만 예약 가능합니다.
          </Text>
        </VStack>
      </Box>

      {/* 객실 목록 영역 - 스크롤 가능 */}
      <Box
        flex="1"
        overflowY="auto"
        px={2}
        pb={{ base: '104px', md: '70px' }} // 하단바(60px) + 스마트폰 하단 네비게이션 바(44px)
        maxH="calc(100vh - 200px)" // 상단바(60px) + 날짜 선택 영역(약 140px) 제외
        overflowX="hidden" // 좌우 스크롤 방지
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '-ms-overflow-style': 'none',
          scrollbarWidth: 'none',
        }}
      >
        {isLoading ? (
          <VStack
            flex="1"
            justify="center"
            align="center"
            bg="white"
            rounded="md"
            shadow="sm"
            p={6}
          >
            <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
              객실을 불러오는 중입니다...
            </Text>
          </VStack>
        ) : isAvailabilityChecked && availableRooms.length === 0 ? (
          <Box bg="white" rounded="md" shadow="sm" p={6}>
            <Text
              textAlign="center"
              color="gray.500"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              선택하신 기간({startLabel} ~ {endLabel})에 이용 가능한 객실이
              없습니다.
              <br />
              다른 날짜를 선택해 주세요.
            </Text>
          </Box>
        ) : (
          isAvailabilityChecked && (
            <VStack spacing={3} align="stretch" my={4} w="100%">
              {availableRooms.map((room) => (
                <RoomCarouselCard
                  key={room.roomInfo}
                  roomInfo={room.roomInfo}
                  price={room.dayStayPrice}
                  dayUsePrice={room.dayUsePrice}
                  stock={room.availableRooms || room.stock}
                  numDays={numDays}
                  activeAmenities={room.activeAmenities}
                  photos={room.photos}
                  onSelect={() =>
                    handleSelectRoom(
                      room.roomInfo,
                      room.dayStayPrice,
                      room.discount,
                      room.eventName,
                      room.eventUuid
                    )
                  }
                  hotelSettings={{
                    discountInfo:
                      room.discount > 0 ? `${room.discount}% 할인` : null,
                    specialPrice:
                      room.discount > 0
                        ? {
                            originalPrice: room.dayStayPrice,
                            discountRate: room.discount,
                          }
                        : null,
                    eventName: room.eventName,
                    eventUuid: room.eventUuid,
                    checkInTime: hotelSettings?.checkInTime || '17:00',
                    rating: 4.7,
                    reviewCount: 28,
                  }}
                />
              ))}
            </VStack>
          )
        )}
      </Box>

      {/* 하단바 */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px"
        borderColor="gray.200"
        py={2}
        zIndex={1000}
        height="60px"
      >
        <Container maxW="container.sm">
          <Flex justify="space-around">
            <Text>홈</Text>
            <Text>숙소</Text>
            <Text>로그아웃</Text>
            <Text>나의 내역</Text>
          </Flex>
        </Container>
      </Box>

      {/* 지도 모달 */}
      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>호텔 위치</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" mb={2}>
              호텔 ID: {hotelId}
            </Text>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" mb={4}>
              주소: {hotelSettings?.address || '주소 정보 없음'}
            </Text>
            <Box h="400px" w="100%">
              <Map
                address={hotelSettings?.address}
                latitude={hotelSettings?.latitude}
                longitude={hotelSettings?.longitude}
                onCoordinatesChange={() => {}}
              />
            </Box>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button
                variant="outline"
                color="teal.600"
                leftIcon={<FaMapSigns />}
                onClick={handleTMapNavigation}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                T맵으로 길찾기
              </Button>
              <Button
                variant="outline"
                color="gray.600"
                leftIcon={<FaCopy />}
                onClick={handleCopyAddress}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                주소 복사
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => setIsMapOpen(false)}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                닫기
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RoomSelection;