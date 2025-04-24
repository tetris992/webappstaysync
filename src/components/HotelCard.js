import React from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Flex,
  IconButton,
  Icon,
  Badge,
  Collapse,
  AspectRatio,
  Divider,
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import {
  FaHeart,
  FaRegHeart,
  FaMapMarkerAlt,
  FaCopy,
  FaRoute,
} from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable'; // 스와이프 제스처 라이브러리
import Map from './Map'; // Map 컴포넌트 임포트

const HotelCard = ({
  hotel,
  isFavorite,
  toggleFavorite,
  onSelect,
  onViewCoupons,
  onOpenGallery,
  currentPhotoIndex,
  handlePrevPhoto,
  handleNextPhoto,
  photoCount,
  toggleMap,
  isMapVisible,
  handleCopyAddress,
  handleTMapNavigation,
  index,
  totalHotels,
}) => {
  // 스와이프 핸들러 설정
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      if (!isMapVisible) {
        toggleMap(hotel.hotelId);
      }
    },
    onSwipedDown: () => {
      if (isMapVisible) {
        toggleMap(hotel.hotelId);
      }
    },
    delta: 10, // 스와이프 감지 거리
    trackTouch: true,
    trackMouse: false,
  });

  return (
    <Box w="100%">
      {/* 사진 영역 */}
      <AspectRatio ratio={16 / 9}>
        <Box position="relative">
          <Image
            src={hotel.photos[currentPhotoIndex]?.photoUrl || '/assets/default-hotel.jpg'}
            alt={`${hotel.hotelName} 이미지`}
            objectFit="cover"
            onError={(e) => (e.target.src = '/assets/default-hotel.jpg')}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`[HotelCard] Image clicked for hotel ID: ${hotel.hotelId}`);
              onSelect(hotel.hotelId);
            }}
            cursor="pointer"
          />
          {photoCount > 1 && (
            <>
              <IconButton
                icon={<ChevronLeftIcon />}
                position="absolute"
                top="50%"
                left="12px"
                transform="translateY(-50%)"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto(hotel.hotelId);
                }}
                aria-label="이전 사진"
                bg="whiteAlpha.800"
                _hover={{ bg: 'white' }}
                size="sm"
                borderRadius="full"
              />
              <IconButton
                icon={<ChevronRightIcon />}
                position="absolute"
                top="50%"
                right="12px"
                transform="translateY(-50%)"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto(hotel.hotelId);
                }}
                aria-label="다음 사진"
                bg="whiteAlpha.800"
                _hover={{ bg: 'white' }}
                size="sm"
                borderRadius="full"
              />
              <Text
                position="absolute"
                bottom="8px"
                right="8px"
                bg="blackAlpha.600"
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="xs"
              >
                {currentPhotoIndex + 1}/{photoCount}
              </Text>
            </>
          )}
          <IconButton
            icon={isFavorite ? <FaHeart /> : <FaRegHeart />}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(hotel.hotelId);
            }}
            position="absolute"
            top="12px"
            right="12px"
            size="sm"
            bg="white"
            borderRadius="full"
            color={isFavorite ? 'red.400' : 'gray.400'}
            _hover={{ bg: 'gray.100' }}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
          />
        </Box>
      </AspectRatio>

      {/* 정보 영역 */}
      <Box px={4} py={4}>
        <Flex direction="column" gap={2}>
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={2}>
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color="gray.800"
                noOfLines={1}
              >
                {hotel.hotelName || '호텔 이름 없음'}
              </Text>
              {hotel.availableCoupons > 0 && (
                <Badge
                  colorScheme="blue"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewCoupons(hotel.hotelId);
                  }}
                  cursor="pointer"
                >
                  {hotel.availableCoupons}개 쿠폰
                </Badge>
              )}
            </Flex>
            <Flex align="center" gap={1}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                {hotel.rating?.toFixed(1) || '0.0'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({hotel.reviewCount || 0})
              </Text>
            </Flex>
          </Flex>

          <Flex align="center" gap={2}>
            <Icon as={FaMapMarkerAlt} color="gray.500" boxSize={4} />
            <Text
              fontSize="sm"
              color="gray.600"
              noOfLines={1}
              cursor="pointer"
              onClick={() => toggleMap(hotel.hotelId)}
              _hover={{
                color: 'blue.600',
                textDecoration: 'underline',
              }}
            >
              {hotel.address || '주소 정보 없음'}
            </Text>
            <IconButton
              icon={<FaCopy />}
              variant="ghost"
              size="sm"
              onClick={() => handleCopyAddress(hotel.address)}
              aria-label="주소 복사"
              color="gray.500"
            />
          </Flex>

          {/* 지도 슬라이드 영역 */}
          <Collapse
            in={isMapVisible}
            animateOpacity
            transition={{ enter: { duration: 0.5 }, exit: { duration: 0.5 } }}
          >
            <Box
              h="200px"
              w="100%"
              mt={2}
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
              {...swipeHandlers} // 스와이프 제스처 적용
            >
              {isMapVisible && hotel.latitude && hotel.longitude ? (
                <Map
                  address={hotel.address}
                  latitude={hotel.latitude}
                  longitude={hotel.longitude}
                />
              ) : (
                <Text color="red.500">지도 데이터를 로드할 수 없습니다.</Text>
              )}
            </Box>
          </Collapse>

          <Flex justify="space-between" align="center">
            <Text fontSize="md" fontWeight="bold" color="blue.600">
              ₩{(hotel.price || 0).toLocaleString()} / 박
            </Text>
          </Flex>

          <Flex justify="space-between" align="center" gap={2} mt={2}>
            <Button
              size="md"
              variant="outline"
              colorScheme="gray"
              borderRadius="full"
              flex="1"
              leftIcon={<FaRoute />}
              onClick={() => handleTMapNavigation(hotel)}
            >
              길찾기
            </Button>
            <Button
              size="md"
              colorScheme="blue"
              borderRadius="full"
              flex="2"
              onClick={() => onOpenGallery(hotel.photos)}
            >
              자세히 보기
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* 구분선 */}
      {index < totalHotels - 1 && (
        <Divider borderColor="gray.600" borderWidth="1px" />
      )}
    </Box>
  );
};

export default HotelCard;