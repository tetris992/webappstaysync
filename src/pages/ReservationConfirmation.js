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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Flex,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaMapSigns, FaCopy } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { createReservation, fetchCustomerHotelSettings, fetchHotelPhotos } from '../api/api';
import { differenceInCalendarDays, format } from 'date-fns';
import Map from '../components/Map';

const ReservationConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [reservationId, setReservationId] = useState('');
  const [statusText, setStatusText] = useState('');
  const [formattedCheckIn, setFormattedCheckIn] = useState('');
  const [formattedCheckOut, setFormattedCheckOut] = useState('');
  const [roomImage, setRoomImage] = useState('/assets/default-room1.jpg');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  const { hotelId, roomInfo, checkIn, checkOut, price, specialRequests } = state || {};

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

  const formattedReservationId = reservationId
    ? `WEB-${reservationId.slice(-8)}`
    : '생성 중...';

  useEffect(() => {
    const loadHotelInfoAndPhotos = async () => {
      try {
        const hotelData = await fetchCustomerHotelSettings(hotelId);
        console.log('[ReservationConfirmation] Hotel data received:', {
          hotelId: hotelData.hotelId,
          hotelName: hotelData.hotelName,
          address: hotelData.address,
          latitude: hotelData.latitude,
          longitude: hotelData.longitude,
        });
        setHotelInfo(hotelData);

        // 좌표 초기화
        if (hotelData.latitude && hotelData.longitude) {
          setCoordinates({ lat: hotelData.latitude, lng: hotelData.longitude });
          console.log('[ReservationConfirmation] Coordinates set:', {
            hotelId,
            latitude: hotelData.latitude,
            longitude: hotelData.longitude,
          });
        } else {
          console.log('[ReservationConfirmation] No coordinates available for hotel:', {
            hotelId,
            address: hotelData.address,
          });
          toast({
            title: '좌표 정보 없음',
            description: '호텔 좌표를 찾을 수 없습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }

        const photosData = await fetchHotelPhotos(hotelId, 'room', roomInfo);
        console.log(`[ReservationConfirmation] Photos for room ${roomInfo}:`, photosData);
        if (photosData?.roomPhotos && photosData.roomPhotos.length > 0) {
          setRoomImage(photosData.roomPhotos[0].photoUrl);
        }

        const checkInTime = hotelData?.checkInTime || '15:00';
        const checkOutTime = hotelData?.checkOutTime || '11:00';

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
      setStatusText('예약확정');
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
    console.log('[ReservationConfirmation] Address clicked, checking coordinates:', {
      address: hotelInfo?.address,
      latitude: coordinates?.lat,
      longitude: coordinates?.lng,
    });

    if (coordinates && coordinates.lat && coordinates.lng) {
      // 좌표가 있는 경우 T맵 자동 실행
      handleTMapNavigation();
    } else {
      // 좌표가 없는 경우 주소 복사만 가능
      toast({
        title: '위치 정보 없음',
        description: '호텔 좌표 정보를 찾을 수 없습니다. 주소를 복사할 수 있습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTMapNavigation = () => {
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      // 좌표가 없으면 지도 모달 표시
      setIsMapOpen(true);
      return;
    }

    const { lat, lng } = coordinates;
    const tmapUrl = `tmap://route?goalx=${lng}&goaly=${lat}&name=${encodeURIComponent(hotelInfo?.hotelName || '호텔')}`;
    console.log('[ReservationConfirmation] TMap URL:', tmapUrl);
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid || isIOS) {
        // T맵이 설치되지 않은 경우 지도 모달 표시
        setIsMapOpen(true);
      } else {
        toast({
          title: 'T맵 설치 필요',
          description: 'T맵 앱이 설치되어 있지 않습니다. 기본 지도를 표시합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        setIsMapOpen(true);
      }
    }, 2000);
  };

  const handleCopyAddress = () => {
    if (hotelInfo && hotelInfo.address) {
      navigator.clipboard.writeText(hotelInfo.address).then(() => {
        toast({
          title: '주소 복사 완료',
          description: '호텔 주소가 클립보드에 복사되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }).catch((error) => {
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
            src={roomImage}
            alt={roomInfo}
            h="150px"
            w="100%"
            objectFit="cover"
            borderRadius="md"
            onError={handleImageError}
          />
          <Box p={5}>
            <VStack align="start" spacing={2}>
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
                <Flex align="center" mb={2} flexWrap="wrap">
                  <Icon as={FaMapMarkerAlt} color="teal.500" boxSize={4} mr={2} />
                  <Button
                    variant="link"
                    color="teal.600"
                    onClick={handleAddressClick}
                    textAlign="left"
                    fontSize="sm"
                    p={0}
                    _hover={{ color: 'teal.800', textDecoration: 'underline' }}
                  >
                    위치: {hotelInfo.address || '주소 정보 없음'}
                  </Button>
                  <Flex align="center" ml={4}>
                    <Button
                      variant="link"
                      color="gray.600"
                      onClick={handleCopyAddress}
                      fontSize="sm"
                      p={0}
                      _hover={{ color: 'gray.800', textDecoration: 'underline' }}
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={FaCopy} color="gray.500" boxSize={4} />
                    </Button>
                  </Flex>
                </Flex>
              )}
            </VStack>
          </Box>
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
                colorScheme="teal"
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

      {/* 지도 모달 (T맵 설치되지 않은 경우 표시) */}
      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>호텔 위치</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="md" color="gray.600" mb={2}>
              호텔 ID: {hotelId}
            </Text>
            <Text fontSize="md" color="gray.600" mb={4}>
              주소: {hotelInfo?.address || '주소 정보 없음'}
            </Text>
            <Box h="400px" w="100%">
              {coordinates && coordinates.lat && coordinates.lng ? (
                <Map
                  address={hotelInfo?.address}
                  latitude={coordinates.lat}
                  longitude={coordinates.lng}
                  onCoordinatesChange={() => {}}
                />
              ) : (
                <Text color="red.500">지도 데이터를 로드할 수 없습니다.</Text>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button
                variant="outline"
                color="teal.600"
                leftIcon={<FaMapSigns />}
                onClick={handleTMapNavigation}
              >
                T맵으로 길찾기
              </Button>
              <Button
                variant="outline"
                color="gray.600"
                leftIcon={<FaCopy />}
                onClick={handleCopyAddress}
              />
              <Button colorScheme="gray" onClick={() => setIsMapOpen(false)}>
                닫기
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ReservationConfirmation;