// webapp/src/pages/ReservationHistory.js
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
import { keyframes } from '@chakra-ui/system'; // keyframes를 @chakra-ui/system에서 import
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import useSocket from '../hooks/useSocket';
import ReservationCard from '../components/ReservationCard';
import { getReservationHistory, cancelReservation } from '../api/api';
import { motion } from 'framer-motion'; // 애니메이션 추가를 위해 framer-motion 사용
import { useSwipeable } from 'react-swipeable'; // 스와이프 제스처 추가

const MotionBox = motion(Box);

// 화살표 깜빡임 애니메이션
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
      // response는 { history: [...], totalVisits: number } 형태
      const sortedReservations = (response.history || []).sort(
        (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
      ); // 최신 예약이 먼저 오도록 정렬
      setReservations(sortedReservations);
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

  // 캐러셀 이동 핸들러
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

  // 스와이프 제스처 핸들러
  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true,
  });

  return (
    <Container maxW="container.sm" py={6}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="teal.500" textAlign="center">
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
          <Box position="relative">
            {/* 왼쪽 화살표 */}
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
            {/* 캐러셀 컨테이너 */}
            <Box
              {...handlers}
              overflow="hidden"
              width="100%"
              position="relative"
              height="auto"
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
                      scale: currentIndex === idx ? 1.05 : 1, // 현재 카드 강조
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
            {/* 오른쪽 화살표 */}
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
            {/* 인디케이터 (Dot) */}
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
        <Button colorScheme="gray" variant="outline" onClick={() => navigate('/')} w="full">
          홈으로 돌아가기
        </Button>
      </VStack>
    </Container>
  );
};

export default ReservationHistory;