// webapp/src/components/HotelCard.js
import React from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Flex,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { FaRegStar, FaStar, FaQuestionCircle } from 'react-icons/fa'; // 대체 아이콘 추가
import { useNavigate } from 'react-router-dom';
import iconMap from '../utils/iconMap';

const HotelCard = ({ hotel, isFavorite, toggleFavorite, onSelect }) => {
  const navigate = useNavigate();

  const handleAddressClick = () => {
    navigate('/map', {
      state: { hotelId: hotel.hotelId, address: hotel.address },
    });
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg="white"
    >
      <Image
        src={
          hotel.photos && hotel.photos.length > 0
            ? hotel.photos[0]
            : '/assets/default-room1.jpg'
        }
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
            icon={isFavorite ? <FaStar /> : <FaRegStar />}
            onClick={toggleFavorite}
            variant="unstyled"
            bg="transparent"
            aria-label={
              isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
            fontSize="20px"
            color={isFavorite ? 'yellow.400' : 'gray.400'}
            _focus={{ boxShadow: 'none', outline: 'none' }}
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
          />
        </Flex>
        <Text color="gray.600" mb={1}>
          전화번호: {hotel.phoneNumber || '전화번호 정보 없음'}
        </Text>
        <Text color="gray.600" mb={1}>
          이메일: {hotel.email || '이메일 정보 없음'}
        </Text>
        <Text color="gray.600" mb={1}>
          체크인: {hotel.checkInTime || 'N/A'} / 체크아웃:{' '}
          {hotel.checkOutTime || 'N/A'}
        </Text>
        <Button
          variant="link"
          color="gray.600"
          mb={2}
          onClick={handleAddressClick}
          textAlign="left"
          fontSize="sm"
          p={0}
          _hover={{ color: 'blue.500', textDecoration: 'underline' }}
        >
          위치: {hotel.address || '주소 정보 없음'}
        </Button>
        {hotel.amenities && hotel.amenities.length > 0 && (
          <HStack spacing={2} mb={2}>
            {hotel.amenities.map((amenity, idx) => {
              const IconComponent = iconMap[amenity.icon] || FaQuestionCircle; // 대체 아이콘 사용
              return (
                <Box key={idx} title={amenity.nameKor}>
                  <IconComponent color="teal.500" />
                </Box>
              );
            })}
          </HStack>
        )}
        <Button colorScheme="teal" size="sm" onClick={onSelect} w="full">
          객실 선택
        </Button>
      </Box>
    </Box>
  );
};

export default HotelCard;