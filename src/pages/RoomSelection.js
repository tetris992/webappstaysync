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
import { FaMapMarkerAlt, FaMapSigns, FaCopy } from 'react-icons/fa';
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
      maxW="container.xl"
      p={0}
      h="100vh"
      display="flex"
      flexDirection="column"
      bg="gray.50"
      overflow="hidden"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
    >
      {/* 상단 헤더 */}
      <Box 
        w="100%" 
        py={3}
        px={4} 
        bg="white" 
        position="sticky"
        top={0}
        zIndex={2}
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Flex align="center" justify="space-between">
          <Text
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="700"
            color="gray.900"
          >
            {hotelSettings?.hotelName || '객실 선택'}
          </Text>
          <HStack spacing={3}>
            {hotelSettings && (
              <Button
                variant="ghost"
                color="gray.700"
                onClick={handleAddressClick}
                _hover={{ color: 'blue.500', bg: 'blue.50' }}
                size="md"
                leftIcon={<FaMapMarkerAlt size={16} />}
                fontWeight="600"
              >
                위치보기
              </Button>
            )}
            <Button
              variant="solid"
              colorScheme="blue"
              size="md"
              fontWeight="600"
              onClick={() => {
                const sortedRooms = [...availableRooms].sort((a, b) => a.price - b.price);
                setAvailableRooms(sortedRooms);
                toast({
                  title: '객실 정렬',
                  description: '가격이 낮은 순으로 정렬되었습니다.',
                  status: 'success',
                  duration: 2000,
                  isClosable: true,
                });
              }}
              _hover={{ bg: 'blue.600' }}
            >
              가격순 정렬
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* 날짜 선택 영역 */}
      <Box 
        w="100%" 
        bg="white"
        position="sticky"
        top="60px"
        zIndex={1}
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
        p={4}
      >
        <VStack spacing={3}>
          <Box w="100%">
            <Popover
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              closeOnBlur={false}
              placement="bottom"
              matchWidth
            >
              <PopoverTrigger>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <CalendarIcon color="gray.600" />
                  </InputLeftElement>
                  <Input
                    readOnly
                    value={`${startLabel || '체크인'} ~ ${endLabel || '체크아웃'} (${numDays}박)`}
                    onClick={() => setIsOpen(true)}
                    placeholder="체크인 - 체크아웃"
                    bg="white"
                    color="gray.800"
                    fontWeight="500"
                    _hover={{ borderColor: 'blue.500' }}
                  />
                </InputGroup>
              </PopoverTrigger>
              <PopoverContent
                width={{ base: "95vw", md: "auto" }}
                maxWidth="95vw"
                border="none"
                boxShadow="xl"
                _focus={{ boxShadow: "xl" }}
                bg="white"
              >
                <PopoverArrow />
                <PopoverBody p={0}>
                  <Box
                    className="custom-calendar-wrapper"
                    sx={{
                      '.rdrCalendarWrapper': {
                        width: '100%',
                        fontSize: '14px',
                        bg: 'white'
                      },
                      '.rdrMonth': {
                        width: '100%'
                      },
                      '.rdrDateDisplayWrapper': {
                        background: 'none'
                      },
                      '.rdrDayToday .rdrDayNumber span:after': {
                        background: 'blue.500'
                      },
                      '.rdrDateRangePickerWrapper': {
                        p: 2
                      },
                      '@media (max-width: 480px)': {
                        '.rdrCalendarWrapper, .rdrMonth': {
                          width: '100%'
                        },
                        '.rdrDateRangeWrapper': {
                          flexDirection: 'column'
                        }
                      }
                    }}
                  >
                    <DateRange
                      onChange={(item) => {
                        setDateRange([item.selection]);
                        const { startDate, endDate } = item.selection;
                        if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
                          setIsOpen(false);
                          setShouldFetchAvailability(true);
                        }
                      }}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                      months={window.innerWidth > 768 ? 2 : 1}
                      direction={window.innerWidth > 768 ? "horizontal" : "vertical"}
                      minDate={today}
                      maxDate={maxDate}
                      locale={ko}
                      rangeColors={['#3182CE']}
                      showSelectionPreview={true}
                      showDateDisplay={true}
                      editableDateInputs={true}
                      retainEndDateOnFirstSelection={true}
                    />
                  </Box>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Box>
          <Text fontSize="sm" color="gray.500">
            최대 3개월 이내의 날짜만 예약 가능합니다.
          </Text>
        </VStack>
      </Box>

      {/* 객실 목록 영역 - 스크롤 가능 */}
      <Box 
        flex="1" 
        overflowY="auto" 
        px={3} 
        pb={20} /* 하단 네비게이션을 위한 여백 */
      >
        {isLoading ? (
          <VStack flex="1" justify="center" align="center" bg="white" rounded="md" shadow="sm" p={8}>
            <Text color="gray.500">객실을 불러오는 중입니다...</Text>
          </VStack>
        ) : isAvailabilityChecked && availableRooms.length === 0 ? (
          <Box bg="white" rounded="md" shadow="sm" p={8}>
            <Text textAlign="center" color="gray.500">
              선택하신 기간({startLabel} ~ {endLabel})에 이용 가능한 객실이 없습니다.
              <br />다른 날짜를 선택해 주세요.
            </Text>
          </Box>
        ) : (
          isAvailabilityChecked && (
            <SimpleGrid 
              columns={{ base: 1, sm: 1, md: 2, lg: 3 }} 
              spacing={6} 
              my={6}
            >
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
      </Box>

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