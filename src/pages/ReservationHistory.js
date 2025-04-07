import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  Spinner,
  Box,
  useToast,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { keyframes } from '@chakra-ui/system';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import useSocket from '../hooks/useSocket';
import ReservationCard from '../components/ReservationCard';
import { getReservationHistory, cancelReservation, fetchHotelPhotos } from '../api/api';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

const MotionBox = motion(Box);

const blink = keyframes`
  0% { opacity: 0.2; }
  50% { opacity: 0.5; }
  100% { opacity: 0.2; }
`;

const ReservationHistory = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const socket = useSocket();
  const [reservations, setReservations] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getReservationHistory();
      const sortedReservations = (response.history || []).sort(
        (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
      );

      // 각 예약에 대해 사진 로드
      const reservationsWithPhotos = await Promise.all(
        sortedReservations.map(async (reservation) => {
          try {
            const photosData = await fetchHotelPhotos(
              reservation.hotelId,
              'room',
              reservation.roomInfo
            );
            console.log(
              `[ReservationHistory] Photos for room ${reservation.roomInfo}:`,
              photosData
            );
            const photoUrl =
              photosData?.roomPhotos && photosData.roomPhotos.length > 0
                ? photosData.roomPhotos[0].photoUrl
                : '/assets/default-room1.jpg';
            return { ...reservation, photoUrl };
          } catch (error) {
            console.error(
              `[ReservationHistory] Failed to fetch photos for room ${reservation.roomInfo}:`,
              error
            );
            return { ...reservation, photoUrl: '/assets/default-room1.jpg' };
          }
        })
      );

      setReservations(reservationsWithPhotos);
      setTotalVisits(response.totalVisits || 0);
    } catch (error) {
      toast({
        title: '예약 내역 로드 실패',
        description: error.message || '예약 내역을 불러오지 못했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleCancel = useCallback(
    async (reservationId) => {
      try {
        await cancelReservation(reservationId);
        toast({
          title: '예약 취소 완료',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadHistory();
      } catch (error) {
        toast({
          title: '취소 실패',
          description: error.message || '예약 취소에 실패했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [loadHistory, toast]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!socket || !customer) return;

    socket.emit('subscribeToReservationUpdates', customer._id);
    socket.on('reservationUpdated', (updatedReservation) => {
      toast({
        title: '예약 상태 변경',
        description: `예약 ${updatedReservation.reservationId}의 상태가 변경되었습니다.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      loadHistory();
    });

    return () => {
      socket.off('reservationUpdated');
    };
  }, [socket, customer, toast, loadHistory]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < reservations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true,
  });

  return (
    <Container
      maxW="container.sm"
      py={6}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={4} align="stretch" flex="1">
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="bold"
          color="teal.500"
          textAlign="center"
        >
          예약 내역
        </Text>
        <Text fontSize="md" color="gray.600" textAlign="center">
          총 방문 횟수: {totalVisits}
        </Text>
        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="lg" color="teal.500" />
          </Box>
        ) : reservations.length === 0 ? (
          <Text textAlign="center" color="gray.500">
            예약 내역이 없습니다.
          </Text>
        ) : (
          <Box position="relative" flex="1">
            {currentIndex > 0 && (
              <IconButton
                icon={<ChevronLeftIcon />}
                position="absolute"
                left="-20px"
                top="50%"
                transform="translateY(-50%)"
                zIndex={10}
                bg="gray.200"
                opacity={0.3}
                _hover={{ opacity: 0.7 }}
                animation={`${blink} 3s infinite`}
                onClick={handlePrev}
                aria-label="Previous reservation"
              />
            )}
            <Box
              {...handlers}
              overflow="hidden"
              width="100%"
              position="relative"
              height="auto"
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              <Flex
                width="100%"
                transform={`translateX(-${currentIndex * 100}%)`}
                transition="transform 0.5s ease-in-out"
              >
                {reservations.map((reservation, idx) => (
                  <MotionBox
                    key={reservation._id}
                    minW="100%"
                    maxW="100%"
                    px={2}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: currentIndex === idx ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <ReservationCard
                      reservation={reservation}
                      onCancel={handleCancel}
                    />
                  </MotionBox>
                ))}
              </Flex>
            </Box>
            {currentIndex < reservations.length - 1 && (
              <IconButton
                icon={<ChevronRightIcon />}
                position="absolute"
                right="-20px"
                top="50%"
                transform="translateY(-50%)"
                zIndex={10}
                bg="gray.200"
                opacity={0.3}
                _hover={{ opacity: 0.7 }}
                animation={`${blink} 3s infinite`}
                onClick={handleNext}
                aria-label="Next reservation"
              />
            )}
            <Flex justify="center" mt={2}>
              {reservations.map((_, idx) => (
                <Box
                  key={idx}
                  w="8px"
                  h="8px"
                  bg={currentIndex === idx ? 'teal.500' : 'gray.300'}
                  borderRadius="full"
                  mx={1}
                  transition="background-color 0.3s"
                />
              ))}
            </Flex>
          </Box>
        )}
        <Button
          colorScheme="gray"
          variant="outline"
          onClick={() => navigate('/')}
          w="full"
          size="md"
        >
          홈으로 돌아가기
        </Button>
      </VStack>
    </Container>
  );
};

export default ReservationHistory;