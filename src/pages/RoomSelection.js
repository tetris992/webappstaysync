import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  SimpleGrid,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  Box,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverFooter,
  Button as ChakraButton,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  ModalBody,
  HStack,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaMapSigns, FaCopy } from 'react-icons/fa'; // react-icons에서 가져오기
import { DateRange } from 'react-date-range';
import {
  format,
  addDays,
  startOfDay,
  differenceInCalendarDays,
  isBefore,
  addMonths,
  isValid,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import RoomCarouselCard from '../components/RoomCarouselCard';
import {
  fetchHotelAvailability,
  fetchCustomerHotelSettings,
  fetchHotelPhotos,
} from '../api/api';
import Map from '../components/Map';

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const { checkIn, checkOut } = location.state || {};

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const maxDate = addMonths(today, 3);

  const [dateRange, setDateRange] = useState([
    {
      startDate: checkIn ? new Date(checkIn) : today,
      endDate: checkOut ? new Date(checkOut) : tomorrow,
      key: 'selection',
    },
  ]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomPhotosMap, setRoomPhotosMap] = useState({});
  const [isOpen, setIsOpen] = useState(false); // Popover 상태 관리
  const [shouldFetchAvailability, setShouldFetchAvailability] = useState(true); // 가용 객실 조회 트리거
  const [isMapOpen, setIsMapOpen] = useState(false); // 지도 모달 상태

  const numDays = differenceInCalendarDays(
    dateRange[0].endDate,
    dateRange[0].startDate
  );

  const startLabel = isValid(dateRange[0].startDate)
    ? format(dateRange[0].startDate, 'yyyy-MM-dd')
    : '';
  const endLabel = isValid(dateRange[0].endDate)
    ? format(dateRange[0].endDate, 'yyyy-MM-dd')
    : '';

  const handleCheckAvailability = useCallback(async () => {
    const checkIn = dateRange[0].startDate;
    const checkOut = dateRange[0].endDate;

    if (!checkIn || !checkOut || !isValid(checkIn) || !isValid(checkOut)) {
      toast({
        title: '날짜 오류',
        description: '체크인/체크아웃 날짜가 올바르지 않습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isBefore(checkIn, today)) {
      toast({
        title: '날짜 오류',
        description: '체크인 날짜는 오늘 이후여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (isBefore(maxDate, checkIn)) {
      toast({
        title: '날짜 범위 오류',
        description: '체크인 날짜는 현재로부터 3개월 이내여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (numDays <= 0) {
      toast({
        title: '날짜 오류',
        description: '체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const maxCheckOutDate = addMonths(checkIn, 3);
    if (isBefore(maxCheckOutDate, checkOut)) {
      toast({
        title: '날짜 범위 오류',
        description: '체크아웃 날짜는 체크인 날짜로부터 3개월 이내여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const hotelData = await fetchHotelAvailability(
        hotelId,
        format(checkIn, 'yyyy-MM-dd'),
        format(checkOut, 'yyyy-MM-dd')
      );
      const roomTypes = hotelSettings?.roomTypes || [];
      const availabilityWithAmenities = (hotelData.availability || []).map(
        (room) => {
          const key = room.roomInfo.toLowerCase();
          const foundType = roomTypes.find(
            (rt) => rt.roomInfo.toLowerCase() === key
          );
          const activeAmenities =
            foundType?.roomAmenities
              ?.filter((amenity) => amenity.isActive)
              .map((amenity) => ({
                nameKor: amenity.nameKor,
                nameEng: amenity.nameEng,
                icon: amenity.icon,
              })) || [];
          return {
            ...room,
            activeAmenities,
            photos: roomPhotosMap[key] || [],
          };
        }
      );

      setAvailableRooms(availabilityWithAmenities);
      setIsAvailabilityChecked(true);
    } catch (error) {
      toast({
        title: '가용 객실 조회 실패',
        description: error.message || '가용 객실을 확인하지 못했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    dateRange,
    hotelId,
    hotelSettings,
    roomPhotosMap,
    toast,
    today,
    maxDate,
    numDays,
  ]);

  useEffect(() => {
    const loadHotelSettings = async () => {
      try {
        const settings = await fetchCustomerHotelSettings(hotelId);
        setHotelSettings(settings);

        const roomTypes = settings.roomTypes || [];
        const photosPromises = roomTypes.map(async (roomType) => {
          try {
            const photosData = await fetchHotelPhotos(
              hotelId,
              'room',
              roomType.roomInfo
            );
            return {
              roomInfo: roomType.roomInfo,
              photos: photosData.roomPhotos || [],
            };
          } catch (error) {
            console.error('Failed to fetch photos for room:', roomType.roomInfo);
            return { roomInfo: roomType.roomInfo, photos: [] };
          }
        });

        const photosResults = await Promise.all(photosPromises);
        const photosMap = photosResults.reduce((acc, { roomInfo, photos }) => {
          acc[roomInfo.toLowerCase()] = photos;
          return acc;
        }, {});
        setRoomPhotosMap(photosMap);

        setShouldFetchAvailability(true);
      } catch (error) {
        toast({
          title: '호텔 설정 로딩 실패',
          description: error.message || '호텔 설정을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      }
    };
    loadHotelSettings();
  }, [hotelId, navigate, toast]);

  useEffect(() => {
    if (shouldFetchAvailability && hotelSettings && roomPhotosMap) {
      handleCheckAvailability();
      setShouldFetchAvailability(false);
    }
  }, [shouldFetchAvailability, hotelSettings, roomPhotosMap, handleCheckAvailability]);

  const handleDateChange = (item) => {
    const newDateRange = [item.selection];
    setDateRange(newDateRange);
    if (item.selection.startDate && item.selection.endDate) {
      setIsOpen(false);
      toast({
        title: '날짜 선택 완료',
        description: `${format(item.selection.startDate, 'yyyy-MM-dd')} ~ ${format(item.selection.endDate, 'yyyy-MM-dd')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setShouldFetchAvailability(true);
    }
  };

  const handleSelectRoom = (roomInfo, perNightPrice) => {
    const nights = differenceInCalendarDays(
      dateRange[0].endDate,
      dateRange[0].startDate
    );
    const totalPrice = perNightPrice * nights;

    navigate('/confirm', {
      state: {
        hotelId,
        roomInfo,
        checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
        checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
        price: totalPrice,
        numNights: nights,
      },
    });
  };

  const handleAddressClick = () => {
    if (hotelSettings && (hotelSettings.latitude || hotelSettings.longitude)) {
      setIsMapOpen(true);
    } else {
      toast({
        title: '위치 정보 없음',
        description: '호텔 좌표 정보를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTMapNavigation = () => {
    if (!hotelSettings?.latitude || !hotelSettings?.longitude) {
      toast({
        title: '좌표 정보 없음',
        description: '호텔 좌표를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tmapUrl = `tmap://route?goalx=${hotelSettings.longitude}&goaly=${hotelSettings.latitude}&name=${encodeURIComponent(hotelSettings?.hotelName || '호텔')}`;
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
      } else if (isIOS) {
        window.location.href = 'https://apps.apple.com/kr/app/tmap/id431589174';
      } else {
        toast({
          title: 'T맵 설치 필요',
          description: 'T맵 앱이 설치되어 있지 않습니다. 설치 페이지로 이동합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 2000);
  };

  const handleCopyAddress = () => {
    if (hotelSettings && hotelSettings.address) {
      navigator.clipboard.writeText(hotelSettings.address).then(() => {
        toast({
          title: '주소 복사 완료',
          description: '호텔 주소가 클립보드에 복사되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }).catch((error) => {
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

  return (
    <Container
      maxW="container.sm"
      py={6}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={4} align="stretch" flex="1">
        <Flex align="center" justify="center">
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            color="teal.500"
            textAlign="center"
          >
            {hotelSettings?.hotelName || '객실 선택'}
          </Text>
          {hotelSettings && (
            <Button
              variant="link"
              color="teal.600"
              ml={2}
              onClick={handleAddressClick}
              _hover={{ color: 'teal.800', textDecoration: 'underline' }}
            >
              <FaMapMarkerAlt size={24} />
            </Button>
          )}
        </Flex>

        <VStack spacing={2}>
          <Popover
            placement="bottom"
            isOpen={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            closeOnBlur={true}
          >
            <PopoverTrigger>
              <InputGroup
                w={{ base: '90%', sm: '80%', md: 'sm' }}
                cursor="pointer"
                mx="auto"
              >
                <InputLeftElement pointerEvents="none">
                  <CalendarIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  readOnly
                  borderColor="gray.300"
                  borderRadius="full"
                  bg="white"
                  boxShadow="sm"
                  _hover={{ borderColor: 'teal.500', boxShadow: 'md' }}
                  _focus={{
                    borderColor: 'teal.500',
                    boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
                  }}
                  pl="2.5rem"
                  transition="all 0.3s ease"
                  value={
                    startLabel && endLabel
                      ? `${startLabel} ~ ${endLabel}`
                      : '날짜 선택'
                  }
                  aria-label="체크인 및 체크아웃 날짜 선택"
                />
              </InputGroup>
            </PopoverTrigger>
            <PopoverContent
              zIndex={1500}
              w="fit-content"
              mx="auto"
              textAlign="center"
            >
              <PopoverArrow />
              <PopoverBody p={4} display="flex" justifyContent="center">
                <Box>
                  <DateRange
                    editableDateInputs={true}
                    onChange={handleDateChange}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    months={2}
                    direction="vertical"
                    scroll={{ enabled: true }}
                    minDate={startOfDay(new Date())}
                    maxDate={addMonths(startOfDay(new Date()), 3)}
                    locale={ko}
                  />
                </Box>
              </PopoverBody>
              <PopoverFooter
                border="0"
                d="flex"
                justifyContent="flex-end"
                pb={4}
              >
                <ChakraButton
                  size="sm"
                  colorScheme="gray"
                  onClick={() => setIsOpen(false)}
                >
                  닫기
                </ChakraButton>
              </PopoverFooter>
            </PopoverContent>
          </Popover>

          <Text fontSize="sm" color="gray.500">
            최대 3개월 이내의 날짜만 예약 가능합니다.
          </Text>
        </VStack>

        {isLoading ? (
          <VStack flex="1" justify="center" align="center">
            <Text color="gray.500">객실을 불러오는 중입니다...</Text>
          </VStack>
        ) : isAvailabilityChecked && availableRooms.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            선택하신 기간({startLabel} ~ {endLabel})에 이용 가능한 객실이 없습니다. 다른 날짜를 선택해 주세요.
          </Text>
        ) : (
          isAvailabilityChecked && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {availableRooms.map((room) => (
                <RoomCarouselCard
                  key={room.roomInfo}
                  roomInfo={room.roomInfo}
                  price={room.price}
                  stock={room.availableRooms}
                  numDays={numDays}
                  activeAmenities={room.activeAmenities}
                  photos={room.photos}
                  onSelect={() => handleSelectRoom(room.roomInfo, room.price)}
                />
              ))}
            </SimpleGrid>
          )
        )}

        <Button
          onClick={() => navigate('/hotels')}
          colorScheme="gray"
          w="full"
          size="md"
        >
          뒤로가기
        </Button>
      </VStack>

      {/* 지도 모달 */}
      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>호텔 위치</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="md" color="gray.600" mb={2}>
              호텔 ID: {hotelId}
            </Text>
            <Text fontSize="md" color="gray.600" mb={4}>
              주소: {hotelSettings?.address || '주소 정보 없음'}
            </Text>
            <Box h="400px" w="100%">
              <Map
                address={hotelSettings?.address}
                latitude={hotelSettings?.latitude}
                longitude={hotelSettings?.longitude}
                onCoordinatesChange={() => {}} // 좌표는 DB에서 가져오므로 콜백 불필요
              />
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
              >
                주소 복사
              </Button>
              <Button colorScheme="gray" onClick={() => setIsMapOpen(false)}>
                닫기
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default RoomSelection;