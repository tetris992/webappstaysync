// webApp/src/components/HotelCard.js

import React from 'react';
import {
  Box,
  Image,
  Text,
  VStack,
  Divider,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';

const HotelCard = ({ hotel, onSelect }) => {
  const toast = useToast();
  const defaultPhoto = '/assets/default-hotel.jpg';

  // 다크 모드 대응 배경색
  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg={cardBg}
      cursor="pointer"
      onClick={onSelect}
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
    >
      <VStack align="stretch" spacing={3}>
        {/* 상단 이미지 */}
        <Image
          src={defaultPhoto}
          alt={hotel.hotelName}
          h="150px"
          w="100%"
          objectFit="cover"
          borderRadius="md"
          onError={() => {
            toast({
              title: '이미지 로드 실패',
              description: '호텔 이미지를 불러오지 못했습니다.',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          }}
        />

        {/* 호텔 정보 영역 */}
        <Box p={4}>
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" fontSize="lg" color="gray.800">
              {hotel.hotelName}{' '}
              <Text as="span" fontSize="sm" color="gray.500">
                ({hotel.hotelId})
              </Text>
            </Text>

            <Divider />

            <Text fontSize="sm" color="gray.600">
              전화번호: {hotel.phoneNumber || '정보 없음'}
            </Text>
            <Text fontSize="sm" color="gray.600">
              위치: {hotel.address || '주소 정보 없음'}
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default HotelCard;