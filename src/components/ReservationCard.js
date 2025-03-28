// webapp/src/components/ReservationCard.js

import React from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  VStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';

const ReservationCard = ({ reservation, onCancel }) => {
  const {
    _id,
    hotelName = '알 수 없음',
    hotelId = '',
    roomInfo = '정보 없음',
    checkIn,
    checkOut,
    price,
    reservationStatus,
    isCancelled,
    paymentMethod = '현장결제',
    address,
    phoneNumber,
    photoUrl,         // 호텔 또는 객실 사진 URL (없으면 기본 이미지 사용)
  } = reservation || {};

  // 가격이 숫자가 아니거나 없는 경우 방어
  const safePrice = typeof price === 'number' ? price : 0;

  // 이미지: photoUrl이 있으면 사용, 없으면 기본 이미지
  const thumbnail = photoUrl || '../assets/default-room1.jpg';

  // 다크 모드 대응 배경색
  const cardBg = useColorModeValue('white', 'gray.700');

  // 예약 취소 버튼 핸들러
  const handleCancelClick = () => {
    if (onCancel && !isCancelled) {
      onCancel(_id);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      w="100%"
      maxW="sm"          // 모바일 환경 고려하여 최대 너비 설정
      mx="auto"          // 가로 중앙 정렬
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      shadow="md"
      p={4}
    >
      <VStack align="stretch" spacing={3}>
        {/* 상단 이미지 */}
        <Image
          src={thumbnail}
          alt="thumbnail"
          h="150px"
          w="100%"
          objectFit="cover"
          borderRadius="md"
        />

        {/* 예약 정보 영역 */}
        <VStack align="start" spacing={2}>
          <Text fontWeight="bold" fontSize="lg">
            {hotelName} ({hotelId})
          </Text>

          <Divider />


          <Text fontSize="sm" color="gray.600">
            객실: {roomInfo}
          </Text>
          <Text fontSize="sm" color="gray.600">
            결제: {paymentMethod}
          </Text>
          <Text fontSize="sm" color="gray.600">
            체크인: {checkIn ? checkIn.slice(0, 10) : 'N/A'}
          </Text>
          <Text fontSize="sm" color="gray.600">
            체크아웃: {checkOut ? checkOut.slice(0, 10) : 'N/A'}
          </Text>
          <Text fontWeight="semibold" color="blue.500">
            {safePrice.toLocaleString()}원
          </Text>
        </VStack>

        <Divider />

        {/* 추가 정보 및 취소 버튼 */}
        <VStack align="start" spacing={2}>
          <Text fontSize="sm" color={isCancelled ? 'red.500' : 'green.600'}>
            상태: {isCancelled ? '취소됨' : reservationStatus || '확인필요'}
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

          {!isCancelled && (
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
