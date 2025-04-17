import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Grid,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaMapSigns, FaCopy, FaPhone } from 'react-icons/fa';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  createReservation,
  fetchCustomerHotelSettings,
  fetchHotelPhotos,
  fetchHotelList,
} from '../api/api';
import { differenceInCalendarDays, format } from 'date-fns';
import Map from '../components/Map';

const ReservationConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();

  const [hotelId, setHotelId] = useState(null);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [hotelPhoneNumber, setHotelPhoneNumber] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [roomImage, setRoomImage] = useState('/assets/default-room1.jpg');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [eventName, setEventName] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const {
    roomInfo = '',
    checkIn: stateCheckIn = null,
    checkOut: stateCheckOut = null,
    specialRequests = null,
    hotelId: initHotelId,
    price: initPrice,
    originalPrice: initOriginal,
    discount: initDiscount,
    eventName: initEventName,
  } = location.state || {};

  const numNights = stateCheckIn && stateCheckOut
    ? Math.max(differenceInCalendarDays(new Date(stateCheckOut), new Date(stateCheckIn)), 1)
    : 1;

  const loadHotelInfoAndPhotos = useCallback(async (hotelId) => {
    if (!hotelId) {
      toast({
        title: '호텔 ID 누락',
        description: '호텔 ID가 제공되지 않았습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const hotelList = await fetchHotelList();
      const hotelData = hotelList.find((h) => h.hotelId === hotelId);
      setHotelPhoneNumber(hotelData?.phoneNumber || '연락처 준비중');

      const settings = await fetchCustomerHotelSettings(hotelId);
      setHotelInfo(settings);

      if (settings.latitude && settings.longitude) {
        setCoordinates({ lat: settings.latitude, lng: settings.longitude });
      } else {
        toast({
          title: '좌표 정보 없음',
          description: '호텔 위치 정보를 불러올 수 없습니다.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }

      const photosData = await fetchHotelPhotos(hotelId, 'room', roomInfo);
      if (photosData?.roomPhotos?.length) {
        setRoomImage(photosData.roomPhotos[0].photoUrl);
      }

      const inTime = settings.checkInTime || '15:00';
      const outTime = settings.checkOutTime || '11:00';
      const inDt = stateCheckIn ? new Date(`${stateCheckIn}T${inTime}:00+09:00`) : null;
      const outDt = stateCheckOut ? new Date(`${stateCheckOut}T${outTime}:00+09:00`) : null;
      setCheckIn(inDt);
      setCheckOut(outDt);
    } catch (err) {
      console.error('[ReservationConfirmation] load error:', err);
      toast({
        title: '호텔 정보 로드 실패',
        description: '호텔 정보를 불러오는 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [roomInfo, stateCheckIn, stateCheckOut, toast]);

  useEffect(() => {
    if (!location.state) return;
    const requiredFields = { initHotelId, initPrice, initOriginal, initDiscount };
    if (Object.values(requiredFields).some(field => field === undefined || field === null)) {
      toast({
        title: '필수 정보 누락',
        description: '예약에 필요한 필수 정보가 누락되었습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
      return;
    }

    setHotelId(initHotelId);
    setPrice(initPrice);
    setOriginalPrice(initOriginal);
    setDiscount(initDiscount);
    setEventName(initEventName || '');
    loadHotelInfoAndPhotos(initHotelId);
  }, [location.state, initHotelId, initPrice, initOriginal, initDiscount, initEventName, loadHotelInfoAndPhotos, toast, navigate]);

  const handleConfirm = async () => {
    if (!customer) {
      toast({
        title: '인증 오류',
        description: '로그인이 필요합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return navigate('/login');
    }

    const finalReservationData = {
      hotelId,
      siteName: '단잠',
      customerName: customer.name,
      phoneNumber: customer.phoneNumber,
      hotelPhoneNumber,
      roomInfo,
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd'T'HH:mm:ss'+09:00'") : null,
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd'T'HH:mm:ss'+09:00'") : null,
      reservationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'+09:00'"),
      reservationStatus: '예약완료',
      price,
      specialRequests,
      duration: numNights,
      paymentMethod: '현장결제',
      hotelName: hotelInfo?.hotelName || '알 수 없음',
      address: hotelInfo?.address || '주소 정보 없음',
      couponInfo: {
        discount: discount || 0,
        eventName: eventName || null,
      },
      additionalFees: 0,
      paymentStatus: '미결제',
      isCancelled: false,
      type: 'stay',
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
      const res = await createReservation(finalReservationData);
      setReservationId(res.reservationId);
      toast({
        title: '예약 성공',
        description: '예약이 완료되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/history', { replace: true });
    } catch (err) {
      console.error('[ReservationConfirmation] 예약 실패:', err);
      toast({
        title: '예약 실패',
        description: err.message || '예약을 완료하지 못했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (!hotelInfo?.address) {
      toast({
        title: '주소 정보 없음',
        description: '복사할 주소가 없습니다.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    navigator.clipboard.writeText(hotelInfo.address).then(() => {
      toast({
        title: '주소 복사 완료',
        description: '주소가 클립보드에 복사되었습니다.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }).catch((err) => {
      console.error('[ReservationConfirmation] 주소 복사 실패:', err);
      toast({
        title: '주소 복사 실패',
        description: '주소를 복사하는 데 실패했습니다.',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    });
  };

  const handleTMapNavigation = () => {
    if (!coordinates?.lat || !coordinates?.lng) {
      setIsMapOpen(true);
      return;
    }
    const url = `tmap://route?goalx=${coordinates.lng}&goaly=${coordinates.lat}&name=${encodeURIComponent(hotelInfo?.hotelName || '호텔')}`;
    window.location.href = url;
    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid || isIOS) {
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

  if (!location.state) {
    return (
      <Container maxW="container.sm" py={6} minH="100vh">
        <Text textAlign="center" color="red.500">
          예약 정보를 찾을 수 없습니다.
        </Text>
        <Button mt={4} w="full" onClick={() => navigate('/')}>
          홈으로 돌아가기
        </Button>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" display="flex" flexDir="column">
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" py={4}>
        <Container maxW="container.sm">
          <Flex align="center" justify="center" pos="relative">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              pos="absolute"
              left={0}
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
            />
            <Text fontSize="xl" fontWeight="bold">
              예약 확인
            </Text>
          </Flex>
        </Container>
      </Box>

      <Box flex={1} overflowY="auto">
        <Container maxW="container.sm" py={6}>
          <VStack spacing={6} align="stretch">
            <Box bg="white" rounded="lg" overflow="hidden">
              <Image
                src={roomImage}
                alt={roomInfo}
                objectFit="cover"
                w="100%"
                h="250px"
                onError={(e) => (e.target.src = '/assets/default-room1.jpg')}
              />
            </Box>

            <Box bg="white" p={6} rounded="lg" shadow="sm">
              <VStack align="stretch" spacing={3}>
                <Text fontSize="xl" fontWeight="bold">
                  {hotelInfo?.hotelName || '호텔 정보 로드 중...'} ({hotelId})
                </Text>
                <Flex align="center">
                  <Icon as={FaMapMarkerAlt} mr={2} color="teal.500" />
                  <Text
                    flex={1}
                    onClick={() => setIsMapOpen(true)}
                    cursor="pointer"
                    color={coordinates ? 'teal.600' : 'gray.500'}
                    _hover={coordinates ? { color: 'teal.800', textDecoration: 'underline' } : {}}
                  >
                    {hotelInfo?.address || '주소 정보 없음'}
                  </Text>
                  <IconButton
                    icon={<FaCopy />}
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    isDisabled={!hotelInfo?.address}
                  />
                </Flex>
                {hotelPhoneNumber && (
                  <Flex align="center" justify="flex-end">
                    <Icon as={FaPhone} mr={2} color="teal.500" />
                    <Text
                      color="teal.600"
                      cursor="pointer"
                      onClick={() => window.location.href = `tel:${hotelPhoneNumber.replace(/[^0-9]/g, '')}`}
                      _hover={{ color: 'teal.800', textDecoration: 'underline' }}
                    >
                      {hotelPhoneNumber}
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>

            <Box bg="white" p={6} rounded="lg" shadow="sm">
              <VStack align="stretch" spacing={4}>
                <Text fontWeight="bold">예약 정보</Text>
                <Divider />
                <Grid templateColumns="1fr 2fr" gap={3}>
                  <Text color="gray.600">예약 번호</Text>
                  <Text>{reservationId || '생성 중...'}</Text>
                  <Text color="gray.600">예약자</Text>
                  <Text>{customer?.name || '정보 없음'}</Text>
                  <Text color="gray.600">객실</Text>
                  <Text>{roomInfo || '정보 없음'}</Text>
                  <Text color="gray.600">체크인</Text>
                  <Text>{checkIn ? format(checkIn, 'yyyy-MM-dd HH:mm') : 'N/A'}</Text>
                  <Text color="gray.600">체크아웃</Text>
                  <Text>{checkOut ? format(checkOut, 'yyyy-MM-dd HH:mm') : 'N/A'}</Text>
                  <Text color="gray.600">숙박 일수</Text>
                  <Text>{numNights}박</Text>
                  <Text color="gray.600">결제</Text>
                  <Text>현장결제</Text>
                  <Text color="gray.600">예약 일시</Text>
                  <Text color="gray.400">
                    {format(new Date(), 'yyyy-MM-dd HH:mm:ss')} (현재 시간 KST)
                  </Text>
                  {eventName && (
                    <>
                      <Text color="gray.600">정상된 이벤트</Text>
                      <Text color="teal.600">{eventName}</Text>
                    </>
                  )}
                </Grid>

                <Divider />

                <Flex justify="space-between" align="center">
                  <Text color="gray.600">총 결제 금액</Text>
                  <Box textAlign="right">
                    {discount > 0 && (
                      <Text fontSize="sm" color="gray.500" textDecoration="line-through">
                        {originalPrice.toLocaleString()}원
                      </Text>
                    )}
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {price.toLocaleString()}원
                    </Text>
                    {discount > 0 && (
                      <Text fontSize="xs" color="red.500">
                        {discount}% 할인
                      </Text>
                    )}
                  </Box>
                </Flex>

                <Box pt={4}>
                  {isLoading ? (
                    <Flex justify="center">
                      <Spinner size="lg" color="blue.500" />
                    </Flex>
                  ) : (
                    <Button
                      colorScheme="blue"
                      w="full"
                      size="lg"
                      onClick={handleConfirm}
                      isDisabled={!hotelId || !price}
                    >
                      예약하기
                    </Button>
                  )}
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>호텔 위치</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {coordinates?.lat && coordinates?.lng ? (
              <Map
                address={hotelInfo?.address}
                latitude={coordinates.lat}
                longitude={coordinates.lng}
                onCoordinatesChange={() => {}}
              />
            ) : (
              <Text color="red.500">지도 데이터를 불러올 수 없습니다.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                leftIcon={<FaMapSigns />}
                onClick={handleTMapNavigation}
                isDisabled={!coordinates}
              >
                T맵 길찾기
              </Button>
              <Button onClick={handleCopyAddress} isDisabled={!hotelInfo?.address}>
                주소 복사
              </Button>
              <Button colorScheme="gray" onClick={() => setIsMapOpen(false)}>
                닫기
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ReservationConfirmation;