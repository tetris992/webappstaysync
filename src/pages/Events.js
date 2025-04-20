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
import { format, startOfDay, isValid, parse } from 'date-fns';
import { ko } from 'date-fns/locale';

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

  // KST 날짜 파싱 및 포맷팅 유틸리티 함수
  const formatKSTDate = (dateStr, pattern = 'yyyy-MM-dd') => {
    if (!dateStr || typeof dateStr !== 'string') {
      console.warn('[formatKSTDate] Invalid date string:', dateStr);
      return null;
    }

    // 지원 가능한 날짜 형식 목록
    const dateFormats = ['yyyy-MM-dd', 'yyyy/MM/dd', 'yyyy.MM.dd'];
    let parsedDate = null;

    // 각 형식으로 파싱 시도
    for (const fmt of dateFormats) {
      try {
        parsedDate = parse(dateStr, fmt, new Date(), { locale: ko });
        if (isValid(parsedDate)) {
          // KST 타임존 적용
          const kstDate = new Date(
            parsedDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          );
          console.log('[formatKSTDate] Parsed KST date:', {
            dateStr,
            fmt,
            kstDate,
          });
          return format(kstDate, pattern, { locale: ko });
        }
      } catch (e) {
        console.warn('[formatKSTDate] Failed to parse with format:', fmt, e);
      }
    }

    // ISO 8601 형식 시도
    const kstDate = new Date(`${dateStr}T00:00:00+09:00`);
    if (isValid(kstDate)) {
      console.log('[formatKSTDate] Parsed ISO KST date:', { dateStr, kstDate });
      return format(kstDate, pattern, { locale: ko });
    }

    console.warn('[formatKSTDate] All parsing attempts failed:', dateStr);
    return null;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const hotels = await fetchHotelList();
        console.log('[Events] Fetched hotels:', hotels);

        // 호텔 목록 유효성 검사
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

        // 유효한 hotelId만 필터링
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

        // KST 기준 오늘 날짜 계산
        const todayKST = startOfDay(
          new Date(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          )
        );
        console.log('[Events] KST Today:', todayKST);

        // 각 호텔의 이벤트 조회
        const eventPromises = validHotels.map(async (hotel) => {
          try {
            console.log(
              `[Events] Fetching settings for hotelId: ${hotel.hotelId}`
            );
            const settings = await fetchCustomerHotelSettings(hotel.hotelId, {
              checkIn: format(todayKST, 'yyyy-MM-dd', { locale: ko }),
              checkOut: format(todayKST, 'yyyy-MM-dd', { locale: ko }),
            });
            console.log(`[Events] Settings for ${hotel.hotelId}:`, settings);
            const hotelEvents = (settings.events || []).map((event) => ({
              ...event,
              uuid:
                event.uuid ||
                `event-${hotel.hotelId}-${Math.random().toString(36).slice(2)}`,
              hotelId: hotel.hotelId,
              hotelName:
                settings.hotelName || hotel.hotelName || '알 수 없는 호텔',
              address: settings.address || hotel.address || null,
            }));
            console.log(`[Events] Events for ${hotel.hotelId}:`, hotelEvents);
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
        console.log('[Events] All events:', allEvents.map((e) => ({
          uuid: e.uuid,
          startDate: e.startDate,
          endDate: e.endDate,
          eventName: e.eventName,
          discountType: e.discountType,
          discountValue: e.discountValue,
        })));

        // 이벤트가 없으면 사용자에게 알림
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

    navigate(`/rooms/${event.hotelId}`, {
      state: {
        checkIn: formatKSTDate(event.startDate),
        checkOut: formatKSTDate(event.endDate),
        applicableRoomTypes: event.applicableRoomTypes || [],
        discountType: event.discountType,
        discountValue: event.discountValue,
      },
    });
  };

  return (
    <ErrorBoundary>
      <Box
        bg="gray.50"
        minH="100vh"
        display="flex"
        flexDir="column"
        overflow="hidden"
      >
        {/* 상단 헤더 - 고정 위치 */}
        <Box
          position="sticky"
          top={0}
          left={0}
          right={0}
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          zIndex={1000}
          boxShadow="sm"
        >
          <Container maxW="container.lg" py={{ base: 3, md: 4 }}>
            <Flex position="relative" align="center" justify="center">
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

        {/* 본문 영역 - 스크롤 가능 */}
        <Box
          flex="1"
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.200',
              borderRadius: '24px',
            },
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Container
            maxW="container.lg"
            py={{ base: 4, md: 6 }}
            pb={{ base: 8, md: 12 }}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
          >
            {loading ? (
              <Flex justify="center" py={8}>
                <Spinner size="xl" />
              </Flex>
            ) : events.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {events.map((event, index) => (
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
                          ? `${(event.discountValue || 0).toLocaleString()}원 할인`
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
                        <Text fontSize="2xl" fontWeight="700" lineHeight="1.2">
                          {event.eventName || '특가 이벤트'}
                        </Text>
                        <Text fontSize="sm" opacity={0.8} mt={1}>
                          {formatKSTDate(event.startDate, 'yyyy.MM.dd') || 'N/A'}{' '}
                          ~{' '}
                          {formatKSTDate(event.endDate, 'yyyy.MM.dd') || 'N/A'}
                        </Text>
                      </Flex>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Text textAlign="center" color="gray.500" pb={4}>
                현재 진행 중인 이벤트가 없습니다.
              </Text>
            )}
          </Container>
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

export default Events;