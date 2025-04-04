// webapp/src/components/RoomCarouselCard.js
import React from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  VStack,
  Flex,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import iconMap from '../utils/iconMap'; // 공용 iconMap 임포트

const roomPhotoMap = {
  standard: '/assets/default-room1.jpg',
  premium: '/assets/default-room2.jpg',
  deluxe: '/assets/default-room3.jpg',
  suite: '/assets/default-room4.jpg',
  family: '/assets/default-room5.jpg',
  double: '/assets/default-room6.jpg',
  twin: '/assets/default-room7.jpg',
  single: '/assets/default-room8.jpg',
};

// 활성화된 시설 아이콘 표시 컴포넌트
const AmenityIcons = ({ activeAmenities = [] }) => {
  if (!activeAmenities.length) return null;

  return (
    <Flex wrap="wrap" gap={2}>
      {activeAmenities.map((amenity, idx) => {
        const IconComponent = iconMap[amenity.icon];
        return IconComponent ? (
          <Tooltip key={idx} label={amenity.nameKor} placement="top" hasArrow>
            <Box>
              <Icon as={IconComponent} boxSize={5} color="teal.500" />
            </Box>
          </Tooltip>
        ) : null;
      })}
    </Flex>
  );
};

const RoomCarouselCard = ({
  roomInfo,
  price,
  stock,
  numDays,
  activeAmenities,
  onSelect,
}) => {
  if (stock <= 0) return null;

  const defaultPhoto =
    roomPhotoMap[roomInfo?.toLowerCase()] || '/assets/default-room1.jpg';
  const safePrice = typeof price === 'number' ? price : 0;
  const totalPrice = safePrice * (numDays || 1); // 총 가격 계산

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg="white"
    >
      <Image
        src={defaultPhoto}
        alt={roomInfo}
        h="150px"
        w="100%"
        objectFit="cover"
      />
      <Box p={4}>
        <VStack align="start" spacing={2}>
          <Text fontSize="lg" fontWeight="bold">
            {roomInfo || '정보 없음'}
          </Text>
          <Text>{safePrice.toLocaleString()}원 / 박</Text>
          <Text color="blue.500">
            총 가격: {totalPrice.toLocaleString()}원 ({numDays || 1}박)
          </Text>
          <Text color="gray.500">재고: {stock}개</Text>
          <AmenityIcons activeAmenities={activeAmenities} />
          <Button mt={2} colorScheme="blue" size="sm" onClick={onSelect}>
            이 객실 선택
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default RoomCarouselCard;
