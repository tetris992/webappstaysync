import React from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';

const HotelCard = ({ hotel, isFavorite, toggleFavorite, onSelect }) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg="white"
    >
      <Image
        src={hotel.photos && hotel.photos.length > 0 ? hotel.photos[0] : '/assets/default-room1.jpg'}
        alt={hotel.hotelName}
        h="150px"
        w="100%"
        objectFit="cover"
      />
      <Box p={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold">
            {hotel.hotelName || '호텔 이름 없음'}
          </Text>
          <IconButton
            icon={
              <StarIcon
                fill={isFavorite ? 'yellow.400' : 'none'}
                stroke={isFavorite ? 'yellow.400' : 'gray.400'}
                strokeWidth="2"
              />
            }
            onClick={toggleFavorite}
            variant="unstyled"
            bg="transparent"
            borderWidth="0"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            fontSize="20px"
          />
        </Flex>
        <Text color="gray.600" mb={1}>
          전화번호: {hotel.phoneNumber || '전화번호 정보 없음'}
        </Text>
        <Text color="gray.600" mb={1}>
          이메일: {hotel.email || '이메일 정보 없음'} {/* 이메일 추가 */}
        </Text>
        <Text color="gray.600" mb={2}>
          위치: {hotel.address || '주소 정보 없음'}
        </Text>
        <Button
          colorScheme="teal"
          size="sm"
          onClick={onSelect}
          w="full"
        >
          객실 선택
        </Button>
      </Box>
    </Box>
  );
};

export default HotelCard;