// src/components/RoomCarouselCard.js
import React, { useState, useEffect } from 'react';
import { Box, Image, Text, Button, Flex, IconButton, HStack, Tooltip, Spinner } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import iconMap from '../utils/iconMap';

const MotionBox = motion(Box);

const RoomCarouselCard = ({ roomInfo, price, stock, numDays, activeAmenities, photos, onSelect }) => {
  const defaultPhoto = '/assets/default-room1.jpg';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 사진 데이터 방어 처리
  const photoUrls = Array.isArray(photos) && photos.length > 0
    ? photos.map(photo => photo?.photoUrl).filter(url => typeof url === 'string')
    : [defaultPhoto];

  // 가격 및 재고 데이터 방어 처리
  const formattedPrice = typeof price === 'number' ? price : 0;
  const formattedStock = typeof stock === 'number' ? stock : 0;
  const formattedNumDays = typeof numDays === 'number' ? numDays : 0;

  // 슬라이드 이동 핸들러
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? photoUrls.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === photoUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 스와이프 제스처 핸들러
  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: true,
  });

  // 자동 슬라이드 기능
  useEffect(() => {
    if (photoUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === photoUrls.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // 5초 간격
      return () => clearInterval(interval);
    }
  }, [photoUrls.length]);

  console.log(`[RoomCarouselCard] Photos for room ${roomInfo}:`, photos);
  console.log(`[RoomCarouselCard] Photo URLs for room ${roomInfo}:`, photoUrls);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg="white"
      position="relative"
    >
      {/* 슬라이드 이미지 영역 */}
      <Box position="relative" h="150px" w="100%" overflow="hidden">
        {photoUrls.length > 1 && (
          <>
            <IconButton
              icon={<ChevronLeftIcon />}
              position="absolute"
              left="5px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              bg="gray.200"
              opacity={0.7}
              _hover={{ opacity: 1 }}
              onClick={handlePrev}
              aria-label="Previous photo"
              size="sm"
            />
            <IconButton
              icon={<ChevronRightIcon />}
              position="absolute"
              right="5px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              bg="gray.200"
              opacity={0.7}
              _hover={{ opacity: 1 }}
              onClick={handleNext}
              aria-label="Next photo"
              size="sm"
            />
          </>
        )}
        <Box
          {...handlers}
          w="100%"
          h="100%"
          position="relative"
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <Flex
            w={`${photoUrls.length * 100}%`}
            h="100%"
            transform={`translateX(-${currentIndex * (100 / photoUrls.length)}%)`}
            transition="transform 0.5s ease-in-out"
          >
            {photoUrls.map((photoUrl, index) => (
              <MotionBox
                key={index}
                w={`${100 / photoUrls.length}%`}
                h="100%"
                flexShrink={0}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {isLoading && (
                  <Flex justify="center" align="center" h="100%" w="100%">
                    <Spinner size="md" color="teal.500" />
                  </Flex>
                )}
                <Image
                  src={photoUrl}
                  alt={`${roomInfo} photo ${index + 1}`}
                  h="100%"
                  w="100%"
                  objectFit="cover"
                  fallbackSrc={defaultPhoto}
                  loading="lazy"
                  onError={(e) => {
                    console.error(`[RoomCarouselCard] Failed to load image for room ${roomInfo}: ${photoUrl}`);
                    e.target.src = defaultPhoto;
                    setIsLoading(false);
                  }}
                  onLoad={() => {
                    console.log(`[RoomCarouselCard] Successfully loaded image for room ${roomInfo}: ${photoUrl}`);
                    setIsLoading(false);
                  }}
                />
              </MotionBox>
            ))}
          </Flex>
        </Box>
        {/* 슬라이드 인디케이터 */}
        {photoUrls.length > 1 && (
          <Flex justify="center" position="absolute" bottom="5px" left="0" right="0" zIndex={10}>
            {photoUrls.map((_, idx) => (
              <Box
                key={idx}
                w="8px"
                h="8px"
                bg={currentIndex === idx ? 'white' : 'gray.300'}
                borderRadius="full"
                mx={1}
                transition="background-color 0.3s"
                opacity={0.8}
              />
            ))}
          </Flex>
        )}
      </Box>
      {/* 객실 정보 영역 */}
      <Box p={4}>
        <Text fontSize="lg" fontWeight="bold">{roomInfo}</Text>
        <Text color="teal.700">{formattedPrice.toLocaleString()}원 / 박</Text>
        {formattedNumDays > 0 && (
          <Text fontSize="sm" color="gray.500">
            총 가격: {(formattedPrice * formattedNumDays).toLocaleString()}원 ({formattedNumDays}박)
          </Text>
        )}
        {stock !== undefined && (
          <Text fontSize="sm" color={formattedStock > 0 ? 'teal.500' : 'orange.500'}>
            잔여 객실: {formattedStock}개
          </Text>
        )}
        {/* 편의 시설 표시 */}
        {Array.isArray(activeAmenities) && activeAmenities.length > 0 ? (
          <HStack spacing={1} mt={2} mb={2}>
            {activeAmenities.map((amenity, idx) => {
              const IconComponent = iconMap[amenity.icon] || (() => <Box as="span" color="gray.400">?</Box>);
              return (
                <Tooltip key={idx} label={amenity.nameKor} placement="top">
                  <Box>
                    <IconComponent color="gray.500" boxSize={4} />
                  </Box>
                </Tooltip>
              );
            })}
          </HStack>
        ) : (
          <Text fontSize="sm" color="gray.500">편의 시설 정보 없음</Text>
        )}
        <Button
          mt={2}
          colorScheme="blue"
          size="sm"
          onClick={onSelect}
          isDisabled={formattedStock === 0} // 잔여 객실이 0개일 경우 비활성화
          bg={formattedStock === 0 ? 'gray.300' : 'blue.500'} // 잔여 객실이 0개일 경우 회색 배경
          _hover={formattedStock === 0 ? { bg: 'gray.300' } : { bg: 'blue.600' }} // 비활성화 시 호버 효과 제거
          _active={formattedStock === 0 ? { bg: 'gray.300' } : { bg: 'blue.700' }} // 비활성화 시 클릭 효과 제거
          cursor={formattedStock === 0 ? 'not-allowed' : 'pointer'} // 비활성화 시 커서 변경
        >
          선택하기
        </Button>
      </Box>
    </Box>
  );
};

export default RoomCarouselCard;