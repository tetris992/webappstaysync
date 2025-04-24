import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  SimpleGrid,
  Text,
  Image,
  Badge,
  Flex,
  Heading,
  IconButton,
  Spinner,
  useToast,
  Button,
} from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchHotelList, fetchCustomerHotelSettings } from '../api/api';
import {
  format,
  addDays,
  differenceInCalendarDays,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import BottomNavigation from '../components/BottomNavigation';

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={8}>
          <Text color="red.500">
            이벤트 데이터를 렌더링하는 중 오류가 발생했습니다.
          </Text>
          <Button
            mt={4}
            onClick={() => window.location.reload()}
            colorScheme="blue"
          >
            다시 시도
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const Events = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const hotels = await fetchHotelList();
        console.log('[Events] Fetched hotels:', hotels);

        if (!hotels || !Array.isArray(hotels) || hotels.length === 0) {
          console.warn('[Events] No hotels found or invalid response');
          toast({
            title: '호텔 목록 로드 실패',
            description: '등록된 호텔이 없습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          setEvents([]);
          return;
        }

        const validHotels = hotels.filter(
          (hotel) =>
            hotel.hotelId &&
            typeof hotel.hotelId === 'string' &&
            hotel.hotelId.trim() !== ''
        );
        console.log('[Events] Valid hotels:', validHotels);

        if (validHotels.length === 0) {
          console.warn('[Events] No valid hotels with hotelId');
          toast({
            title: '호텔 목록 오류',
            description: '유효한 호텔 데이터가 없습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          setEvents([]);
          return;
        }

        const todayKST = format(new Date(), 'yyyy-MM-dd', { locale: ko }); // KST 기준 오늘 날짜 문자열
        console.log('[Events] Today (KST):', todayKST);

        const eventPromises = validHotels.map(async (hotel) => {
          try {
            console.log(
              `[Events] Fetching settings for hotelId: ${hotel.hotelId}`
            );
            const settings = await fetchCustomerHotelSettings(hotel.hotelId, {
              checkIn: todayKST,
              checkOut: todayKST,
            });
            console.log(`[Events] Settings for ${hotel.hotelId}:`, settings);
            const hotelEvents = (settings.events || [])
              .filter((event) => {
                // 현재 날짜가 이벤트 기간 내에 있는지 확인
                return (
                  event.isActive &&
                  event.startDate <= todayKST &&
                  event.endDate >= todayKST
                );
              })
              .map((event) => {
                console.log(
                  `[Events] Event for ${hotel.hotelId}:`,
                  event.startDate,
                  event.endDate
                );
                return {
                  ...event,
                  uuid:
                    event.uuid ||
                    `event-${hotel.hotelId}-${Math.random()
                      .toString(36)
                      .slice(2)}`,
                  hotelId: hotel.hotelId,
                  hotelName:
                    settings.hotelName || hotel.hotelName || '알 수 없는 호텔',
                  address: settings.address || hotel.address || null,
                };
              });
            console.log(`[Events] Active Events for ${hotel.hotelId}:`, hotelEvents);
            return hotelEvents;
          } catch (error) {
            console.error(
              `[Events] Failed to fetch events for hotel ${hotel.hotelId}:`,
              error
            );
            toast({
              title: `호텔 이벤트 로드 실패`,
              description: `${
                hotel.hotelName || hotel.hotelId
              }: 이벤트를 불러오지 못했습니다.`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            return [];
          }
        });

        const allEvents = (await Promise.all(eventPromises)).flat();
        console.log(
          '[Events] All active events:',
          allEvents.map((e) => ({
            uuid: e.uuid,
            startDate: e.startDate,
            endDate: e.endDate,
            eventName: e.eventName,
            discountType: e.discountType,
            discountValue: e.discountValue,
          }))
        );

        if (allEvents.length === 0) {
          toast({
            title: '이벤트 없음',
            description: '현재 진행 중인 이벤트가 없습니다.',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        }

        setEvents(allEvents);
      } catch (error) {
        console.error('[Events] Event data fetch failed:', error);
        toast({
          title: '이벤트 로드 실패',
          description: error.message || '이벤트 데이터를 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [toast]);

  const handleEventClick = (event) => {
    console.log('[Events] Event clicked:', {
      event,
      startDate: event.startDate,
      endDate: event.endDate,
      discountType: event.discountType,
      discountValue: event.discountValue,
    });

    const todayKST = format(new Date(), 'yyyy-MM-dd', { locale: ko });
    const parsedStartDate = event.startDate; // 문자열 그대로 사용
    const parsedEndDate = event.endDate;     // 문자열 그대로 사용

    // startDate와 endDate 간의 일수 차이 계산
    const eventDuration =
      differenceInCalendarDays(
        new Date(parsedEndDate),
        new Date(parsedStartDate)
      ) || 1;

    // startDate가 오늘보다 이전이면 오늘로 조정
    const adjustedCheckIn =
      parsedStartDate < todayKST ? todayKST : parsedStartDate;

    // endDate도 startDate 조정에 맞춰 업데이트
    const adjustedCheckOut = format(
      addDays(new Date(adjustedCheckIn), Math.max(eventDuration, 1)),
      'yyyy-MM-dd'
    );

    console.log('[Events] Adjusted dates:', {
      adjustedCheckIn,
      adjustedCheckOut,
    });

    navigate(`/rooms/${event.hotelId}`, {
      state: {
        checkIn: adjustedCheckIn,
        checkOut: adjustedCheckOut,
        applicableRoomTypes: event.applicableRoomTypes || [],
        discountType: event.discountType,
        discountValue: event.discountValue,
      },
    });
  };

  return (
    <ErrorBoundary>
      <Container
        maxW="container.lg"
        p={0}
        minH="100vh"
        display="flex"
        flexDirection="column"
        w="100%"
        overflow="hidden"
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        overflowX="hidden"
        bg="gray.50"
      >
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          h="64px"
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          zIndex={1000}
          boxShadow="sm"
        >
          <Container maxW="container.lg" h="full" py={{ base: 3, md: 4 }}>
            <Flex position="relative" align="center" justify="center" h="full">
              <IconButton
                icon={<FaArrowLeft />}
                variant="ghost"
                position="absolute"
                left={0}
                aria-label="뒤로 가기"
                onClick={() => navigate(-1)}
              />
              <Heading size="lg" color="gray.800">
                이벤트
              </Heading>
            </Flex>
          </Container>
        </Box>

        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          position="relative"
          pt="64px" // 헤더 높이
          pb={{ base: '58px', md: '50px' }} // BottomNavigation 높이(58px)에 맞춰 조정
          css={{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <Container maxW="container.lg" py={{ base: 4, md: 6 }}>
            {loading ? (
              <Flex justify="center" py={8}>
                <Spinner size="xl" />
              </Flex>
            ) : events.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {events.map((event, index) => {
                  return (
                    <Box
                      key={`${event.uuid}-${index}`}
                      position="relative"
                      borderRadius="2xl"
                      overflow="hidden"
                      boxShadow="sm"
                      bg="white"
                      onClick={() => handleEventClick(event)}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{
                        transform: 'translateY(-4px)',
                        boxShadow: 'lg',
                      }}
                    >
                      <Image
                        src={`/assets/hotel${(index % 11) + 1}.jpg`}
                        alt={`${event.eventName || '이벤트'} 이미지`}
                        h="240px"
                        w="100%"
                        objectFit="cover"
                        fallbackSrc="/assets/default-hotel.jpg"
                      />
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8))"
                      />
                      <Box position="absolute" top={4} right={4}>
                        <Badge
                          colorScheme="red"
                          fontSize="md"
                          px={3}
                          py={1.5}
                          borderRadius="full"
                          bg="rgba(255,255,255,0.9)"
                          boxShadow="md"
                        >
                          {event.discountType === 'fixed'
                            ? `${(
                                event.discountValue || 0
                              ).toLocaleString()}원 할인`
                            : `${event.discountValue || 0}% 할인`}
                        </Badge>
                      </Box>
                      <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        p={6}
                        color="white"
                      >
                        <Flex direction="column" gap={2}>
                          <Text fontSize="sm" fontWeight="500" opacity={0.9}>
                            {event.hotelName} |{' '}
                            {(event.applicableRoomTypes || []).join(', ') ||
                              '모든 객실'}
                          </Text>
                          <Text
                            fontSize="2xl"
                            fontWeight="700"
                            lineHeight="1.2"
                          >
                            {event.eventName || '특가 이벤트'}
                          </Text>
                          <Text fontSize="sm" opacity={0.8} mt={1}>
                            {event.startDate.replace(/-/g, '.')} ~{' '}
                            {event.endDate.replace(/-/g, '.')}
                          </Text>
                        </Flex>
                      </Box>
                    </Box>
                  );
                })}
              </SimpleGrid>
            ) : (
              <Text textAlign="center" color="gray.500" pb={4}>
                현재 진행 중인 이벤트가 없습니다.
              </Text>
            )}
          </Container>
        </Box>

        <BottomNavigation />
      </Container>
    </ErrorBoundary>
  );
};

export default Events;