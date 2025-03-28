import React from 'react';
import { Box, Image, Text, Button } from '@chakra-ui/react';

const RoomCard = ({ room, onSelect }) => (
  <Box
    borderWidth="1px"
    borderRadius="lg"
    overflow="hidden"
    shadow="md"
    bg="white"
  >
    <Image src={room.photos[0]} alt={room.roomInfo} h="150px" w="100%" objectFit="cover" />
    <Box p={4}>
      <Text fontSize="lg" fontWeight="bold">{room.roomInfo}</Text>
      <Text>{room.price.toLocaleString()}원 / 박</Text>
      <Button mt={2} colorScheme="blue" size="sm" onClick={() => onSelect(room)}>
        선택하기
      </Button>
    </Box>
  </Box>
);

export default RoomCard;