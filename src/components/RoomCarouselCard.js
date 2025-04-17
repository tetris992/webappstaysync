// src/components/RoomCarouselCard.js (전체 코드 수정)
import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Flex,
  HStack,
  Spinner,
  Badge,
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
  hotelSettings,
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
  const discount = hotelSettings?.specialPrice?.discountRate || 0;
  const originalPrice = formattedPrice;
  const discountedPrice =
    discount > 0
      ? Math.round(originalPrice * (1 - discount / 100))
      : originalPrice;
  const totalPrice =
    formattedNumDays > 0 ? discountedPrice * formattedNumDays : discountedPrice;

  const eventName = hotelSettings?.eventName || null;
  const badgeLabel = eventName ? eventName : null;

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

  const handleImageLoad = () => {
    if (!isFirstImageLoaded) {
      setIsLoading(false);
      setIsFirstImageLoaded(true);
    }
  };

  const handleImageError = (e) => {
    e.target.src = defaultPhoto;
    if (!isFirstImageLoaded) {
      setIsLoading(false);
      setIsFirstImageLoaded(true);
    }
  };

  return (
    <Box
      variant="card"
      borderRadius="lg"
      mb={4}
      position="relative"
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      shadow="sm"
      transition="all 0.3s ease"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      p={4}
      display="flex"
      alignItems="center"
    >
      {/* 왼쪽 사진 */}
      <Box
        position="relative"
        h="200px"
        w="150px"
        mr={4}
        overflow="hidden"
        borderRadius="lg"
        flexShrink={0}
      >
        {isLoading && (
          <Flex justify="center" align="center" h="100%" w="100%">
            <Spinner size="md" color="brand.500" />
          </Flex>
        )}
        <Slider {...sliderSettings}>
          {photoUrls.map((photoUrl, idx) => (
            <Box key={idx}>
              <Image
                src={photoUrl}
                alt={`${roomInfo} - ${idx + 1}`}
                h="200px"
                w="150px"
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

      {/* 오른쪽 내용 */}
      <Box flex="1">
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            {roomInfo}
          </Text>
          {badgeLabel && (
            <Badge
              border="1px solid"
              borderColor="red.500"
              color="red.500"
              fontSize="sm"
              fontWeight="medium"
              px={3}
              py={1}
              borderRadius="md"
              bg="white"
            >
              {badgeLabel}
            </Badge>
          )}
        </Flex>
        <Flex justify="space-between" align="center" mb={1}>
          <Text fontSize="sm" color="gray.700" fontWeight="medium">
            대실 3시간
          </Text>
          <Text fontSize="sm" color="gray.700" fontWeight="medium">
            숙박 {hotelSettings?.checkInTime || '17:00'} 체크인
          </Text>
        </Flex>
        <Flex justify="space-between" align="center" mb={1}>
          <Box>
            {discount > 0 && (
              <Text
                fontSize="xs"
                color="gray.600"
                fontWeight="normal"
                textDecor="line-through"
              >
                {originalPrice.toLocaleString()}원
              </Text>
            )}
            <Text
              fontSize="md"
              color={discount > 0 ? 'red.500' : 'gray.700'}
              fontWeight="bold"
            >
              {discount > 0
                ? discountedPrice.toLocaleString()
                : originalPrice.toLocaleString()}
              원
            </Text>
            {discount > 0 && (
              <Text fontSize="xs" color="red.500" fontWeight="medium">
                {discount}% 할인 적용
              </Text>
            )}
          </Box>
          <Text fontSize="sm" color="red.500" fontWeight="medium">
            {formattedStock > 0 ? `남은 객실 ${formattedStock}개` : '객실 마감'}
          </Text>
        </Flex>
        {numDays > 0 && (
          <Text fontSize="sm" color="gray.700" fontWeight="medium" mb={1}>
            총액 ({numDays}박): {totalPrice.toLocaleString()}원
          </Text>
        )}
        {discount > 0 && (
          <Text fontSize="xs" color="red.500" fontWeight="medium" mb={2}>
            이 가격으로 남은 객실 {formattedStock}개
          </Text>
        )}
        <Flex justify="space-between" align="center">
          {activeAmenities && activeAmenities.length > 0 ? (
            <HStack spacing={2}>
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
            variant="solid"
            size="md"
            onClick={onSelect}
            px={5}
            py={2}
            fontSize="sm"
            fontWeight="medium"
            isDisabled={formattedStock === 0}
          >
            선택하기
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default RoomCarouselCard;
