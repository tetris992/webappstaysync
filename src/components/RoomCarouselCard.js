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
  Icon,
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
  availableCoupons,
  onViewCoupons,
  hotelSettings,
  hotelId, // Ensure hotelId is passed as a prop
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
  const totalFixedDiscount =
    (hotelSettings?.specialPrice?.totalFixedDiscount || 0) +
    (hotelSettings?.specialPrice?.couponTotalFixedDiscount || 0);
  const originalPrice = formattedPrice;
  let discountedPrice = originalPrice;

  // 이벤트 할인 적용
  if (hotelSettings?.specialPrice?.discountType === 'fixed' && hotelSettings?.specialPrice?.totalFixedDiscount > 0) {
    discountedPrice = Math.max(0, discountedPrice - hotelSettings.specialPrice.totalFixedDiscount);
  } else if (hotelSettings?.specialPrice?.discountRate > 0) {
    discountedPrice = Math.round(discountedPrice * (1 - hotelSettings.specialPrice.discountRate / 100));
  }

  // 쿠폰 할인 적용
  if (hotelSettings?.specialPrice?.couponDiscount > 0) {
    discountedPrice = Math.round(discountedPrice * (1 - hotelSettings.specialPrice.couponDiscount / 100));
  } else if (hotelSettings?.specialPrice?.couponTotalFixedDiscount > 0) {
    discountedPrice = Math.max(0, discountedPrice - hotelSettings.specialPrice.couponTotalFixedDiscount);
  }

  const totalPrice =
    formattedNumDays > 0 ? discountedPrice * formattedNumDays : discountedPrice;

  const eventName = hotelSettings?.eventName || null;
  const badgeLabel = eventName ? eventName : null;
  const discountInfo = hotelSettings?.discountInfo || null;
  const couponDiscountInfo = hotelSettings?.couponDiscountInfo || null;
  const selectedCoupon = hotelSettings?.selectedCoupon || null;

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

  const handleSelect = () => {
    // Ensure all necessary data is passed to ReservationConfirmation.js
    const reservationData = {
      hotelId, // Explicitly pass hotelId
      roomInfo,
      price: formattedPrice,
      originalPrice,
      discount: hotelSettings?.specialPrice?.discountRate || 0,
      fixedDiscount: hotelSettings?.specialPrice?.totalFixedDiscount || 0,
      totalFixedDiscount: hotelSettings?.specialPrice?.totalFixedDiscount || 0,
      discountType: hotelSettings?.specialPrice?.discountType || null,
      eventName: hotelSettings?.eventName || null,
      eventUuid: hotelSettings?.eventUuid || null,
      couponDiscount: hotelSettings?.specialPrice?.couponDiscount || 0,
      couponFixedDiscount: hotelSettings?.specialPrice?.couponFixedDiscount || 0,
      couponTotalFixedDiscount: hotelSettings?.specialPrice?.couponTotalFixedDiscount || 0,
      couponCode: selectedCoupon?.code || null,
      couponUuid: selectedCoupon?.couponUuid || null,
      numNights: formattedNumDays, // Ensure numNights is passed for coupon calculations
    };

    console.log('[RoomCarouselCard] Passing data to ReservationConfirmation:', reservationData);
    onSelect(reservationData);
  };

  return (
    <Box
      variant="card"
      borderRadius="lg"
      mb={2}
      position="relative"
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      shadow="sm"
      transition="all 0.3s ease"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      p={2}
      w="100%"
      display="flex"
      alignItems="center"
    >
      <Box
        position="relative"
        h="200px"
        w={{ base: '120px', md: '150px' }}
        mr={2}
        overflow="hidden"
        borderRadius="lg"
        flexShrink={0}
        onClick={handleSelect}
        cursor="pointer"
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

      <Box flex="1">
        <Flex justify="space-between" align="center" mb={1}>
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="bold"
            color="gray.800"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxWidth="70%"
          >
            {roomInfo}
          </Text>
          {badgeLabel && (
            <Badge
              border="1px solid"
              borderColor="green.500"
              color="green.500"
              fontSize={{ base: '10px', md: 'xs' }}
              fontWeight="medium"
              px={1.5}
              py={0.5}
              borderRadius="md"
              bg="white.50"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              maxWidth="50%"
              ml={1}
            >
              {badgeLabel}
            </Badge>
          )}
        </Flex>
        <Flex justify="space-between" align="center" mb={1}>
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            color="gray.700"
            fontWeight="medium"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxWidth="50%"
          >
            대실 3시간
          </Text>
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            color="gray.700"
            fontWeight="medium"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxWidth="50%"
          >
            숙박 {hotelSettings?.checkInTime || '17:00'} 체크인
          </Text>
        </Flex>
        <Flex justify="space-between" align="center" mb={1}>
          <Box>
            {totalFixedDiscount > 0 || hotelSettings?.specialPrice?.discountRate > 0 || hotelSettings?.specialPrice?.couponDiscount > 0 ? (
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                color="gray.600"
                fontWeight="normal"
                textDecor="line-through"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {originalPrice.toLocaleString()}원
              </Text>
            ) : null}
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color={totalFixedDiscount > 0 || hotelSettings?.specialPrice?.discountRate > 0 || hotelSettings?.specialPrice?.couponDiscount > 0 ? 'red.500' : 'gray.700'}
              fontWeight="bold"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {discountedPrice.toLocaleString()}원
            </Text>
            {discountInfo && (
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                color="red.500"
                fontWeight="medium"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {discountInfo}
              </Text>
            )}
            {couponDiscountInfo && (
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                color="red.500"
                fontWeight="medium"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {couponDiscountInfo}
              </Text>
            )}
            {/* 총액 표시를 금액 아래로 이동 */}
            {formattedNumDays > 0 && (
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                color="gray.700"
                fontWeight="medium"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                총액 ({formattedNumDays}박): {totalPrice.toLocaleString()}원
              </Text>
            )}
          </Box>
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            color="red.500"
            fontWeight="medium"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            maxWidth="50%"
          >
            {formattedStock > 0 ? `남은 객실 ${formattedStock}개` : '객실 마감'}
          </Text>
        </Flex>
        <Flex justify="space-between" align="center" mb={1}>
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            color="blue.500"
            fontWeight="medium"
            onClick={onViewCoupons}
            cursor="pointer"
          >
            적용 가능한 쿠폰: {availableCoupons}개
          </Text>
          {selectedCoupon && (
            <Text
              fontSize={{ base: 'xs', md: 'sm' }}
              color="gray.600"
              fontWeight="medium"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              적용 쿠폰: {selectedCoupon.name}
            </Text>
          )}
        </Flex>
        <Flex justify="space-between" align="center">
          {activeAmenities && activeAmenities.length > 0 ? (
            <HStack spacing={1}>
              {activeAmenities.slice(0, 3).map((amenity, idx) => {
                const IconComponent = iconMap[amenity.icon] || FaQuestionCircle;
                return (
                  <Box key={idx} title={amenity.nameKor}>
                    <Icon as={IconComponent} color="teal.500" boxSize={3} />
                  </Box>
                );
              })}
              {activeAmenities.length > 3 && (
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
                  +{activeAmenities.length - 3}
                </Text>
              )}
            </HStack>
          ) : (
            <Box flex="1" />
          )}
          <Button
            variant="solid"
            size="sm"
            onClick={handleSelect}
            px={4}
            py={1}
            fontSize={{ base: 'xs', md: 'sm' }}
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