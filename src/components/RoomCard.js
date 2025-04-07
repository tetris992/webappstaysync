import React from 'react';
import { Box, Image, Text, Button } from '@chakra-ui/react';

const RoomCard = ({ room, onSelect }) => {
  const defaultPhoto = '/assets/default-room1.jpg';
  const displayPhoto =
    room.photos && room.photos.length > 0
      ? room.photos[0].photoUrl
      : defaultPhoto; // S3 사진이 없으면 디폴트 사진 사용

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg="white"
    >
      <Image
        src={displayPhoto}
        alt={room.roomInfo}
        h="150px"
        w="100%"
        objectFit="cover"
        onError={() => console.error(`Failed to load image: ${displayPhoto}`)}
      />
      <Box p={4}>
        <Text fontSize="lg" fontWeight="bold">{room.roomInfo}</Text>
        <Text>{room.price.toLocaleString()}원 / 박</Text>
        <Button mt={2} colorScheme="blue" size="sm" onClick={() => onSelect(room)}>
          선택하기
        </Button>
      </Box>
    </Box>
  );
};

export default RoomCard;