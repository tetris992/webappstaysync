import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaMapSigns, FaCopy } from 'react-icons/fa';
import { format, isAfter } from 'date-fns';
import { useToast } from '@chakra-ui/react';
import Map from './Map';

const ReservationCard = ({ reservation, onCancel }) => {
  const {
    _id,
    hotelName = '알 수 없음',
    hotelId = '',
    roomInfo = '정보 없음',
    checkIn,
    checkOut,
    numDays,
    price,
    reservationStatus,
    isCancelled,
    paymentMethod = '현장결제',
    address,
    phoneNumber,
    photoUrl,
    customerName,
    checkInTime = '15:00',
    checkOutTime = '11:00',
    latitude, // 좌표 추가
    longitude, // 좌표 추가
  } = reservation || {};

  const safePrice = typeof price === 'number' ? price : 0;
  const thumbnail = photoUrl || '../assets/default-room1.jpg';
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();

  const [statusText, setStatusText] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    const currentDateTime = new Date();

    const checkInDateTimeStr = checkIn
      ? `${checkIn.split(' ')[0]}T${checkInTime}:00+09:00`
      : null;
    const checkOutDateTimeStr = checkOut
      ? `${checkOut.split(' ')[0]}T${checkOutTime}:00+09:00`
      : null;

    const checkInDateTime = checkInDateTimeStr
      ? new Date(checkInDateTimeStr)
      : null;
    const checkOutDateTime = checkOutDateTimeStr
      ? new Date(checkOutDateTimeStr)
      : null;

    const checkInDeadline = checkInDateTime
      ? new Date(
          checkInDateTime.getFullYear(),
          checkInDateTime.getMonth(),
          checkInDateTime.getDate(),
          14,
          0,
          0
        )
      : null;

    if (isCancelled) {
      setStatusText('취소됨');
    } else if (checkOutDateTime && isAfter(currentDateTime, checkOutDateTime)) {
      setStatusText('사용완료');
    } else if (checkInDeadline && isAfter(currentDateTime, checkInDeadline)) {
      setStatusText('예약확정');
    } else if (checkInDateTime && isAfter(currentDateTime, checkInDateTime)) {
      setStatusText('예약확정');
    } else {
      setStatusText(reservationStatus || '확인필요');
    }
  }, [checkIn, checkOut, checkInTime, checkOutTime, isCancelled, reservationStatus]);

  const handleCancelClick = () => {
    if (
      onCancel &&
      !isCancelled &&
      statusText !== '예약확정' &&
      statusText !== '사용완료'
    ) {
      onCancel(_id);
    }
  };

  const handleAddressClick = () => {
    if (latitude || longitude) {
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
    const tmapUrl = `tmap://route?goalx=${longitude}&goaly=${latitude}&name=${encodeURIComponent(hotelName || '호텔')}`;
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
      } else if (isIOS) {
        window.location.href = 'https://apps.apple.com/kr/app/tmap/id431589174';
      } else {
        toast({
          title: 'T맵 설치 필요',
          description: 'T맵 앱이 설치되어 있지 않습니다. 설치 페이지로 이동합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 2000);
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address).then(() => {
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

  return (
    <Box
      w="full"
      maxW="sm"
      mx="auto"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      shadow="md"
      p={4}
    >
      <VStack align="stretch" spacing={3}>
        <Image
          src={thumbnail}
          alt="thumbnail"
          h="150px"
          w="100%"
          objectFit="cover"
          borderRadius="md"
        />
        <VStack align="start" spacing={2}>
          <Text fontWeight="bold" fontSize="lg">
            {hotelName} ({hotelId})
          </Text>
          <Divider />
          <Text fontSize="sm" color="gray.600">
            예약 번호: {`WEB-${_id.slice(-8)}`}
          </Text>
          <Text fontSize="sm" color="gray.600">
            예약자: {customerName || '예약자 정보 없음'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            객실: {roomInfo}
          </Text>
          <Text fontSize="sm" color="gray.600">
            결제: {paymentMethod}
          </Text>
          <Text fontSize="sm" color="gray.600">
            체크인:{' '}
            {checkIn ? format(new Date(checkIn), 'yyyy-MM-dd HH:mm') : 'N/A'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            체크아웃:{' '}
            {checkOut ? format(new Date(checkOut), 'yyyy-MM-dd HH:mm') : 'N/A'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            숙박 일수: {numDays || 1}박
          </Text>
          <Text fontWeight="semibold" color="blue.500">
            총 가격: {safePrice.toLocaleString()}원
          </Text>
          {address && (
            <Flex align="center" mb={2}>
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
                위치: {address}
              </Button>
            </Flex>
          )}
        </VStack>
        <Divider />
        <VStack align="start" spacing={2}>
          <Text
            fontSize="sm"
            color={
              statusText === '취소됨'
                ? 'red.500'
                : statusText === '사용완료'
                ? 'gray.500'
                : statusText === '예약확정'
                ? 'blue.500'
                : 'green.600'
            }
          >
            상태: {statusText}
          </Text>
          {paymentMethod === '현장결제' && (
            <Text fontSize="xs" color="gray.500">
              후불예약은 당일 14시 전까지 무료 취소 가능합니다.
            </Text>
          )}
          <Text fontSize="xs" color="gray.500">
            문의: {phoneNumber || '정보 없음'}
          </Text>
          <Divider />
          {!isCancelled &&
            statusText !== '예약확정' &&
            statusText !== '사용완료' && (
              <Button size="sm" colorScheme="red" onClick={handleCancelClick}>
                예약 취소
              </Button>
            )}
        </VStack>
      </VStack>

      {/* 지도 모달 */}
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
              <Map
                address={address}
                latitude={latitude}
                longitude={longitude}
                onCoordinatesChange={() => {}} // 좌표는 DB에서 가져오므로 콜백 불필요
              />
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