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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import useSocket from '../hooks/useSocket';
import ReservationCard from '../components/ReservationCard';
import { getReservationHistory, cancelReservation } from '../api/api';

const ReservationHistory = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const socket = useSocket();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await getReservationHistory();
      setReservations(history);
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

  return (
    <Container maxW="container.sm" py={6}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" color="teal.500" textAlign="center">
          예약 내역
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
          <VStack spacing={4} align="stretch">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation._id}
                reservation={reservation}
                onCancel={handleCancel}
              />
            ))}
          </VStack>
        )}
        <Button colorScheme="gray" variant="outline" onClick={() => navigate('/')} w="full">
          홈으로 돌아가기
        </Button>
      </VStack>
    </Container>
  );
};

export default ReservationHistory;