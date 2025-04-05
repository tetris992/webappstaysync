import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Input,
  Button,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import {
  format,
  addDays,
  startOfDay,
  differenceInCalendarDays,
  isBefore,
  addMonths,
} from 'date-fns';
import RoomCarouselCard from '../components/RoomCarouselCard';
import { fetchHotelAvailability, fetchCustomerHotelSettings } from '../api/api';

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const maxDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd'); // 3개월 이후 날짜

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const numDays = differenceInCalendarDays(
    new Date(checkOut),
    new Date(checkIn)
  );

  useEffect(() => {
    const loadHotelSettings = async () => {
      try {
        const settings = await fetchCustomerHotelSettings(hotelId);
        console.log('[RoomSelection] Hotel Settings:', settings);
        setHotelSettings(settings);
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

  const handleCheckAvailability = async () => {
    // 날짜 입력 검증
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

    // 과거 날짜 검증
    const todayDate = startOfDay(new Date());
    if (isBefore(new Date(checkIn), todayDate)) {
      toast({
        title: '날짜 오류',
        description: '체크인 날짜는 오늘 또는 미래 날짜여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 3개월 범위 검증
    const maxCheckInDate = startOfDay(addMonths(todayDate, 3));
    if (isBefore(maxCheckInDate, new Date(checkIn))) {
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

    // 체크아웃 날짜가 체크인 날짜로부터 3개월 이내인지 검증
    const maxCheckOutDate = startOfDay(addMonths(new Date(checkIn), 3));
    if (isBefore(maxCheckOutDate, new Date(checkOut))) {
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
        `[RoomSelection] Checking availability from ${checkIn} to ${checkOut}`
      );
      const hotelData = await fetchHotelAvailability(
        hotelId,
        checkIn,
        checkOut
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
      new Date(checkOut),
      new Date(checkIn)
    );
    const totalPrice = perNightPrice * numNights;
    navigate('/confirm', {
      state: {
        hotelId,
        roomInfo,
        checkIn,
        checkOut,
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
        >
          {hotelSettings?.hotelName || '객실 선택'}
        </Text>
        <VStack spacing={2}>
          <Text>체크인 날짜</Text>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={today} // 과거 날짜 선택 방지
            max={maxDate} // 3개월 이후 날짜 선택 방지
          />
          <Text>체크아웃 날짜</Text>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')}
            max={format(addMonths(new Date(checkIn), 3), 'yyyy-MM-dd')} // 체크인으로부터 3개월 이후 날짜 선택 방지
          />
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
            선택하신 기간({checkIn} ~ {checkOut})에 이용 가능한 객실이 없습니다.
            다른 날짜를 선택해 주세요.
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
                  onSelect={() => handleSelectRoom(room.roomInfo, room.price)}
                />
              ))}
            </SimpleGrid>
          )
        )}
        <Button
          onClick={() => navigate('/')}
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
