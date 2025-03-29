import React, { useState, useEffect } from 'react'; // useEffect 추가
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
import RoomCarouselCard from '../components/RoomCarouselCard';
import { fetchHotelAvailability, fetchCustomerHotelSettings } from '../api/api'; // fetchCustomerHotelSettings 추가

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(null); // 호텔 설정 상태 추가

  // 🚨 호텔 설정 로딩 로직 추가 (반드시 추가!)
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
        navigate('/'); // 실패 시 홈으로 이동
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
    }
  };

  const handleSelectRoom = (roomInfo, price) => {
    navigate('/confirm', { state: { hotelId, roomInfo, checkIn, checkOut, price } });
  };

  return (
    <Container maxW="container.md" py={6}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="teal.500">
          {hotelSettings?.hotelName || '객실 선택'} {/* 호텔 이름 표시 */}
        </Text>
        <VStack spacing={2}>
          <Text>체크인 날짜</Text>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
          <Text>체크아웃 날짜</Text>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          <Button colorScheme="teal" onClick={handleCheckAvailability} w="full">
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
