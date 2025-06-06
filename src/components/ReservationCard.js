import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  VStack,
  Divider,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  ModalBody,
  Flex,
  Icon,
  HStack,
  Grid,
  IconButton,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaMapSigns, FaCopy, FaPhone } from 'react-icons/fa';
import { format, differenceInCalendarDays } from 'date-fns';
import { useToast } from '@chakra-ui/react';
import Map from './HotelMap';

// 기본 이미지 경로
const defaultRoomImage = '/assets/default-room1.jpg';

// 한국 시간으로 Date 객체 생성하는 함수
const getKoreanDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60 * 1000);
};

const ReservationCard = ({ reservation, onCancelReservation, isConfirmed }) => {
  const {
    _id,
    hotelName = '알 수 없음',
    hotelId = '',
    roomInfo = '정보 없음',
    checkIn,
    checkOut,
    price,
    paymentMethod = '현장결제',
    address,
    photoUrl,
    customerName,
    latitude,
    longitude,
    hotelPhoneNumber,
    reservationDate,
    originalPrice,
    discount = 0,
    fixedDiscount = 0,
    discountType = null,
    eventName,
    eventUuid,
    couponDiscount = 0,
    couponFixedDiscount = 0,
    couponCode = null,
    numDays, // 백엔드에서 저장된 numDays 활용
  } = reservation || {};

  console.log(
    `[ReservationCard] Event UUID for reservation ${_id}: ${eventUuid}`
  );

  const safePrice = typeof price === 'number' ? price : 0;
  const safeOriginalPrice =
    typeof originalPrice === 'number' ? originalPrice : safePrice; // 총액
  const safeDiscount = typeof discount === 'number' ? discount : 0;
  const safeFixedDiscount =
    typeof fixedDiscount === 'number' ? fixedDiscount : 0;
  const safeCouponDiscount =
    typeof couponDiscount === 'number' ? couponDiscount : 0;
  const safeCouponFixedDiscount =
    typeof couponFixedDiscount === 'number' ? couponFixedDiscount : 0;
  // 숙박일: 백엔드에서 저장된 numDays 사용, 없으면 계산
  const safeNumDays =
    numDays ||
    (checkIn && checkOut
      ? Math.max(
          differenceInCalendarDays(new Date(checkOut), new Date(checkIn)),
          1
        )
      : 1);
  // 총 원본 금액: originalPrice는 이미 총액이므로 numDays 곱셈 제거
  const totalOriginalPrice = safeOriginalPrice;
  const thumbnail = photoUrl || defaultRoomImage;
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  const [isMapOpen, setIsMapOpen] = useState(false);

  // 할인 금액 계산 (소수점 버림)
  const eventDiscountAmount = (() => {
    if (discountType === 'fixed' && safeFixedDiscount > 0) {
      return safeFixedDiscount;
    }
    if (discountType === 'percentage' && safeDiscount > 0) {
      return Math.floor(totalOriginalPrice * (safeDiscount / 100));
    }
    return 0;
  })();

  const couponDiscountAmount = (() => {
    if (safeCouponFixedDiscount > 0) {
      return safeCouponFixedDiscount;
    }
    if (safeCouponDiscount > 0) {
      return Math.floor(
        (totalOriginalPrice - eventDiscountAmount) * (safeCouponDiscount / 100)
      );
    }
    return 0;
  })();

  console.log('[ReservationCard] Discount info:', {
    eventDiscount: safeDiscount,
    fixedDiscount: safeFixedDiscount,
    discountType,
    eventDiscountAmount,
    couponDiscount: safeCouponDiscount,
    couponFixedDiscount: safeCouponFixedDiscount,
    couponDiscountAmount,
    eventName,
    couponCode,
    safeNumDays,
    totalOriginalPrice,
  });

  const getCancellationStatus = () => {
    if (!reservationDate || !checkIn) {
      console.log('Required dates missing:', { reservationDate, checkIn });
      return {
        canCancel: false,
        message: '예약 정보 없음',
        color: 'gray.500',
        description: '',
      };
    }

    try {
      const currentDate = getKoreanDate();
      const checkInDate = new Date(checkIn);
      const checkInDay2PM = new Date(checkInDate);
      checkInDay2PM.setHours(14, 0, 0, 0);

      const reservationDateTime = new Date(reservationDate);

      const timeSinceReservation =
        currentDate.getTime() - reservationDateTime.getTime();
      const isWithin15Minutes = timeSinceReservation <= 15 * 60 * 1000;

      console.log('Cancellation Check:', {
        currentDateKST: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
        checkInDay2PMKST: format(checkInDay2PM, 'yyyy-MM-dd HH:mm:ss'),
        reservationDateKST: format(reservationDateTime, 'yyyy-MM-dd HH:mm:ss'),
        timeSinceReservationMinutes: Math.floor(
          timeSinceReservation / (60 * 1000)
        ),
        isWithin15Minutes,
        isBeforeCheckInDay2PM: currentDate < checkInDay2PM,
      });

      if (currentDate < checkInDay2PM) {
        return {
          canCancel: true,
          message: '취소 가능',
          color: 'blue.500',
          description: '체크인 당일 오후 2시 이전까지 취소 가능합니다.',
        };
      }

      if (currentDate >= checkInDay2PM && isWithin15Minutes) {
        return {
          canCancel: true,
          message: '15분 이내 취소 가능',
          color: 'orange.500',
          description: '예약 생성 후 15분 이내 취소 가능합니다.',
        };
      }

      return {
        canCancel: false,
        message: '예약이 확정되었습니다',
        color: 'green.500',
        description: '',
      };
    } catch (error) {
      console.error('Error in getCancellationStatus:', error);
      return {
        canCancel: false,
        message: '상태 확인 오류',
        color: 'red.500',
        description: '',
      };
    }
  };

  const cancellationStatus = getCancellationStatus();

  const handleCancelClick = () => {
    if (cancellationStatus.canCancel && onCancelReservation && _id) {
      onCancelReservation(_id);
    } else if (!onCancelReservation) {
      toast({
        title: '취소 기능 오류',
        description: '취소 기능이 제공되지 않았습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddressClick = () => {
    if (latitude && longitude) {
      setIsMapOpen(true);
    } else {
      toast({
        title: '위치 정보 없음',
        description: '호텔 좌표 정보를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTMapNavigation = () => {
    if (!latitude || !longitude) {
      toast({
        title: '좌표 정보 없음',
        description: '호텔 좌표를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const tmapUrl = `tmap://route?goalx=${longitude}&goaly=${latitude}&name=${encodeURIComponent(
      hotelName || '호텔'
    )}`;
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href =
          'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
      } else if (isIOS) {
        window.location.href = 'https://apps.apple.com/kr/app/tmap/id431589174';
      } else {
        toast({
          title: 'T맵 설치 필요',
          description:
            'T맵 앱이 설치되어 있지 않습니다. 설치 페이지로 이동합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 2000);
  };

  const handleCopyAddress = () => {
    if (!address) {
      toast({
        title: '주소 정보 없음',
        description: '복사할 주소가 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    navigator.clipboard
      .writeText(address)
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
        console.error('[ReservationCard] 주소 복사 실패:', error);
        toast({
          title: '주소 복사 실패',
          description: `주소를 복사하는 데 실패했습니다: ${error.message}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  return (
    <Box
      w="100%"
      maxW={{ base: '100%', sm: '95%', md: 'container.md' }}
      mx="auto"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={isConfirmed ? 'gray.50' : cardBg}
      shadow="md"
      p={4}
      transition="background-color 0.2s"
      _hover={{
        bg: isConfirmed ? 'gray.100' : 'gray.50',
      }}
    >
      <VStack align="stretch" spacing={3}>
        <Image
          src={thumbnail}
          alt="thumbnail"
          h={{ base: '180px', sm: '200px', md: '250px' }}
          w="100%"
          objectFit="cover"
          borderRadius="md"
          onError={(e) => (e.target.src = defaultRoomImage)}
        />

        <VStack align="start" spacing={2}>
          <Text fontWeight="bold" fontSize="lg">
            {hotelName} ({hotelId})
          </Text>
          <Divider />

          <Grid templateColumns="auto 1fr" gap={2} width="100%" pl={4}>
            {/* ───────────── 기본 예약 정보 ───────────── */}
            <Text fontSize="sm" color="gray.600">
              예약 번호:
            </Text>
            <Text fontSize="sm">{`WEB-${_id?.slice(-8) || '알 수 없음'}`}</Text>

            <Text fontSize="sm" color="gray.600">
              예약자:
            </Text>
            <Text fontSize="sm">{customerName || '예약자 정보 없음'}</Text>

            <Text fontSize="sm" color="gray.600">
              객실:
            </Text>
            <Text fontSize="sm">{roomInfo}</Text>

            <Text fontSize="sm" color="gray.600">
              결제:
            </Text>
            <Text fontSize="sm">{paymentMethod}</Text>

            <Text fontSize="sm" color="gray.600">
              체크인:
            </Text>
            <Text fontSize="sm">
              {checkIn ? format(new Date(checkIn), 'yyyy-MM-dd HH:mm') : 'N/A'}
            </Text>

            <Text fontSize="sm" color="gray.600">
              체크아웃:
            </Text>
            <Text fontSize="sm">
              {checkOut
                ? format(new Date(checkOut), 'yyyy-MM-dd HH:mm')
                : 'N/A'}
            </Text>

            <Text fontSize="sm" color="gray.400">
              예약 일시:
            </Text>
            <Text fontSize="sm" color="gray.400">
              {reservationDate
                ? format(new Date(reservationDate), 'yyyy-MM-dd HH:mm')
                : 'N/A'}
            </Text>

            <Text fontSize="sm" color="gray.600">
              숙박 일수:
            </Text>
            <Text fontSize="sm">{safeNumDays}박</Text>

            {eventName && (
              <>
                <Text fontSize="sm" color="gray.600">
                  적용된 이벤트:
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="teal.600">
                  {eventName}
                </Text>
              </>
            )}

            {couponCode && (
              <>
                <Text fontSize="sm" color="gray.600">
                  적용된 쿠폰:
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="teal.600">
                  {couponCode}
                </Text>
              </>
            )}

            {/* ───────────── 할인 전/후 가격 & 할인 내역 ───────────── */}
            {totalOriginalPrice > safePrice && (
              <>
                {/* 1) 할인 전 원가 */}
                <Text fontSize="sm" color="gray.600">
                  할인 전 금액:
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  textDecoration="line-through"
                >
                  ₩{totalOriginalPrice.toLocaleString()}원
                </Text>

                {/* 2) 이벤트 할인 */}
                {discountType === 'percentage' && safeDiscount > 0 && (
                  <Text fontSize="xs" color="red.500">
                    이벤트 {safeDiscount}% 할인 (₩
                    {eventDiscountAmount.toLocaleString()}원)
                  </Text>
                )}
                {discountType === 'fixed' && safeFixedDiscount > 0 && (
                  <Text fontSize="xs" color="red.500">
                    이벤트 할인: ₩{safeFixedDiscount.toLocaleString()}원
                  </Text>
                )}

                {/* 3) 쿠폰 할인 */}
                {safeCouponDiscount > 0 && (
                  <Text fontSize="xs" color="red.500">
                    쿠폰 {safeCouponDiscount}% 할인 (₩
                    {couponDiscountAmount.toLocaleString()}원)
                  </Text>
                )}
                {safeCouponFixedDiscount > 0 && (
                  <Text fontSize="xs" color="red.500">
                    쿠폰 할인: ₩{safeCouponFixedDiscount.toLocaleString()}원
                  </Text>
                )}
              </>
            )}

            {/* 4) 최종 결제 금액 (줄바꿈) */}
            <Box gridColumn="1 / -1">
              <Text fontSize="sm" fontWeight="semibold" color="blue.500" mt={0}>
                최종 금액: ₩{safePrice.toLocaleString()}원
              </Text>
            </Box>
          </Grid>
        </VStack>

        <Divider />

        <VStack align="start" spacing={2} w="100%">
          {/* cancellationStatus & address/phone 섹션은 원본 그대로 */}
          {!cancellationStatus.canCancel ? (
            <Text
              fontSize="md"
              color={cancellationStatus.color}
              fontWeight="semibold"
              w="100%"
              textAlign="center"
            >
              {cancellationStatus.message}
            </Text>
          ) : (
            <>
              <Text fontSize="xs" color="gray.500">
                {cancellationStatus.description}
              </Text>
              <Button
                size="sm"
                colorScheme={cancellationStatus.color.split('.')[0]}
                onClick={handleCancelClick}
                w="100%"
              >
                {cancellationStatus.message}
              </Button>
            </>
          )}

          {address && (
            <Flex align="center" w="100%">
              <Icon as={FaMapMarkerAlt} color="teal.500" boxSize={4} mr={2} />
              <Text
                flex="1"
                fontSize="sm"
                color="teal.600"
                cursor="pointer"
                onClick={handleAddressClick}
                _hover={{ color: 'teal.800', textDecoration: 'underline' }}
              >
                {address}
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

          {hotelPhoneNumber && (
            <Flex align="center" w="100%">
              <Icon as={FaPhone} color="blue.500" boxSize={4} mr={2} />
              <Text
                flex="1"
                fontSize="sm"
                color="blue.600"
                cursor="pointer"
                onClick={() =>
                  (window.location.href = `tel:${hotelPhoneNumber.replace(
                    /[^0-9]/g,
                    ''
                  )}`)
                }
                _hover={{ color: 'blue.800', textDecoration: 'underline' }}
              >
                {hotelPhoneNumber}
              </Text>
            </Flex>
          )}
        </VStack>
      </VStack>

      {/* 지도 모달 역시 원본 그대로 */}
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
              주소: {address || '주소 정보 없음'}
            </Text>
            <Box h="400px" w="100%">
              {latitude && longitude ? (
                <Map
                  address={address}
                  latitude={latitude}
                  longitude={longitude}
                  onCoordinatesChange={() => {}}
                />
              ) : (
                <Text color="red.500">지도 데이터를 불러올 수 없습니다.</Text>
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
                isDisabled={!latitude || !longitude}
              >
                T맵으로 길찾기
              </Button>
              <Button
                variant="outline"
                color="gray.600"
                leftIcon={<FaCopy />}
                onClick={handleCopyAddress}
                isDisabled={!address}
              >
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

export default ReservationCard;