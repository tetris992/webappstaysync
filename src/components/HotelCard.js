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
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FaRegStar, FaStar, FaQuestionCircle, FaMapMarkerAlt, FaStar as FaStarFilled } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import iconMap from '../utils/iconMap';
import Map from './Map';

const HotelCard = ({ hotel, isFavorite, toggleFavorite, onSelect }) => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleAddressClick = () => {
    console.log('Address passed to Map:', hotel.address);
    setIsMapOpen(true);
  };

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
  const photos = hotel.photos && hotel.photos.length > 0 ? hotel.photos : [{ photoUrl: '/assets/default-room1.jpg' }];

  return (
    <>
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
                alt={`${hotel.hotelName} - ${idx + 1}`}
                h="200px"
                w="100%"
                objectFit="cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/assets/default-room1.jpg';
                }}
                boxShadow="sm"
              />
            </Box>
          ))}
        </Slider>
        <Box p={5}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="xl" fontWeight="semibold" color="gray.800" isTruncated>
              {hotel.hotelName || '호텔 이름 없음'}
            </Text>
            <IconButton
              icon={isFavorite ? <FaStar /> : <FaRegStar />}
              onClick={toggleFavorite}
              variant="unstyled"
              bg="transparent"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              fontSize="22px"
              color={isFavorite ? 'yellow.400' : 'gray.400'}
              _focus={{ boxShadow: 'none', outline: 'none' }}
              _hover={{ bg: 'transparent', transform: 'scale(1.1)' }}
              _active={{ bg: 'transparent' }}
              transition="all 0.3s ease"
            />
          </Flex>
          <Flex align="center" mb={3}>
            <HStack spacing={1}>
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  as={i < Math.floor(hotel.rating || 0) ? FaStarFilled : FaRegStar}
                  color={i < Math.floor(hotel.rating || 0) ? 'yellow.400' : 'gray.300'}
                  boxSize={3.5}
                />
              ))}
            </HStack>
            <Text fontSize="sm" color="gray.700" ml={2}>
              {hotel.rating || 0} ({hotel.reviewCount || 0} 리뷰)
            </Text>
          </Flex>
          <Flex align="center" mb={2}>
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              가격:
            </Text>
            <Text fontSize="sm" color="gray.600" ml={2}>
              {(hotel.price || 0).toLocaleString()}원 / 박
            </Text>
          </Flex>
          <Flex align="center" mb={2}>
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              전화번호:
            </Text>
            <Text fontSize="sm" color="gray.600" ml={2}>
              {hotel.phoneNumber || '전화번호 정보 없음'}
            </Text>
          </Flex>
          <Flex align="center" mb={2}>
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              이메일:
            </Text>
            <Text fontSize="sm" color="gray.600" ml={2}>
              {hotel.email || '이메일 정보 없음'}
            </Text>
          </Flex>
          <Flex align="center" mb={2}>
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              체크인:
            </Text>
            <Text fontSize="sm" color="gray.600" ml={2}>
              {hotel.checkInTime || 'N/A'}
            </Text>
            <Text fontSize="sm" color="gray.700" fontWeight="medium" ml={2}>
              체크아웃:
            </Text>
            <Text fontSize="sm" color="gray.600" ml={2}>
              {hotel.checkOutTime || 'N/A'}
            </Text>
          </Flex>
          <Flex align="center" mb={3}>
            <Icon as={FaMapMarkerAlt} color="teal.500" boxSize={4} mr={2} />
            <Button
              variant="link"
              color="teal.600"
              onClick={handleAddressClick}
              textAlign="left"
              fontSize="sm"
              p={0}
              _hover={{ color: 'teal.800', textDecoration: 'underline' }}
            >
              위치: {hotel.address || '주소 정보 없음'}
            </Button>
          </Flex>
          <Flex justify="space-between" align="center">
            {hotel.amenities && hotel.amenities.length > 0 ? (
              <HStack spacing={3}>
                {hotel.amenities.slice(0, 3).map((amenity, idx) => {
                  const IconComponent = iconMap[amenity.icon] || FaQuestionCircle;
                  return (
                    <Box key={idx} title={amenity.nameKor}>
                      <IconComponent color="teal.500" boxSize={4} />
                    </Box>
                  );
                })}
                {hotel.amenities.length > 3 && (
                  <Text fontSize="sm" color="gray.500">
                    +{hotel.amenities.length - 3}
                  </Text>
                )}
              </HStack>
            ) : (
              <Box flex="1" />
            )}
            <Button
              colorScheme="teal"
              size="md"
              onClick={onSelect}
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
              객실 선택
            </Button>
          </Flex>
        </Box>
      </Box>

      {/* Modal for Map Display */}
      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>호텔 위치</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="md" color="gray.600" mb={2}>
              호텔 ID: {hotel.hotelId}
            </Text>
            <Text fontSize="md" color="gray.600" mb={4}>
              주소: {hotel.address}
            </Text>
            <Box h="400px" w="100%">
              <Map address={hotel.address} />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" onClick={() => setIsMapOpen(false)}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HotelCard;