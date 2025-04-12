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
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import useSocket from '../hooks/useSocket';
import ReservationCard from '../components/ReservationCard';
import {
  getReservationHistory,
  cancelReservation,
  fetchHotelPhotos,
} from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

const MotionBox = motion(Box);

const ReservationHistory = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const socket = useSocket();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getReservationHistory();
      const sortedReservations = (response.history || []).sort(
        (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
      );

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
            return { 
              ...reservation, 
              photoUrl,
              latitude: reservation.latitude || null, // 좌표 추가
              longitude: reservation.longitude || null // 좌표 추가
            };
          } catch (error) {
            console.error(
              `[ReservationHistory] Failed to fetch photos for room ${reservation.roomInfo}:`,
              error
            );
            toast({
              title: '사진 로드 실패',
              description:
                '예약 사진을 불러오지 못했습니다. 기본 이미지를 표시합니다.',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
            return { 
              ...reservation, 
              photoUrl: '/assets/default-room1.jpg',
              latitude: reservation.latitude || null,
              longitude: reservation.longitude || null
            };
          }
        })
      );

      setReservations(reservationsWithPhotos);
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

  const paginate = (newDirection) => {
    if (newDirection === 1 && currentIndex < reservations.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDirection(1);
    } else if (newDirection === -1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDirection(-1);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => paginate(1),
    onSwipedRight: () => paginate(-1),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      zIndex: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      zIndex: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      zIndex: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
      },
    }),
  };

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      position="relative"
      overflow="hidden"
    >
      {/* 상단 헤더 */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        zIndex={1000}
        boxShadow="sm"
      >
        <Container 
          maxW="container.sm" 
          px={{ base: 3, sm: 4 }}
          py={3}
        >
          <Flex align="center" justify="space-between">
            {currentIndex > 0 ? (
              <IconButton
                icon={<ArrowBackIcon />}
                variant="ghost"
                onClick={() => paginate(-1)}
                aria-label="이전 예약"
              />
            ) : (
              <IconButton
                icon={<ArrowBackIcon />}
                variant="ghost"
                onClick={() => navigate('/')}
                aria-label="홈으로"
              />
            )}
            <Text
              fontSize="lg"
              fontWeight="700"
              color="gray.900"
            >
              예약 내역
            </Text>
            <Box w="40px" />
          </Flex>
        </Container>
      </Box>

      {/* 메인 컨텐츠 */}
      <Box
        pt="65px"
        minH="100vh"
        position="relative"
      >
        <Container 
          maxW="container.sm"
          px={{ base: 2, sm: 3 }}
          py={2}
        >
          <VStack spacing={4} align="stretch">
            {reservations.length > 0 && (
              <Flex justify="space-between" align="center" px={1}>
                <Text fontSize="sm" color="gray.600">
                  총 {reservations.length}건의 예약
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {currentIndex + 1} / {reservations.length}
                </Text>
              </Flex>
            )}

            {isLoading ? (
              <Flex justify="center" align="center" minH="500px">
                <Spinner size="lg" color="blue.500" thickness="3px" />
              </Flex>
            ) : reservations.length === 0 ? (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                minH="500px"
                p={6}
                bg="white"
                borderRadius="lg"
                boxShadow="sm"
              >
                <Text color="gray.500" fontSize="lg" mb={4}>
                  예약 내역이 없습니다
                </Text>
                <Button
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  숙소 둘러보기
                </Button>
              </Flex>
            ) : (
              <Box
                {...handlers}
                h={{ base: "calc(100vh - 140px)", sm: "calc(100vh - 160px)" }}
                position="relative"
                overflow="hidden"
                mt={2}
              >
                <AnimatePresence initial={false} custom={direction}>
                  <MotionBox
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    position="absolute"
                    width="100%"
                    height="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box
                      w="100%"
                      h="100%"
                      maxH={{ base: "calc(100vh - 180px)", sm: "calc(100vh - 200px)" }}
                      position="relative"
                      transform="perspective(1000px)"
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <Box
                        position="relative"
                        h="100%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        px={{ base: 2, sm: 3 }}
                        py={{ base: 3, sm: 4 }}
                      >
                        <Box
                          w="100%"
                          maxW={{ base: "100%", sm: "460px" }}
                          mx="auto"
                          h="100%"
                          overflow="auto"
                          sx={{
                            '&::-webkit-scrollbar': {
                              width: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                              width: '6px',
                              background: 'rgba(0, 0, 0, 0.1)',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '24px',
                            },
                          }}
                        >
                          <Box px={{ base: 2, sm: 3 }} py={{ base: 2, sm: 3 }}>
                            <ReservationCard
                              reservation={reservations[currentIndex]}
                              onCancel={() => handleCancel(reservations[currentIndex]._id)}
                            />
                          </Box>
                        </Box>
                      </Box>
                      {/* 다음 카드 프리뷰 */}
                      {currentIndex < reservations.length - 1 && (
                        <Box
                          position="absolute"
                          top="50%"
                          left={0}
                          right={0}
                          transform="translateY(-50%) translateX(97%) scale(0.95) rotateY(-10deg)"
                          height="90%"
                          bg="white"
                          borderRadius="lg"
                          boxShadow="lg"
                          opacity={0.5}
                          zIndex={-1}
                        />
                      )}
                      {/* 이전 카드 프리뷰 */}
                      {currentIndex > 0 && (
                        <Box
                          position="absolute"
                          top="50%"
                          left={0}
                          right={0}
                          transform="translateY(-50%) translateX(-97%) scale(0.95) rotateY(10deg)"
                          height="90%"
                          bg="white"
                          borderRadius="lg"
                          boxShadow="lg"
                          opacity={0.5}
                          zIndex={-1}
                        />
                      )}
                    </Box>
                  </MotionBox>
                </AnimatePresence>
              </Box>
            )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default ReservationHistory;