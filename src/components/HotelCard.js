import React from 'react';
import { Box, Image, Text, Button, Flex, IconButton } from '@chakra-ui/react';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HotelCard = ({ hotel, isFavorite, toggleFavorite, onSelect }) => {
  const navigate = useNavigate();

  const handleAddressClick = () => {
    // 지도 페이지로 이동, 호텔 정보를 state로 전달
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
            _focus={{
              boxShadow: 'none', // 포커스 시 생기는 외곽선 제거
              outline: 'none',
            }}
            _hover={{
              bg: 'transparent', // 호버 시 배경색 제거
            }}
            _active={{
              bg: 'transparent', // 클릭 시 배경색 제거
            }}
          />
        </Flex>
        <Text color="gray.600" mb={1}>
          전화번호: {hotel.phoneNumber || '전화번호 정보 없음'}
        </Text>
        <Text color="gray.600" mb={1}>
          이메일: {hotel.email || '이메일 정보 없음'}
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
        <Button colorScheme="teal" size="sm" onClick={onSelect} w="full">
          객실 선택
        </Button>
      </Box>
    </Box>
  );
};

export default HotelCard;
