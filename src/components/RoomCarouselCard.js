import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Flex,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { FaQuestionCircle } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import iconMap from '../utils/iconMap';

const RoomCarouselCard = ({
  roomInfo,
  price,
  stock,
  numDays,
  activeAmenities,
  photos,
  onSelect,
  // latitude, // 좌표 prop 추가 (미래 사용 대비)
  // longitude, // 좌표 prop 추가 (미래 사용 대비)
}) => {
  const defaultPhoto = '/assets/default-room1.jpg';
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const photoUrls =
    Array.isArray(photos) && photos.length > 0
      ? photos
          .map((photo) => photo?.photoUrl)
          .filter((url) => typeof url === 'string')
      : [defaultPhoto];

  const formattedPrice = typeof price === 'number' ? price : 0;
  const formattedStock = typeof stock === 'number' ? stock : 0;
  const formattedNumDays = typeof numDays === 'number' ? numDays : 0;

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    adaptiveHeight: true,
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    dotsClass: 'slick-dots custom-dots',
    customPaging: (i) => (
      <Box
        w="8px"
        h="8px"
        bg={currentIndex === i ? 'white' : 'gray.300'}
        borderRadius="full"
        mx={1}
        transition="background-color 0.3s"
        opacity={0.8}
      />
    ),
    afterChange: (index) => setCurrentIndex(index),
  };

  console.log(`[RoomCarouselCard] Photos for room ${roomInfo}:`, photos);
  console.log(`[RoomCarouselCard] Photo URLs for room ${roomInfo}:`, photoUrls);

  const handleImageLoad = () => {
    if (!isFirstImageLoaded) {
      console.log(
        `[RoomCarouselCard] Successfully loaded first image for room ${roomInfo}`
      );
      setIsLoading(false);
      setIsFirstImageLoaded(true);
    }
  };

  const handleImageError = (e) => {
    e.target.src = defaultPhoto;
    console.error(
      `[RoomCarouselCard] Failed to load image for room ${roomInfo}: ${e.target.src}`
    );
    if (!isFirstImageLoaded) {
      setIsLoading(false);
      setIsFirstImageLoaded(true);
    }
  };

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
      <Box position="relative" h="200px" w="100%" overflow="hidden">
        {isLoading && (
          <Flex justify="center" align="center" h="200px" w="100%">
            <Spinner size="md" color="teal.500" />
          </Flex>
        )}
        <Slider {...sliderSettings}>
          {photoUrls.map((photoUrl, idx) => (
            <Box key={idx}>
              <Image
                src={photoUrl}
                alt={`${roomInfo} - ${idx + 1}`}
                h="200px"
                w="100%"
                objectFit="cover"
                loading="lazy"
                onError={handleImageError}
                onLoad={handleImageLoad}
                boxShadow="sm"
                display={isLoading && idx !== 0 ? 'none' : 'block'}
              />
            </Box>
          ))}
        </Slider>
      </Box>
      <Box p={5}>
        <Text fontSize="xl" fontWeight="semibold" color="gray.800" mb={3}>
          {roomInfo}
        </Text>
        <Flex align="center" mb={2}>
          <Text fontSize="sm" color="gray.700" fontWeight="medium">
            가격:
          </Text>
          <Text fontSize="sm" color="gray.600" ml={2}>
            {formattedPrice.toLocaleString()}원 / 박
          </Text>
        </Flex>
        {formattedNumDays > 0 && (
          <Flex align="center" mb={2}>
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              총 가격:
            </Text>
            <Text fontSize="sm" color="gray.600" ml={2}>
              {(formattedPrice * formattedNumDays).toLocaleString()}원 (
              {formattedNumDays}박)
            </Text>
          </Flex>
        )}
        {stock !== undefined && (
          <Flex align="center" mb={3}>
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              잔여 객실:
            </Text>
            <Text
              fontSize="sm"
              color={formattedStock > 0 ? 'teal.500' : 'orange.500'}
              ml={2}
            >
              {formattedStock}개
            </Text>
          </Flex>
        )}
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
            onClick={onSelect}
            px={5}
            py={2}
            fontSize="sm"
            fontWeight="medium"
            borderRadius="md"
            transition="all 0.3s ease"
            isDisabled={formattedStock === 0}
            bg={formattedStock === 0 ? 'gray.300' : 'blue.400'}
            _hover={
              formattedStock === 0
                ? { bg: 'gray.300' }
                : { bg: 'blue.500', transform: 'scale(1.05)', boxShadow: 'md' }
            }
            _active={
              formattedStock === 0 ? { bg: 'gray.300' } : { bg: 'blue.600' }
            }
            cursor={formattedStock === 0 ? 'not-allowed' : 'pointer'}
          >
            선택하기
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default RoomCarouselCard;