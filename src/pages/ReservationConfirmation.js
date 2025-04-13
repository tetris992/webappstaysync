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
import { useAuth } from '../contexts/AuthContext';
import {
  createReservation,
  fetchCustomerHotelSettings,
  fetchHotelPhotos,
  fetchHotelList,
} from '../api/api';
import { differenceInCalendarDays, format } from 'date-fns';
import Map from '../components/Map';
import { ArrowBackIcon } from '@chakra-ui/icons';

const ReservationConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [hotelId, setHotelId] = useState(null);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [price, setPrice] = useState(0);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [hotelPhoneNumber, setHotelPhoneNumber] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [roomImage, setRoomImage] = useState('/assets/default-room1.jpg');
  const specialRequests = null;
  const [isMapOpen, setIsMapOpen] = useState(false);

  // location.state에서 필요한 정보 추출
  const roomInfo = location.state?.roomInfo || '';
  const stateCheckIn = location.state?.checkIn || null;
  const stateCheckOut = location.state?.checkOut || null;

  // 숙박 일수 계산
  const numNights = stateCheckIn && stateCheckOut
    ? (() => {
        const checkInDate = new Date(stateCheckIn);
        const checkOutDate = new Date(stateCheckOut);
        let nights = differenceInCalendarDays(checkOutDate, checkInDate);
        return nights < 1 ? 1 : nights;
      })()
    : 1;

  // 호텔 정보 및 사진 로드
  const loadHotelInfoAndPhotos = useCallback(async (hotelId) => {
    try {
      // 호텔 목록에서 전화번호 가져오기
      const hotelList = await fetchHotelList();
      const hotelData = hotelList.find(hotel => hotel.hotelId === hotelId);
      if (hotelData && hotelData.phoneNumber) {
        setHotelPhoneNumber(hotelData.phoneNumber);
      }

      const hotelSettings = await fetchCustomerHotelSettings(hotelId);
      console.log('[ReservationConfirmation] Hotel data received:', {
        hotelId: hotelSettings.hotelId,
        hotelName: hotelSettings.hotelName,
        address: hotelSettings.address,
        latitude: hotelSettings.latitude,
        longitude: hotelSettings.longitude,
      });
      setHotelInfo(hotelSettings);

      // 좌표 초기화
      if (hotelSettings.latitude && hotelSettings.longitude) {
        setCoordinates({ lat: hotelSettings.latitude, lng: hotelSettings.longitude });
        console.log('[ReservationConfirmation] Coordinates set:', {
          hotelId,
          latitude: hotelSettings.latitude,
          longitude: hotelSettings.longitude,
        });
      } else {
        console.log('[ReservationConfirmation] No coordinates available for hotel:', {
          hotelId,
          address: hotelSettings.address,
        });
        toast({
          title: '좌표 정보 없음',
          description: '호텔 위치 정보를 불러올 수 없습니다.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }

      const photosData = await fetchHotelPhotos(hotelId, 'room', roomInfo);
      console.log(
        `[ReservationConfirmation] Photos for room ${roomInfo}:`,
        photosData
      );
      if (photosData?.roomPhotos && photosData.roomPhotos.length > 0) {
        setRoomImage(photosData.roomPhotos[0].photoUrl);
      }

      const checkInTime = hotelSettings?.checkInTime || '15:00';
      const checkOutTime = hotelSettings?.checkOutTime || '11:00';

      const checkInDateTimeStr = stateCheckIn
        ? `${stateCheckIn}T${checkInTime}:00+09:00`
        : null;
      const checkOutDateTimeStr = stateCheckOut
        ? `${stateCheckOut}T${checkOutTime}:00+09:00`
        : null;

      const checkInDateTime = checkInDateTimeStr
        ? new Date(checkInDateTimeStr)
        : null;
      const checkOutDateTime = checkOutDateTimeStr
        ? new Date(checkOutDateTimeStr)
        : null;

      setCheckIn(checkInDateTime);
      setCheckOut(checkOutDateTime);
    } catch (error) {
      console.error('[ReservationConfirmation] Error loading hotel info:', error);
      toast({
        title: '호텔 정보 로드 실패',
        description: '호텔 정보를 불러오는 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [stateCheckIn, stateCheckOut, roomInfo, toast]);

  // 초기 데이터 로드
  useEffect(() => {
    if (!user) {
      toast({
        title: '인증 오류',
        description: '로그인이 필요합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login', { state: { from: location } });
      return;
    }

    if (location.state) {
      const { hotelId, price } = location.state;
      setHotelId(hotelId);
      setPrice(price);
      loadHotelInfoAndPhotos(hotelId);
    }
  }, [location.state, loadHotelInfoAndPhotos, user, navigate, location, toast]);

  const handleConfirm = async () => {
    if (!user) {
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
      customerName: user.name,
      phoneNumber: user.phoneNumber,
      hotelPhoneNumber: hotelPhoneNumber,
      roomInfo: roomInfo,
      originalRoomInfo: '',
      roomNumber: '',
      checkIn: checkIn ? format(checkIn, "yyyy-MM-dd'T'HH:mm:ss'+09:00'") : null,
      checkOut: checkOut ? format(checkOut, "yyyy-MM-dd'T'HH:mm:ss'+09:00'") : null,
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
      hotelName: hotelInfo?.hotelName || '알 수 없음',
      address: hotelInfo?.address || '주소 정보 없음',
    };

    try {
      setIsLoading(true);
      const response = await createReservation(finalReservationData);
      setReservationId(response.reservationId);
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
    console.log(
      '[ReservationConfirmation] Address clicked, checking coordinates:',
      {
        address: hotelInfo?.address,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
      }
    );

    if (coordinates && coordinates.lat && coordinates.lng) {
      // 좌표가 있는 경우 T맵 자동 실행
      handleTMapNavigation();
    } else {
      // 좌표가 없는 경우 주소 복사만 가능
      toast({
        title: '위치 정보 없음',
        description:
          '호텔 좌표 정보를 찾을 수 없습니다. 주소를 복사할 수 있습니다.',
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
    const tmapUrl = `tmap://route?goalx=${lng}&goaly=${lat}&name=${encodeURIComponent(
      hotelInfo?.hotelName || '호텔'
    )}`;
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
          description:
            'T맵 앱이 설치되어 있지 않습니다. 기본 지도를 표시합니다.',
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
      navigator.clipboard
        .writeText(hotelInfo.address)
        .then(() => {
          toast({
            title: '주소 복사 완료',
            description: '호텔 주소가 클립보드에 복사되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
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
    console.error(
      `[ReservationConfirmation] Failed to load image for room ${roomInfo}: ${roomImage}`
    );
    e.target.src = '/assets/default-room1.jpg';
  };

  if (!location.state) {
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
    <Box
      minH="100vh"
      bg="gray.50"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      flexDirection="column"
      w="100%"
    >
      {/* 헤더 */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        width="100%"
        py={4}
      >
        <Container maxW="container.sm">
          <Flex align="center" justify="center" position="relative">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              position="absolute"
              left={0}
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
            />
            <Text
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textAlign="center"
            >
              예약 확인
            </Text>
          </Flex>
        </Container>
      </Box>

      {/* 스크롤되는 본문 영역 */}
      <Box
        flex={1}
        overflowY="auto"
        sx={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.300',
            borderRadius: '24px',
          },
        }}
      >
        <Container
          maxW={{ base: "100%", sm: "95%", md: "container.sm" }}
          py={{ base: 4, sm: 6 }}
          px={{ base: 4, sm: 6 }}
        >
          <VStack
            spacing={4}
            align="stretch"
            w="100%"
            pb={{ base: "90px", md: "100px" }}
          >
            {/* 객실 사진 */}
            <Box
              bg="white"
              borderRadius="xl"
              overflow="hidden"
              shadow="sm"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Image
                src={roomImage}
                alt={roomInfo}
                h="250px"
                w="100%"
                objectFit="cover"
                onError={handleImageError}
              />
            </Box>

            {/* 호텔 정보 */}
            <Box
              bg="white"
              borderRadius="xl"
              p={6}
              shadow="sm"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <VStack align="stretch" spacing={3} w="100%">
                <Text fontSize="xl" fontWeight="bold" mb={2}>
                  {hotelInfo?.hotelName || '부산호텔'} ({hotelId})
                </Text>
                
                {/* 주소 정보 */}
                {hotelInfo && (
                  <Flex align="center" w="100%">
                    <Icon as={FaMapMarkerAlt} color="teal.500" boxSize={4} mr={2} />
                    <Text
                      flex="1"
                      fontSize="md"
                      color="gray.700"
                      cursor="pointer"
                      onClick={handleAddressClick}
                      _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                    >
                      {hotelInfo.address || '주소 정보 없음'}
                    </Text>
                    <IconButton
                      icon={<FaCopy />}
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      aria-label="주소 복사"
                      color="gray.500"
                      _hover={{ color: 'teal.600' }}
                    />
                  </Flex>
                )}

                {/* 전화번호 정보 */}
                {hotelPhoneNumber && (
                  <Flex align="center" w="100%" justify="flex-end">
                    <Icon as={FaPhone} color="teal.500" boxSize={4} mr={2} />
                    <Text fontSize="md" color="gray.700">
                      {hotelPhoneNumber}
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>

            {/* 예약 정보 */}
            <Box
              bg="white"
              borderRadius="xl"
              p={6}
              shadow="sm"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <VStack align="start" spacing={4} width="100%">
                <Text fontWeight="bold" fontSize="lg" color="gray.700">
                  예약 정보
                </Text>
                <Divider />
                <Grid templateColumns="1fr 2fr" gap={3} width="100%">
                  <Text color="gray.600">예약 번호</Text>
                  <Text fontWeight="medium">{reservationId || '생성 중...'}</Text>
                  
                  <Text color="gray.600">예약자</Text>
                  <Text fontWeight="medium">{user?.name || '예약자 정보 없음'}</Text>
                  
                  <Text color="gray.600">객실</Text>
                  <Text fontWeight="medium">{roomInfo}</Text>
                  
                  <Text color="gray.600">체크인</Text>
                  <Text fontWeight="medium">{checkIn ? format(checkIn, 'yyyy-MM-dd HH:mm') : 'N/A'}</Text>
                  
                  <Text color="gray.600">체크아웃</Text>
                  <Text fontWeight="medium">{checkOut ? format(checkOut, 'yyyy-MM-dd HH:mm') : 'N/A'}</Text>
                  
                  <Text color="gray.600">숙박 일수</Text>
                  <Text fontWeight="medium">{numNights}박</Text>
                  
                  <Text color="gray.600">결제</Text>
                  <Text fontWeight="medium">현장결제</Text>
                </Grid>
                <Divider />
                <Flex justify="space-between" width="100%" align="center">
                  <Text color="gray.600">총 결제 금액</Text>
                  <Text fontSize="xl" fontWeight="bold" color="blue.500">
                    {price.toLocaleString()}원
                  </Text>
                </Flex>

                {/* 예약하기 버튼을 카드 안으로 이동 */}
                <Box width="100%" mt={6}>
                  {isLoading ? (
                    <Box textAlign="center" py={2}>
                      <Spinner size="lg" color="brand.500" />
                    </Box>
                  ) : (
                    <Button
                      w="100%"
                      bg="blue.500"
                      color="white"
                      size="lg"
                      onClick={handleConfirm}
                      isLoading={isLoading}
                      _hover={{ bg: 'blue.600' }}
                      _active={{ bg: 'blue.700' }}
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
    </Box>
  );
};

export default ReservationConfirmation;
