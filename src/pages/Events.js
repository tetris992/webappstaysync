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
} from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchHotelList, fetchCustomerHotelSettings } from '../api/api';
import { format } from 'date-fns';

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
          (hotel) => hotel.hotelId && typeof hotel.hotelId === 'string' && hotel.hotelId.trim() !== ''
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

        // 각 호텔의 이벤트 조회
        const eventPromises = validHotels.map(async (hotel) => {
          try {
            console.log(`[Events] Fetching settings for hotelId: ${hotel.hotelId}`);
            const settings = await fetchCustomerHotelSettings(hotel.hotelId, {
              checkIn: format(new Date(), 'yyyy-MM-dd'),
              checkOut: format(new Date(), 'yyyy-MM-dd'),
            });
            const hotelEvents = (settings.events || []).map((event) => ({
              ...event,
              uuid: event.uuid || `event-${hotel.hotelId}-${Math.random().toString(36).slice(2)}`,
              hotelId: hotel.hotelId,
              hotelName: settings.hotelName || hotel.hotelName || '알 수 없는 호텔',
              address: settings.address || hotel.address || null,
            }));
            console.log(`[Events] Events for ${hotel.hotelId}:`, hotelEvents);
            return hotelEvents;
          } catch (error) {
            console.error(`[Events] Failed to fetch events for hotel ${hotel.hotelId}:`, error);
            toast({
              title: `호텔 이벤트 로드 실패`,
              description: `${hotel.hotelName || hotel.hotelId}: 이벤트를 불러오지 못했습니다.`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            return [];
          }
        });

        const allEvents = (await Promise.all(eventPromises)).flat();
        console.log('[Events] All events:', allEvents);

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
    console.log('[Events] Event clicked:', event);
    navigate(`/rooms/${event.hotelId}`, {
      state: {
        checkIn: event.startDate ? format(new Date(event.startDate), 'yyyy-MM-dd') : null,
        checkOut: event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : null,
        applicableRoomTypes: event.applicableRoomTypes || [],
      },
    });
  };

  return (
    <Box bg="gray.50" minH="100vh">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" mb={6}>
        <Container maxW="container.lg" py={4}>
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

      <Container maxW="container.lg" py={4}>
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
                    {event.discountValue || 0}% 할인
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
                      {event.hotelName} | {(event.applicableRoomTypes || []).join(', ') || '모든 객실'}
                    </Text>
                    <Text fontSize="2xl" fontWeight="700" lineHeight="1.2">
                      {event.eventName || '특가 이벤트'}
                    </Text>
                    <Text fontSize="sm" opacity={0.8} mt={1}>
                      {event.startDate
                        ? format(new Date(event.startDate), 'yyyy.MM.dd')
                        : 'N/A'}{' '}
                      ~{' '}
                      {event.endDate
                        ? format(new Date(event.endDate), 'yyyy.MM.dd')
                        : 'N/A'}
                    </Text>
                  </Flex>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Text textAlign="center" color="gray.500">
            현재 진행 중인 이벤트가 없습니다.
          </Text>
        )}
      </Container>
    </Box>
  );
};

export default Events;