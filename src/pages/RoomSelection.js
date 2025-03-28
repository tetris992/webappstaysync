// webapp/src/pages/RoomSelection.js
import React, { useState } from 'react';
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
import { fetchHotelAvailability } from '../api/api';

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);

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
          객실 선택
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
            가용 객실 조회
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