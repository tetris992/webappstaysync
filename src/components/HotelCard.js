// webapp/src/components/HotelCard.js
import React from 'react';
import {
  Box,
  Image,
  Text,
  VStack,
  Divider,
  useColorModeValue,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';

const HotelCard = ({ hotel, onSelect, isFavorite, toggleFavorite }) => {
  const toast = useToast();
  const defaultPhoto = '/assets/default-hotel.jpg';
  const fallbackPhoto = 'https://via.placeholder.com/300x150?text=Hotel+Image';

  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg={cardBg}
      position="relative"
      cursor="pointer"
      onClick={onSelect} // onSelect prop 사용
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
    >
      <VStack align="stretch" spacing={3}>
        <Image
          src={defaultPhoto}
          alt={hotel.hotelName}
          h={{ base: '120px', md: '150px' }}
          w="100%"
          objectFit="cover"
          borderRadius="md"
          onError={(e) => {
            e.target.src = fallbackPhoto;
            toast({
              title: '이미지 로드 실패',
              description: '호텔 이미지를 불러오지 못했습니다. 대체 이미지를 표시합니다.',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          }}
        />
        <Box p={{ base: 3, md: 4 }}>
          <VStack align="start" spacing={2}>
            <Text
              fontWeight="bold"
              fontSize={{ base: 'md', md: 'lg' }}
              color="gray.800"
            >
              {hotel.hotelName}{' '}
              <Text as="span" fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
                ({hotel.hotelId})
              </Text>
            </Text>
            <Divider />
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">
              전화번호: {hotel.phoneNumber || '정보 없음'}
            </Text>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">
              위치: {hotel.address || '주소 정보 없음'}
            </Text>
          </VStack>
        </Box>
      </VStack>
      <IconButton
        icon={<StarIcon />}
        colorScheme={isFavorite ? 'yellow' : 'gray'}
        position="absolute"
        top="10px"
        right="10px"
        onClick={(e) => {
          e.stopPropagation(); // onSelect와 충돌 방지
          toggleFavorite();
        }}
        aria-label={isFavorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
      />
    </Box>
  );
};

export default HotelCard;