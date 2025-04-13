import React from 'react';
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
} from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';

const Events = () => {
  const navigate = useNavigate();

  const eventHotels = [
    {
      id: 1,
      name: '부산 시그니엘',
      image: '/assets/hotel1.jpg',
      eventTitle: '봄맞이 특가',
      discount: '30%',
      period: '2024.04.01 ~ 2024.04.30',
      description: '봄 시즌 특별 할인 이벤트',
    },
    {
      id: 2,
      name: '제주 롯데호텔',
      image: '/assets/hotel2.jpg',
      eventTitle: '얼리버드 특가',
      discount: '25%',
      period: '2024.04.15 ~ 2024.05.15',
      description: '여름 성수기 얼리버드 예약 특가',
    },
    // 더 많은 이벤트 호텔 추가 가능
  ];

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
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {eventHotels.map((hotel) => (
            <Box
              key={hotel.id}
              position="relative"
              borderRadius="2xl"
              overflow="hidden"
              boxShadow="sm"
              bg="white"
              onClick={() => navigate(`/rooms/${hotel.id}`)}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
              }}
            >
              <Image
                src={hotel.image}
                alt={hotel.name}
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
              <Box
                position="absolute"
                top={4}
                right={4}
              >
                <Badge
                  colorScheme="red"
                  fontSize="md"
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  bg="rgba(255,255,255,0.9)"
                  boxShadow="md"
                >
                  {hotel.discount} 할인
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
                    {hotel.name}
                  </Text>
                  <Text fontSize="2xl" fontWeight="700" lineHeight="1.2">
                    {hotel.eventTitle}
                  </Text>
                  <Text fontSize="sm" opacity={0.8} mt={1}>
                    {hotel.period}
                  </Text>
                </Flex>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Events; 