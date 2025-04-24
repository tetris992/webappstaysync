import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Flex,
  IconButton,
  HStack,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack, // Added import for VStack
  Badge,  // Added import for Badge
  useToast,
} from '@chakra-ui/react';
import {
  FaRegStar,
  FaStar,
  FaQuestionCircle,
  FaMapMarkerAlt,
  FaCopy,
  FaRoute,
} from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import iconMap from '../utils/iconMap';
import Map from './Map';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const HotelCard = ({
  hotel,
  isFavorite,
  toggleFavorite,
  onSelect,
  onViewCoupons,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const toast = useToast();

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

  const photos =
    hotel.photos && hotel.photos.length > 0
      ? hotel.photos
      : [{ photoUrl: '/assets/default-hotel.jpg' }];

  const handleCopyAddress = (e) => {
    e.stopPropagation();
    if (hotel.address) {
      navigator.clipboard
        .writeText(hotel.address)
        .then(() => {
          toast({
            title: '주소 복사 완료',
            description: '호텔 주소가 클립보드에 복사되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
          toast({
            title: '주소 복사 실패',
            description: `주소를 복사하는 데 실패했습니다: ${error.message}`,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  };

  const handleTMapNavigation = () => {
    if (!hotel.latitude || !hotel.longitude) {
      setIsMapOpen(true);
      return;
    }
    const tmapUrl = `tmap://route?goalx=${hotel.longitude}&goaly=${hotel.latitude}&name=${encodeURIComponent(hotel.hotelName)}`;
    window.location.href = tmapUrl;
    setTimeout(() => {
      setIsMapOpen(true);
    }, 2000);
  };

  return (
    <>
      <MotionBox
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        shadow="sm"
        _hover={{ shadow: 'lg' }}
      >
        <Slider {...sliderSettings}>
          {photos.map((photo) => (
            <Box key={photo.photoUrl} height="200px">
              <Image
                src={photo.photoUrl}
                alt={`${hotel.hotelName} - Photo`}
                height="100%"
                width="100%"
                objectFit="cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/assets/default-hotel.jpg';
                }}
              />
            </Box>
          ))}
        </Slider>

        <Box p={4}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="xl" fontWeight="semibold" noOfLines={1}>
              {hotel.hotelName || '호텔 이름 없음'}
            </Text>
            <IconButton
              icon={isFavorite ? <FaStar /> : <FaRegStar />}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              variant="ghost"
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
              color={isFavorite ? 'yellow.400' : 'gray.400'}
            />
          </Flex>

          <HStack spacing={1} mb={3}>
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                as={i < Math.floor(hotel.rating || 0) ? FaStar : FaRegStar}
                boxSize={4}
                color={i < Math.floor(hotel.rating || 0) ? 'yellow.400' : 'gray.300'}
              />
            ))}
            <Text fontSize="sm" color="gray.600" ml={2}>
              {(hotel.rating || 0).toFixed(1)} ({hotel.reviewCount || 0} 리뷰)
            </Text>
          </HStack>

          <VStack spacing={2} align="stretch" mb={3}>
            <Flex justify="space-between">
              <Text fontSize="sm" color="gray.600">
                체크인
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {hotel.checkInTime || 'N/A'}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="sm" color="gray.600">
                체크아웃
              </Text>
              <Text fontSize="sm" fontWeight="medium">
                {hotel.checkOutTime || 'N/A'}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="sm" color="gray.600">
                1박 요금
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="blue.600">
                {(hotel.price || 0).toLocaleString()}원
              </Text>
            </Flex>
            {hotel.availableCoupons > 0 && (
              <Flex justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  사용 가능 쿠폰
                </Text>
                <Badge colorScheme="green">{hotel.availableCoupons}개</Badge>
              </Flex>
            )}
          </VStack>

          <Box mb={3}>
            <Flex align="center" mb={2}>
              <Icon as={FaMapMarkerAlt} color="teal.500" mr={2} />
              <Text noOfLines={2} flex="1">
                {hotel.address || '주소 정보 없음'}
              </Text>
              <IconButton
                icon={<FaCopy />}
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                aria-label="주소 복사"
              />
            </Flex>
          </Box>

          <Flex justify="space-between" align="center">
            {hotel.amenities?.length > 0 ? (
              <HStack spacing={3}>
                {hotel.amenities.slice(0, 3).map((amenity, idx) => {
                  const IconComp = iconMap[amenity.icon] || FaQuestionCircle;
                  // Note: Using idx as key; replace with amenity.id or another unique identifier if available
                  return <Icon as={IconComp} key={idx} boxSize={4} />;
                })}
                {hotel.amenities.length > 3 && (
                  <Text>+{hotel.amenities.length - 3}</Text>
                )}
              </HStack>
            ) : (
              <Box flex="1" />
            )}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FaRoute />}
              onClick={handleTMapNavigation}
            >
              T맵
            </Button>
          </Flex>

          <Flex justify="space-between" mt={3}>
            {hotel.availableCoupons > 0 && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewCoupons();
                }}
              >
                쿠폰 보기
              </Button>
            )}
            <Button size="sm" colorScheme="teal" onClick={onSelect} flex="1" ml={2}>
              자세히 보기
            </Button>
          </Flex>
        </Box>
      </MotionBox>

      {/* 지도 모달 */}
      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>호텔 위치</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {hotel.latitude && hotel.longitude ? (
              <Map
                address={hotel.address}
                latitude={hotel.latitude}
                longitude={hotel.longitude}
              />
            ) : (
              <Text color="red.500">지도 데이터를 로드할 수 없습니다.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HotelCard;