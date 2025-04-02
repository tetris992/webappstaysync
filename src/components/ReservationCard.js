import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  VStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { format, isAfter } from 'date-fns';

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
    checkInTime = '15:00', // 기본값 (호텔 설정에서 가져왔다고 가정)
    checkOutTime = '11:00', // 기본값 (호텔 설정에서 가져왔다고 가정)
  } = reservation || {};

  const safePrice = typeof price === 'number' ? price : 0;
  const thumbnail = photoUrl || '../assets/default-room1.jpg';
  const cardBg = useColorModeValue('white', 'gray.700');

  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const currentDateTime = new Date();

    // 체크인 시간과 체크아웃 시간 조합
    const checkInDateTimeStr = checkIn
      ? `${checkIn.split(' ')[0]}T${checkInTime}:00+09:00`
      : null;
    const checkOutDateTimeStr = checkOut
      ? `${checkOut.split(' ')[0]}T${checkOutTime}:00+09:00`
      : null;

    const checkInDateTime = checkInDateTimeStr ? new Date(checkInDateTimeStr) : null;
    const checkOutDateTime = checkOutDateTimeStr ? new Date(checkOutDateTimeStr) : null;

    // 상태 결정
    if (isCancelled) {
      setStatusText('취소됨');
    } else if (checkOutDateTime && isAfter(currentDateTime, checkOutDateTime)) {
      setStatusText('사용완료');
    } else if (checkInDateTime && isAfter(currentDateTime, checkInDateTime)) {
      setStatusText('예약확정');
    } else {
      setStatusText(reservationStatus || '확인필요');
    }
  }, [checkIn, checkOut, checkInTime, checkOutTime, isCancelled, reservationStatus]);

  const handleCancelClick = () => {
    if (onCancel && !isCancelled && statusText !== '예약확정' && statusText !== '사용완료') {
      onCancel(_id);
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
            예약 번호: {`WEB-${_id.slice(-8)}`} {/* 예약 번호 표시 */}
          </Text>
          <Text fontSize="sm" color="gray.600">
            예약자: {customerName || '예약자 정보 없음'} {/* 고객 이름 표시 */}
          </Text>
          <Text fontSize="sm" color="gray.600">
            객실: {roomInfo}
          </Text>
          <Text fontSize="sm" color="gray.600">
            결제: {paymentMethod}
          </Text>
          <Text fontSize="sm" color="gray.600">
            체크인: {checkIn ? format(new Date(checkIn), 'yyyy-MM-dd HH:mm') : 'N/A'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            체크아웃: {checkOut ? format(new Date(checkOut), 'yyyy-MM-dd HH:mm') : 'N/A'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            숙박 일수: {numDays || 1}박
          </Text>
          <Text fontWeight="semibold" color="blue.500">
            총 가격: {safePrice.toLocaleString()}원
          </Text>
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
          {address && (
            <Text fontSize="xs" color="gray.500">
              위치: {address}
            </Text>
          )}
          {paymentMethod === '현장결제' && (
            <Text fontSize="xs" color="gray.500">
              후불예약은 당일 13시 전까지 무료 취소 가능합니다.
            </Text>
          )}
          <Text fontSize="xs" color="gray.500">
            문의: {phoneNumber || '정보 없음'}
          </Text>
          <Divider />
          {!isCancelled && statusText !== '예약확정' && statusText !== '사용완료' && (
            <Button size="sm" colorScheme="red" onClick={handleCancelClick}>
              예약 취소
            </Button>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default ReservationCard;