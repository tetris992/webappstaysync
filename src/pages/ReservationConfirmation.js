import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Image,
  Button,
  useToast,
  Spinner,
  Box,
  Divider,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { createReservation } from '../api/api';
import { differenceInCalendarDays, format } from 'date-fns';

const ReservationConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [visitCount, setVisitCount] = useState(0); // Mock visit count for now

  const { hotelId, roomInfo, checkIn, checkOut, price, specialRequests } = state || {};

  // Calculate the number of nights
  const numNights = checkIn && checkOut 
    ? differenceInCalendarDays(new Date(checkOut), new Date(checkIn))
    : 1;

  // Get the current date as the reservation date
  const reservationDate = format(new Date(), 'yyyy-MM-dd');

  // Mock fetching visit count (replace with actual API call if available)
  useEffect(() => {
    // In a real scenario, you would fetch the visit count from an API
    // For now, we'll mock it as 0
    setVisitCount(0);
  }, []);

  const handleConfirm = async () => {
    if (!customer) {
      toast({
        title: '인증 오류',
        description: '로그인이 필요합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }

    const finalReservationData = {
      _id: `WEB-${Date.now()}`,
      hotelId: hotelId,
      siteName: '단잠',
      customerName: customer.name,
      phoneNumber: customer.phoneNumber,
      roomInfo: roomInfo,
      originalRoomInfo: '',
      roomNumber: '',
      checkIn: checkIn,
      checkOut: checkOut,
      reservationDate: new Date().toISOString().replace('Z', '+09:00'),
      reservationStatus: '예약완료',
      price: price,
      specialRequests: specialRequests || null,
      additionalFees: 0,
      couponInfo: null,
      paymentStatus: '미결제',   //Pending ???
      paymentMethod: '현장결제',
      isCancelled: false,
      type: 'stay',
      duration: numNights,
      isCheckedIn: false,
      isCheckedOut: false,
      manuallyCheckedOut: false,
      paymentHistory: [],
      remainingBalance: price,
      notificationHistory: [],
      sentCreate: false,
      sentCancel: false,
    };

    try {
      setIsLoading(true);
      await createReservation(finalReservationData);
      toast({
        title: '예약 성공',
        description: '예약이 완료되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/history');
    } catch (error) {
      toast({
        title: '예약 실패',
        description: error.message || '예약을 완료하지 못했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!state) {
    return (
      <Container maxW="container.sm" py={6} minH="100vh">
        <Text textAlign="center" color="red.500">
          예약 정보를 찾을 수 없습니다.
        </Text>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          w="full"
          mt={4}
          size="md"
          color="gray.700"
          borderColor="gray.300"
        >
          홈으로 돌아가기
        </Button>
      </Container>
    );
  }

  return (
    <Container
      maxW="container.sm"
      py={6}
      minH="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
    >
      <VStack spacing={4} align="stretch">
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="bold"
          color="brand.500"
          textAlign="center"
        >
          예약 확인
        </Text>

        {/* Reservation Details Card */}
        <Box variant="card">
          <Image
            src="/assets/default-room1.jpg"
            alt={roomInfo}
            h="150px"
            w="100%"
            objectFit="cover"
            borderRadius="md"
          />
          <VStack align="start" spacing={2} mt={4}>
            <Text fontWeight="bold" fontSize="lg">
              부산호텔 ({hotelId})
            </Text>
            <Divider />
            <Text fontSize="sm">
              객실: {roomInfo}
            </Text>
            <Text fontSize="sm">
              결제: 현장결제
            </Text>
            <Text fontSize="sm">
              체크인: {checkIn}
            </Text>
            <Text fontSize="sm">
              체크아웃: {checkOut}
            </Text>
            <Text fontSize="sm">
              예약일: {reservationDate}
            </Text>
            <Text fontSize="sm">
              숙박 일수: {numNights}박
            </Text>
            <Text fontWeight="semibold" color="blue.500">
              총 가격: {price.toLocaleString()}원
            </Text>
            <Text fontSize="sm">
              방문 횟수: {visitCount}
            </Text>
          </VStack>
        </Box>

        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="lg" color="brand.500" />
          </Box>
        ) : (
          <>
            <Button
              variant="solid"
              onClick={handleConfirm}
              w="full"
              size="md"
            >
              예약 확정
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/rooms/${hotelId}`)}
              w="full"
              size="md"
              color="gray.700"
              borderColor="gray.300"
            >
              뒤로가기
            </Button>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default ReservationConfirmation;