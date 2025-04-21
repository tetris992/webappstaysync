//webapp/src/components/RoomCard.js

import React from 'react';
import { Box, Image, Text, Button, Flex, HStack } from '@chakra-ui/react';
import { FaQuestionCircle } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import iconMap from '../utils/iconMap';

const RoomCard = ({ room, onSelect }) => {
  // 슬라이드 설정
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    adaptiveHeight: true,
  };

  // 사진 배열 (S3에서 가져온 사진 또는 디폴트 사진)
  const photos =
    room.photos && room.photos.length > 0
      ? room.photos
      : [{ photoUrl: '/assets/default-room1.jpg' }];

  // room 객체에서 필요한 데이터 추출 (좌표는 prop으로 추가되지만 여기서는 사용 안 함)
  const {
    roomInfo,
    price,
    availableRooms,
    stock,
    activeAmenities,
    // latitude, // 좌표 prop 추가 (미래 사용 대비)
    // longitude, // 좌표 prop 추가 (미래 사용 대비)
  } = room || {};

  return (
    <Box
      borderWidth="0"
      borderRadius="xl"
      overflow="hidden"
      shadow="sm"
      bg="white"
      transition="all 0.4s ease"
      _hover={{ shadow: 'xl', transform: 'translateY(-8px)' }}
    >
      {/* 슬라이드 컴포넌트 */}
      <Slider {...sliderSettings}>
        {photos.map((photo, idx) => (
          <Box key={idx}>
            <Image
              src={photo.photoUrl}
              alt={`${roomInfo} - ${idx + 1}`}
              h="200px"
              w="100%"
              objectFit="cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/assets/default-room1.jpg';
                console.error(`Failed to load image: ${photo.photoUrl}`);
              }}
              boxShadow="sm"
            />
          </Box>
        ))}
      </Slider>
      <Box p={5}>
        <Text fontSize="xl" fontWeight="semibold" color="gray.800" mb={3}>
          {roomInfo}
        </Text>
        <Flex align="center" mb={2}>
          <Text fontSize="sm" color="gray.700" fontWeight="medium">
            가격:
          </Text>
          <Text fontSize="sm" color="gray.600" ml={2}>
            {price.toLocaleString()}원 / 박
          </Text>
        </Flex>
        <Flex align="center" mb={3}>
          <Text fontSize="sm" color="gray.700" fontWeight="medium">
            재고:
          </Text>
          <Text fontSize="sm" color="gray.600" ml={2}>
            {availableRooms || stock}개
          </Text>
        </Flex>
        <Flex justify="space-between" align="center">
          {activeAmenities && activeAmenities.length > 0 ? (
            <HStack spacing={3}>
              {activeAmenities.slice(0, 3).map((amenity, idx) => {
                const IconComponent = iconMap[amenity.icon] || FaQuestionCircle;
                return (
                  <Box key={idx} title={amenity.nameKor}>
                    <IconComponent color="teal.500" boxSize={4} />
                  </Box>
                );
              })}
              {activeAmenities.length > 3 && (
                <Text fontSize="sm" color="gray.500">
                  +{activeAmenities.length - 3}
                </Text>
              )}
            </HStack>
          ) : (
            <Box flex="1" />
          )}
          <Button
            colorScheme="blue"
            size="md"
            onClick={() => onSelect(room)}
            px={5}
            py={2}
            fontSize="sm"
            fontWeight="medium"
            borderRadius="md"
            transition="all 0.3s ease"
            _hover={{
              bg: 'teal.600',
              transform: 'scale(1.05)',
              boxShadow: 'md',
            }}
          >
            선택하기
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default RoomCard;
