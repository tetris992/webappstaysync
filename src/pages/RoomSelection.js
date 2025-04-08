import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  useToast,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // react-date-range 기본 스타일
import 'react-date-range/dist/theme/default.css'; // react-date-range 테마
import {
  format,
  addDays,
  startOfDay,
  differenceInCalendarDays,
  isBefore,
  addMonths,
} from 'date-fns';
import RoomCarouselCard from '../components/RoomCarouselCard';
import {
  fetchHotelAvailability,
  fetchCustomerHotelSettings,
  fetchHotelPhotos,
} from '../api/api';

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const maxDate = addMonths(today, 3);

  const [dateRange, setDateRange] = useState([
    {
      startDate: today,
      endDate: tomorrow,
      key: 'selection',
    },
  ]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [roomPhotosMap, setRoomPhotosMap] = useState({});

  const numDays = differenceInCalendarDays(
    dateRange[0].endDate,
    dateRange[0].startDate
  );

  useEffect(() => {
    const loadHotelSettings = async () => {
      try {
        const settings = await fetchCustomerHotelSettings(hotelId);
        console.log('[RoomSelection] Hotel Settings:', settings);
        setHotelSettings(settings);

        // 객실별 사진 로드
        const roomTypes = settings.roomTypes || [];
        const photosPromises = roomTypes.map(async (roomType) => {
          try {
            const photosData = await fetchHotelPhotos(
              hotelId,
              'room',
              roomType.roomInfo
            );
            console.log(
              `[RoomSelection] Photos for room ${roomType.roomInfo}:`,
              photosData
            );
            return {
              roomInfo: roomType.roomInfo,
              photos: photosData.roomPhotos || [],
            };
          } catch (error) {
            console.error(
              `Failed to fetch photos for room ${roomType.roomInfo}:`,
              error
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
      } catch (error) {
        toast({
          title: '호텔 설정 로딩 실패',
          description: error.message || '호텔 설정을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      }
    };
    loadHotelSettings();
  }, [hotelId, toast, navigate]);

  const handleDateChange = (ranges) => {
    const { selection } = ranges;
    setDateRange([selection]);
    // 날짜 선택 후 달력 창 닫기
    if (selection.startDate && selection.endDate) {
      setShowCalendar(false);
    }
  };

  const handleCheckAvailability = async () => {
    const checkIn = dateRange[0].startDate;
    const checkOut = dateRange[0].endDate;

    if (!checkIn || !checkOut) {
      toast({
        title: '날짜 입력 필요',
        description: '체크인 및 체크아웃 날짜를 모두 입력해주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isBefore(checkIn, today)) {
      toast({
        title: '날짜 오류',
        description: `체크인 날짜(${format(
          checkIn,
          'yyyy-MM-dd'
        )})는 오늘(${format(today, 'yyyy-MM-dd')}) 또는 미래 날짜여야 합니다.`,
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
        description: '체크아웃 날짜는 체크인 날짜보다 이후여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const maxCheckOutDate = startOfDay(addMonths(checkIn, 3));
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
      console.log(
        `[RoomSelection] Checking availability from ${format(
          checkIn,
          'yyyy-MM-dd'
        )} to ${format(checkOut, 'yyyy-MM-dd')}`
      );
      const hotelData = await fetchHotelAvailability(
        hotelId,
        format(checkIn, 'yyyy-MM-dd'),
        format(checkOut, 'yyyy-MM-dd')
      );
      console.log('[RoomSelection] Hotel Availability:', hotelData);

      const roomTypesWithAmenities = hotelSettings?.roomTypes || [];
      console.log('[RoomSelection] Room Types:', roomTypesWithAmenities);

      const availabilityWithAmenities = (hotelData.availability || []).map(
        (room) => {
          const roomInfoLower = room.roomInfo.toLowerCase();
          const roomType = roomTypesWithAmenities.find(
            (rt) => rt.roomInfo.toLowerCase() === roomInfoLower
          );

          const activeAmenities =
            roomType?.roomAmenities
              ?.filter((amenity) => amenity.isActive)
              .map((amenity) => ({
                nameKor: amenity.nameKor,
                nameEng: amenity.nameEng,
                icon: amenity.icon,
              })) || [];

          console.log(
            `[RoomSelection] Active Amenities for ${roomInfoLower}:`,
            activeAmenities
          );
          console.log(
            `[RoomSelection] Room ${roomInfoLower}: stock=${room.availableRooms}`
          );

          return {
            ...room,
            activeAmenities,
            photos: roomPhotosMap[roomInfoLower] || [],
          };
        }
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
  };

  const handleSelectRoom = (roomInfo, perNightPrice) => {
    const numNights = differenceInCalendarDays(
      dateRange[0].endDate,
      dateRange[0].startDate
    );
    const totalPrice = perNightPrice * numNights;
    navigate('/confirm', {
      state: {
        hotelId,
        roomInfo,
        checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
        checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
        price: totalPrice,
        numNights,
      },
    });
  };

  return (
    <Container
      maxW="container.sm"
      py={6}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={4} align="stretch" flex="1">
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="bold"
          color="teal.500"
          textAlign="center" // 호텔 타이틀 가운데 정렬
        >
          {hotelSettings?.hotelName || '객실 선택'}
        </Text>
        <VStack spacing={2}>
          <HStack spacing={4} w="full" justifyContent="center">
            <FormControl flex={{ base: '1', md: '0 0 200px' }}>
              <FormLabel>체크인 날짜</FormLabel>
              <InputGroup>
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
                  _hover={{ borderColor: 'teal.500' }}
                  _focus={{
                    borderColor: 'teal.500',
                    boxShadow: '0 0 0 1px #319795',
                  }}
                />
              </InputGroup>
            </FormControl>
            <FormControl flex={{ base: '1', md: '0 0 200px' }}>
              <FormLabel>체크아웃 날짜</FormLabel>
              <InputGroup>
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
                  _hover={{ borderColor: 'teal.500' }}
                  _focus={{
                    borderColor: 'teal.500',
                    boxShadow: '0 0 0 1px #319795',
                  }}
                />
              </InputGroup>
            </FormControl>
          </HStack>
          {showCalendar && (
            <VStack
              position="absolute"
              zIndex={1000}
              bg="white"
              boxShadow="md"
              borderRadius="md"
              p={4}
              mt={2}
            >
              <DateRange
                editableDateInputs={true}
                onChange={handleDateChange}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                minDate={today}
                maxDate={maxDate}
                direction="horizontal"
                rangeColors={['#319795']}
              />
              <Button
                colorScheme="teal"
                size="sm"
                onClick={() => setShowCalendar(false)}
              >
                닫기
              </Button>
            </VStack>
          )}
          <Text fontSize="sm" color="gray.500">
            최대 3개월 이내의 날짜만 예약 가능합니다.
          </Text>
          <Button
            colorScheme="teal"
            onClick={handleCheckAvailability}
            w="full"
            isLoading={isLoading}
            size="md"
          >
            이용 가능한 객실 조회
          </Button>
        </VStack>
        {isAvailabilityChecked && availableRooms.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            선택하신 기간({format(dateRange[0].startDate, 'yyyy-MM-dd')} ~{' '}
            {format(dateRange[0].endDate, 'yyyy-MM-dd')})에 이용 가능한 객실이
            없습니다. 다른 날짜를 선택해 주세요.
          </Text>
        ) : (
          isAvailabilityChecked && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {availableRooms.map((room) => (
                <RoomCarouselCard
                  key={room.roomInfo}
                  roomInfo={room.roomInfo}
                  price={room.price}
                  stock={room.availableRooms}
                  numDays={numDays}
                  activeAmenities={room.activeAmenities}
                  photos={room.photos}
                  onSelect={() => handleSelectRoom(room.roomInfo, room.price)}
                />
              ))}
            </SimpleGrid>
          )
        )}
        <Button
          onClick={() => navigate(-1)}
          colorScheme="gray"
          w="full"
          size="md"
        >
          뒤로가기
        </Button>
      </VStack>
    </Container>
  );
};

export default RoomSelection;
