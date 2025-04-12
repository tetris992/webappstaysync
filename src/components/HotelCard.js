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
import {
  FaRegStar,
  FaStar,
  FaQuestionCircle,
  FaMapMarkerAlt,
  FaMapSigns,
  FaCopy,
} from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useToast } from '@chakra-ui/react';
import iconMap from '../utils/iconMap';
import Map from './Map';

const HotelCard = ({ hotel, isFavorite, toggleFavorite, onSelect }) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const toast = useToast();

  console.log('[HotelCard] Hotel data received:', {
    hotelId: hotel.hotelId,
    hotelName: hotel.hotelName,
    address: hotel.address,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
  });

  const handleAddressClick = () => {
    console.log('[HotelCard] Address clicked, checking coordinates:', {
      address: hotel.address,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
    });

    if (hotel.latitude && hotel.longitude) {
      // 좌표가 있는 경우 T맵 자동 실행
      handleTMapNavigation();
    } else {
      // 좌표가 없는 경우 주소 복사만 가능
      toast({
        title: '위치 정보 없음',
        description:
          '호텔 좌표 정보를 찾을 수 없습니다. 주소를 복사할 수 있습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTMapNavigation = () => {
    if (!hotel.latitude || !hotel.longitude) {
      // 좌표가 없으면 지도 모달 표시
      setIsMapOpen(true);
      return;
    }

    const tmapUrl = `tmap://route?goalx=${hotel.longitude}&goaly=${
      hotel.latitude
    }&name=${encodeURIComponent(hotel.hotelName || '호텔')}`;
    console.log('[HotelCard] TMap URL:', tmapUrl);
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid || isIOS) {
        // T맵이 설치되지 않은 경우 지도 모달 표시
        setIsMapOpen(true);
      } else {
        toast({
          title: 'T맵 설치 필요',
          description:
            'T맵 앱이 설치되어 있지 않습니다. 기본 지도를 표시합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        setIsMapOpen(true);
      }
    }, 2000);
  };

  const handleCopyAddress = () => {
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
        <Slider {...sliderSettings}>
          {photos.map((photo, idx) => (
            <Box key={idx}>
              <Image
                src={photo.photoUrl}
                alt={`${hotel.hotelName} - ${idx + 1}`}
                h="150px"
                w="100%"
                objectFit="cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/assets/default-hotel.jpg';
                }}
                boxShadow="sm"
              />
            </Box>
          ))}
        </Slider>
        <Box p={5}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text
              fontSize="xl"
              fontWeight="semibold"
              color="gray.800"
              isTruncated
            >
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
                  as={i < Math.floor(hotel.rating || 0) ? FaStar : FaRegStar}
                  color={
                    i < Math.floor(hotel.rating || 0)
                      ? 'yellow.400'
                      : 'gray.300'
                  }
                  boxSize={3.5}
                />
              ))}
            </HStack>
            <Text fontSize="sm" color="gray.700" ml={2}>
              {(hotel.rating || 0).toFixed(1)} ({hotel.reviewCount || 0} 리뷰)
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
          <Flex align="center" mb={3} wrap="wrap">
            <Icon
              as={FaMapMarkerAlt}
              color="teal.500"
              boxSize={4}
              mr={2}
              flexShrink={0}
              alignSelf="flex-start"
              mt={1}
            />
            <Button
              variant="link"
              color="teal.600"
              onClick={handleAddressClick}
              textAlign="left"
              fontSize="sm"
              p={0}
              _hover={{ color: 'teal.800', textDecoration: 'underline' }}
              flex="1"
              whiteSpace="normal" // 2줄까지 허용
              overflow="visible"
              textOverflow="clip"
              lineHeight="normal"
              maxH="2.8em" // 2줄 높이 제한
              display="-webkit-box"
              wbkitLineClamp={2} // 2줄까지만 표시
              webkitBoxOrient="vertical"
            >
              위치: {hotel.address || '주소 정보 없음'}
            </Button>
            <Flex align="center" ml={2} flexShrink={0}>
              <Button
                variant="link"
                color="gray.600"
                onClick={handleCopyAddress}
                fontSize="sm"
                p={0}
                _hover={{ color: 'gray.800', textDecoration: 'underline' }}
                display="flex"
                alignItems="center"
              >
                <Icon as={FaCopy} color="gray.500" boxSize={4} />
              </Button>
            </Flex>
          </Flex>
          <Flex justify="space-between" align="center">
            {hotel.amenities && hotel.amenities.length > 0 ? (
              <HStack spacing={3}>
                {hotel.amenities.slice(0, 3).map((amenity, idx) => {
                  const IconComponent =
                    iconMap[amenity.icon] || FaQuestionCircle;
                  return (
                    <Box key={idx} title={amenity.nameKor}>
                      <Icon as={IconComponent} color="teal.500" w={4} h={4} />
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
              px={4}
              py={0.5}
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
              선택
            </Button>
          </Flex>
        </Box>
      </Box>

      {/* 지도 모달 (T맵 설치되지 않은 경우 표시) */}
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
              주소: {hotel.address || '주소 정보 없음'}
            </Text>
            <Box h="400px" w="100%">
              {hotel.latitude && hotel.longitude ? (
                <Map
                  address={hotel.address}
                  latitude={hotel.latitude}
                  longitude={hotel.longitude}
                  onCoordinatesChange={() => {}}
                />
              ) : (
                <Text color="red.500">지도 데이터를 로드할 수 없습니다.</Text>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button
                variant="outline"
                color="teal.600"
                leftIcon={<FaMapSigns />}
                onClick={handleTMapNavigation}
              >
                T맵으로 길찾기
              </Button>
              <Button
                variant="outline"
                color="gray.600"
                leftIcon={<FaCopy />}
                onClick={handleCopyAddress}
              />
              <Button colorScheme="gray" onClick={() => setIsMapOpen(false)}>
                닫기
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default HotelCard;
