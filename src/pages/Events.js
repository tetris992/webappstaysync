import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // useParams 추가
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
} from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchCustomerHotelSettings } from '../api/api';
import { format, addDays } from 'date-fns'; // date-fns 함수 import

const Events = () => {
  const navigate = useNavigate();
  const { hotelId } = useParams() || { hotelId: '740630' }; // URL 파라미터 또는 기본값
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const checkIn = format(new Date(), 'yyyy-MM-dd');
        const checkOut = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        const settings = await fetchCustomerHotelSettings(hotelId, {
          checkIn,
          checkOut,
        });
        setEvents(settings.events || []);
      } catch (error) {
        console.error('이벤트 데이터 가져오기 실패:', error);
        setEvents([]); // 오류 시 빈 배열
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [hotelId]);

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
            <Heading size="lg" color="gray.800">이벤트</Heading>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.lg" py={4}>
        {loading ? (
          <Text textAlign="center" color="gray.500">로딩 중...</Text>
        ) : events.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {events.map((event, index) => {
              // 첫 번째 적용 객실을 기반으로 예시 호텔 이미지 매핑
              const hotelImage = `/assets/hotel${(index % 11) + 1}.jpg`; // 1~11까지 순환
              return (
                <Box
                  key={event.uuid}
                  position="relative"
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="sm"
                  bg="white"
                  onClick={() => navigate(`/rooms/${hotelId}`)}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    transform: 'translateY(-4px)',
                    boxShadow: 'lg',
                  }}
                >
                  <Image
                    src={hotelImage}
                    alt={`${event.eventName} 이벤트 이미지`}
                    h="240px"
                    w="100%"
                    objectFit="cover"
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
                      {event.discountValue}% 할인
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
                        {event.applicableRoomTypes[0] || '알 수 없음'} 호텔
                      </Text>
                      <Text fontSize="2xl" fontWeight="700" lineHeight="1.2">
                        {event.eventName}
                      </Text>
                      <Text fontSize="sm" opacity={0.8} mt={1}>
                        {format(new Date(event.startDate), 'yyyy.MM.dd')} ~{' '}
                        {format(new Date(event.endDate), 'yyyy.MM.dd')}
                      </Text>
                    </Flex>
                  </Box>
                </Box>
              );
            })}
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