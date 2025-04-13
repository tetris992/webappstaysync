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
import { format } from 'date-fns';
import { useToast } from '@chakra-ui/react';
import Map from './Map';

const ReservationCard = ({ reservation, onCancelReservation, isConfirmed }) => {
  const {
    _id,
    hotelName = '알 수 없음',
    hotelId = '',
    roomInfo = '정보 없음',
    checkIn,
    checkOut,
    numDays,
    price,
    paymentMethod = '현장결제',
    address,
    photoUrl,
    customerName,
    latitude,
    longitude,
    hotelPhoneNumber,
  } = reservation || {};

  const safePrice = typeof price === 'number' ? price : 0;
  const thumbnail = photoUrl || '../assets/default-room1.jpg';
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleCancelClick = () => {
    if (!isConfirmed && onCancelReservation && _id) {
      onCancelReservation(_id);
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
      w="100%"
      maxW={{ base: "100%", sm: "95%", md: "container.md" }}
      mx="auto"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={isConfirmed ? 'gray.50' : cardBg}
      shadow="md"
      p={4}
      transition="background-color 0.2s"
      _hover={{
        bg: isConfirmed ? 'gray.100' : 'gray.50'
      }}
    >
      <VStack align="stretch" spacing={3}>
        <Image
          src={thumbnail}
          alt="thumbnail"
          h={{ base: "180px", sm: "200px", md: "250px" }}
          w="100%"
          objectFit="cover"
          borderRadius="md"
        />
        <VStack align="start" spacing={2}>
          <Text fontWeight="bold" fontSize="lg">
            {hotelName} ({hotelId})
          </Text>
          <Divider />
          <Grid templateColumns="auto 1fr" gap={2} width="100%" pl={4}>
            <Text fontSize="sm" color="gray.600">예약 번호:</Text>
            <Text fontSize="sm">{`WEB-${_id.slice(-8)}`}</Text>

            <Text fontSize="sm" color="gray.600">예약자:</Text>
            <Text fontSize="sm">{customerName || '예약자 정보 없음'}</Text>

            <Text fontSize="sm" color="gray.600">객실:</Text>
            <Text fontSize="sm">{roomInfo}</Text>

            <Text fontSize="sm" color="gray.600">결제:</Text>
            <Text fontSize="sm">{paymentMethod}</Text>

            <Text fontSize="sm" color="gray.600">체크인:</Text>
            <Text fontSize="sm">
              {checkIn ? format(new Date(checkIn), 'yyyy-MM-dd HH:mm') : 'N/A'}
            </Text>

            <Text fontSize="sm" color="gray.600">체크아웃:</Text>
            <Text fontSize="sm">
              {checkOut ? format(new Date(checkOut), 'yyyy-MM-dd HH:mm') : 'N/A'}
            </Text>

            <Text fontSize="sm" color="gray.600">숙박 일수:</Text>
            <Text fontSize="sm">{numDays || 1}박</Text>

            <Text fontSize="sm" color="gray.600">총 가격:</Text>
            <Text fontSize="sm" fontWeight="semibold" color="blue.500">
              {safePrice.toLocaleString()}원
            </Text>
          </Grid>
        </VStack>
        <Divider />
        <VStack align="start" spacing={2} w="100%">
          {isConfirmed ? (
            <Text fontSize="md" color="green.500" fontWeight="semibold" w="100%" textAlign="center">
              예약이 확정되었습니다
            </Text>
          ) : (
            <>
              <Text fontSize="xs" color="gray.500">
                후불예약은 당일 14시 전까지 무료 취소 가능합니다.
              </Text>
              <Button
                size="sm"
                colorScheme="gray"
                onClick={handleCancelClick}
                w="100%"
                _hover={{ bg: 'gray.200', color: 'red.500' }}
              >
                예약 취소
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
                onClick={() => window.location.href = `tel:${hotelPhoneNumber.replace(/[^0-9]/g, '')}`}
                _hover={{ color: 'blue.800', textDecoration: 'underline' }}
              >
                {hotelPhoneNumber}
              </Text>
            </Flex>
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