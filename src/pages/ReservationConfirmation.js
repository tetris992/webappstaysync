// webapp/src/pages/ReservationConfirmation.js
import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { createReservation } from '../api/api';
import PrimaryButton from '../components/PrimaryButton';

const ReservationConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // state로부터 전달된 값 (체크인, 체크아웃, 객실타입, 가격, 특별요청 등)
  const { hotelId, roomInfo, checkIn, checkOut, price, specialRequests } = state || {};

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

    // HMS와 동일한 형식의 예약 데이터 객체 구성
    // gridSettings(객실 그리드 정보)는 백엔드의 fetchHotelSettings를 통해 미리 로드되어 assignRoomNumber 함수가 작동하도록 구성되어야 합니다.
    const finalReservationData = {
      _id: `WEB-${Date.now()}`,               // 예약 ID (고유값)
      hotelId: hotelId,                       // 선택된 호텔 ID
      siteName: '단잠',                       // 웹앱 예약임을 구분 (HMS에서 출처 확인 용도)
      customerName: customer.name,            // 고객 이름 (로그인 정보)
      phoneNumber: customer.phoneNumber,      // 고객 연락처
      roomInfo: roomInfo,                     // 예약한 객실 타입
      originalRoomInfo: '',                   // 필요 시 빈 문자열로 채움
      roomNumber: '',                         // 서버에서 assignRoomNumber 함수로 자동 할당 (빈 문자열 전달)
      checkIn: checkIn,                       // 체크인 날짜/시간 (ISO 형식)
      checkOut: checkOut,                     // 체크아웃 날짜/시간 (ISO 형식)
      reservationDate: new Date().toISOString().replace('Z', '+09:00'),
      reservationStatus: 'Confirmed',         // 예약 상태 (즉시 확정)
      price: price,                           // 계산된 가격
      specialRequests: specialRequests || null, // 고객 요청사항 (없으면 null)
      additionalFees: 0,
      couponInfo: null,
      paymentStatus: '미결제',                 // 후불이므로 "미결제" 처리 (또는 "확인 필요")
      paymentMethod: '현장결제',               // 단잠 예약은 후불, 현장결제로 고정
      isCancelled: false,
      type: 'stay',                           // 예약 유형 (숙박)
      duration: null,
      isCheckedIn: false,
      isCheckedOut: false,
      manuallyCheckedOut: false,
      paymentHistory: [],
      remainingBalance: price,                // 후불이므로 총 가격과 동일
      notificationHistory: [],
      sentCreate: false,
      sentCancel: false,
    };

    try {
      setIsLoading(true);
      // 최종 예약 데이터를 생성합니다.
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
      <Container maxW="container.md" py={6}>
        <Text textAlign="center" color="red.500">
          예약 정보를 찾을 수 없습니다.
        </Text>
        <Button
          colorScheme="gray"
          variant="outline"
          onClick={() => navigate('/')}
          w="full"
          mt={4}
        >
          홈으로 돌아가기
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={6}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="teal.500" textAlign="center">
          예약 확인
        </Text>
        <Image
          src="/assets/default-room.jpg"
          alt={roomInfo}
          h="200px"
          w="100%"
          objectFit="cover"
          borderRadius="md"
        />
        <Text fontSize="lg" fontWeight="bold">{`호텔 ${hotelId} / ${roomInfo}`}</Text>
        <Text>{`체크인: ${checkIn}`}</Text>
        <Text>{`체크아웃: ${checkOut}`}</Text>
        <Text>{`가격: ${price.toLocaleString()}원`}</Text>
        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="lg" color="teal.500" />
          </Box>
        ) : (
          <>
            <PrimaryButton onClick={handleConfirm} w="full">
              예약 확정
            </PrimaryButton>
            <Button
              colorScheme="gray"
              variant="outline"
              onClick={() => navigate(`/rooms/${hotelId}`)}
              w="full"
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
