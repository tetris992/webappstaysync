// webapp/src/pages/RoomSelection.js
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
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import RoomCarouselCard from '../components/RoomCarouselCard';
import { fetchHotelAvailability, fetchCustomerHotelSettings } from '../api/api';

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

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
        console.log('[RoomSelection] Hotel Settings:', settings); // 디버깅 로그 추가
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
    if (!checkIn || !checkOut) {
      toast({
        title: '날짜 입력 필요',
        description: '체크인 및 체크아웃 날짜를 입력해주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (numDays <= 0) {
      toast({
        title: '날짜 오류',
        description: '체크아웃 날짜는 체크인 날짜 이후여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const hotelData = await fetchHotelAvailability(hotelId, checkIn, checkOut);
      console.log('[RoomSelection] Hotel Availability:', hotelData); // 디버깅 로그 추가

      // roomTypes에서 각 객실 타입의 활성화된 roomAmenities를 매핑
      const roomTypesWithAmenities = hotelSettings?.roomTypes || [];
      console.log('[RoomSelection] Room Types:', roomTypesWithAmenities); // 디버깅 로그 추가

      const availabilityWithAmenities = (hotelData.availability || []).map((room) => {
        // roomInfo를 소문자로 만들어 매칭
        const roomInfoLower = room.roomInfo.toLowerCase();
        const roomType = roomTypesWithAmenities.find(
          (rt) => rt.roomInfo.toLowerCase() === roomInfoLower
        );
      
        // 실제로 roomType가 존재하고, roomAmenities 배열이 있어야 함
        const activeAmenities =
          roomType?.roomAmenities
            ?.filter((amenity) => amenity.isActive)
            .map((amenity) => ({
              nameKor: amenity.nameKor,
              nameEng: amenity.nameEng,
              icon: amenity.icon,
            })) || [];
      
        console.log(`[RoomSelection] Active Amenities for ${roomInfoLower}:`, activeAmenities);
      
        return {
          ...room,
          activeAmenities, // 나중에 RoomCarouselCard에서 사용
        };
      });

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
            min={today}
          />
          <Text>체크아웃 날짜</Text>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')}
          />
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
            해당 기간에 가용 객실이 없습니다.
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
                  activeAmenities={room.activeAmenities} // 활성화된 시설 전달
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