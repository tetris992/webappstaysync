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
import { createReservation, fetchCustomerHotelSettings, fetchHotelPhotos } from '../api/api';
import { differenceInCalendarDays, format } from 'date-fns';

const ReservationConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [reservationId, setReservationId] = useState('');
  const [statusText, setStatusText] = useState(''); // 상태 텍스트 추가
  const [formattedCheckIn, setFormattedCheckIn] = useState(''); // 조합된 체크인 시간
  const [formattedCheckOut, setFormattedCheckOut] = useState(''); // 조합된 체크아웃 시간
  const [roomImage, setRoomImage] = useState('/assets/default-room1.jpg'); // S3 사진 URL 상태 추가

  const { hotelId, roomInfo, checkIn, checkOut, price, specialRequests } =
    state || {};

  // 숙박 일수 계산
  const numNights =
    checkIn && checkOut
      ? (() => {
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          let nights = differenceInCalendarDays(checkOutDate, checkInDate);
          return nights < 1 ? 1 : nights;
        })()
      : 1;

  const reservationDate = format(new Date(), 'yyyy-MM-dd HH:mm');

  // 예약 번호 포맷팅
  const formattedReservationId = reservationId
    ? `WEB-${reservationId.slice(-8)}`
    : '생성 중...';

  // 호텔 정보 및 객실 사진 로드
  useEffect(() => {
    const loadHotelInfoAndPhotos = async () => {
      try {
        // 호텔 정보 로드
        const hotelData = await fetchCustomerHotelSettings(hotelId);
        setHotelInfo(hotelData);

        // 객실 사진 로드
        const photosData = await fetchHotelPhotos(hotelId, 'room', roomInfo);
        console.log(`[ReservationConfirmation] Photos for room ${roomInfo}:`, photosData);
        if (photosData?.roomPhotos && photosData.roomPhotos.length > 0) {
          // 첫 번째 사진의 photoUrl 사용
          setRoomImage(photosData.roomPhotos[0].photoUrl);
        }

        // 체크인/체크아웃 시간 조합
        const checkInTime = hotelData?.checkInTime || '15:00';
        const checkOutTime = hotelData?.checkOutTime || '11:00';

        // 시간 정보 추가
        const checkInDateTimeStr = checkIn
          ? `${checkIn}T${checkInTime}:00+09:00`
          : null;
        const checkOutDateTimeStr = checkOut
          ? `${checkOut}T${checkOutTime}:00+09:00`
          : null;

        const checkInDateTime = checkInDateTimeStr
          ? new Date(checkInDateTimeStr)
          : null;
        const checkOutDateTime = checkOutDateTimeStr
          ? new Date(checkOutDateTimeStr)
          : null;

        // 포맷팅된 체크인/체크아웃 시간 설정
        setFormattedCheckIn(
          checkInDateTime ? format(checkInDateTime, 'yyyy-MM-dd HH:mm') : 'N/A'
        );
        setFormattedCheckOut(
          checkOutDateTime
            ? format(checkOutDateTime, 'yyyy-MM-dd HH:mm')
            : 'N/A'
        );
      } catch (error) {
        toast({
          title: '호텔 정보 로드 실패',
          description: error.message || '호텔 정보를 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    if (hotelId && roomInfo) {
      loadHotelInfoAndPhotos();
    }

    // 방문 횟수 로드 (Mock)
    setVisitCount(0);
  }, [hotelId, roomInfo, checkIn, checkOut, toast]);

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
      hotelId: hotelId,
      siteName: '단잠',
      customerName: customer.name,
      phoneNumber: customer.phoneNumber,
      roomInfo: roomInfo,
      originalRoomInfo: '',
      roomNumber: '',
      checkIn: formattedCheckIn
        ? `${checkIn}T${hotelInfo?.checkInTime || '15:00'}:00+09:00`
        : checkIn,
      checkOut: formattedCheckOut
        ? `${checkOut}T${hotelInfo?.checkOutTime || '11:00'}:00+09:00`
        : checkOut,
      reservationDate: new Date().toISOString().replace('Z', '+09:00'),
      reservationStatus: '예약완료',
      price: price,
      specialRequests: specialRequests || null,
      additionalFees: 0,
      couponInfo: null,
      paymentStatus: '미결제',
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
      const response = await createReservation(finalReservationData);
      setReservationId(response.reservationId);
      setStatusText('예약확정'); // 예약 성공 후 상태 업데이트
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

  const handleAddressClick = () => {
    if (hotelInfo) {
      navigate('/map', {
        state: { hotelId: hotelInfo.hotelId, address: hotelInfo.address },
      });
    }
  };

  // S3 사진 로드 실패 시 기본 사진으로 대체
  const handleImageError = (e) => {
    console.error(`[ReservationConfirmation] Failed to load image for room ${roomInfo}: ${roomImage}`);
    e.target.src = '/assets/default-room1.jpg';
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
            src={roomImage} // S3 사진 URL 사용
            alt={roomInfo}
            h="150px"
            w="100%"
            objectFit="cover"
            borderRadius="md"
            onError={handleImageError} // 로드 실패 시 기본 사진으로 대체
          />
          <VStack align="start" spacing={2} mt={4}>
            <Text fontWeight="bold" fontSize="lg">
              {hotelInfo?.hotelName || '부산호텔'} ({hotelId})
            </Text>
            <Divider />
            <Text fontSize="sm">예약 번호: {formattedReservationId}</Text>
            <Text fontSize="sm">
              예약자: {customer?.name || '예약자 정보 없음'}
            </Text>
            <Text fontSize="sm">객실: {roomInfo}</Text>
            <Text fontSize="sm">결제: 현장결제</Text>
            <Text fontSize="sm">체크인: {formattedCheckIn}</Text>
            <Text fontSize="sm">체크아웃: {formattedCheckOut}</Text>
            <Text fontSize="sm">예약일: {reservationDate}</Text>
            <Text fontSize="sm">숙박 일수: {numNights}박</Text>
            <Text fontWeight="semibold" color="blue.500">
              총 가격: {price.toLocaleString()}원
            </Text>
            <Text fontSize="sm">방문 횟수: {visitCount}</Text>
            {hotelInfo && (
              <Button
                variant="link"
                color="gray.600"
                mb={2}
                onClick={handleAddressClick}
                textAlign="left"
                fontSize="sm"
                p={0}
                _hover={{ color: 'blue.500', textDecoration: 'underline' }}
              >
                위치: {hotelInfo.address || '주소 정보 없음'}
              </Button>
            )}
          </VStack>
        </Box>

        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="lg" color="brand.500" />
          </Box>
        ) : (
          <>
            {statusText ? (
              <Text
                fontSize="md"
                color={statusText === '사용완료' ? 'gray.500' : 'blue.500'}
                w="full"
                textAlign="center"
              >
                {statusText}
              </Text>
            ) : (
              <Button
                variant="solid"
                onClick={handleConfirm}
                w="full"
                size="md"
              >
                예약 확정
              </Button>
            )}
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