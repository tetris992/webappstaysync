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

  // 오늘과 내일 날짜(YYYY-MM-DD 형식)로 기본값 설정
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 숙박 일수 계산
  const numDays = differenceInCalendarDays(
    new Date(checkOut),
    new Date(checkIn)
  );

  // 호텔 설정 로딩 (고객 전용 설정)
  useEffect(() => {
    const loadHotelSettings = async () => {
      try {
        const settings = await fetchCustomerHotelSettings(hotelId);
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
      setAvailableRooms(hotelData.availability || []);
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
    // 숙박일수 계산: 체크아웃 - 체크인 (예: 오늘과 내일이면 1박)
    const numNights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
    // 총 가격 = 1박당 가격 × 숙박일수
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
    <Container maxW="container.md" py={6}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="teal.500">
          {hotelSettings?.hotelName || '객실 선택'}
        </Text>
        <VStack spacing={2}>
          <Text>체크인 날짜</Text>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={today} // 오늘 날짜 이후만 선택 가능
          />
          <Text>체크아웃 날짜</Text>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')} // 체크인 다음 날 이후만 선택 가능
          />
          <Button
            colorScheme="teal"
            onClick={handleCheckAvailability}
            w="full"
            isLoading={isLoading}
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
                  price={room.price} // 1박당 가격
                  stock={room.availableRooms}
                  numDays={numDays} // 숙박 일수 전달
                  onSelect={() => handleSelectRoom(room.roomInfo, room.price)}
                />
              ))}
            </SimpleGrid>
          )
        )}
        <Button onClick={() => navigate('/')} colorScheme="gray" w="full">
          뒤로가기
        </Button>
      </VStack>
    </Container>
  );
};

export default RoomSelection;