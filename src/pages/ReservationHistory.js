import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
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
  fetchCustomerHotelSettings,
} from '../api/api';

const ReservationHistory = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const socket = useSocket();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isReservationConfirmed = useCallback((reservation) => {
    const checkInDate = new Date(reservation.checkIn);
    const currentDate = new Date();
    const checkInDeadline = new Date(checkInDate);
    checkInDeadline.setHours(14, 0, 0, 0); // 당일 오후 2시

    return currentDate >= checkInDeadline;
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getReservationHistory();
      console.log('예약 내역 응답:', response);

      const sortedReservations = (response.history || []).sort(
        (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
      );

      const reservationsWithPhotos = await Promise.all(
        sortedReservations.map(async (reservation) => {
          try {
            const [photosData, hotelSettings] = await Promise.all([
              fetchHotelPhotos(
                reservation.hotelId,
                'room',
                reservation.roomInfo
              ),
              fetchCustomerHotelSettings(reservation.hotelId)
            ]);

            console.log(`호텔 ${reservation.hotelId} 설정:`, hotelSettings);

            const photoUrl =
              photosData?.roomPhotos && photosData.roomPhotos.length > 0
                ? photosData.roomPhotos[0].photoUrl
                : '/assets/default-room1.jpg';

            // 호텔 설정에서 전화번호를 가져오거나, 예약 데이터의 전화번호를 사용
            const hotelPhoneNumber = hotelSettings?.phoneNumber || reservation.phoneNumber || '연락처 준비중';

            console.log(`호텔 ${reservation.hotelId} 최종 전화번호:`, hotelPhoneNumber);

            const updatedReservation = { 
              ...reservation, 
              photoUrl,
              isConfirmed: isReservationConfirmed(reservation),
              latitude: reservation.latitude || null,
              longitude: reservation.longitude || null,
              hotelPhoneNumber
            };

            console.log(`호텔 ${reservation.hotelId} 최종 데이터:`, updatedReservation);
            return updatedReservation;
          } catch (error) {
            console.error(
              `[ReservationHistory] Failed to fetch hotel data for ${reservation.hotelId}:`,
              error
            );
            return { 
              ...reservation, 
              photoUrl: '/assets/default-room1.jpg',
              isConfirmed: isReservationConfirmed(reservation),
              latitude: reservation.latitude || null,
              longitude: reservation.longitude || null,
              hotelPhoneNumber: reservation.phoneNumber || '연락처 준비중'
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
  }, [toast, isReservationConfirmed]);

  const handleCancel = useCallback(
    async (reservationId) => {
      try {
        setIsLoading(true);
        await cancelReservation(reservationId);
        toast({
          title: '예약 취소 완료',
          description: '예약이 성공적으로 취소되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadHistory();
      } catch (error) {
        console.error('예약 취소 실패:', error);
        toast({
          title: '예약 취소 실패',
          description: error.message || '예약 취소에 실패했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
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
    <Box
      minH="100vh"
      bg="gray.50"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      display="flex"
      flexDirection="column"
      w="100%"
    >
      {/* 헤더 */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        width="100%"
        py={4}
      >
        <Container maxW="container.sm">
          <Flex align="center" justify="center" position="relative">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              position="absolute"
              left={0}
              onClick={() => navigate('/')}
              aria-label="홈으로 가기"
            />
            <Text
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="bold"
              textAlign="center"
            >
              MY HISTORY
            </Text>
          </Flex>
        </Container>
      </Box>

      {/* 스크롤되는 본문 영역 */}
      <Box
        flex={1}
        overflowY="auto"
        sx={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.300',
            borderRadius: '24px',
          },
        }}
      >
        <Container
          maxW={{ base: "100%", sm: "95%", md: "container.md" }}
          py={{ base: 4, sm: 6 }}
          px={{ base: 4, sm: 6 }}
        >
          <VStack
            spacing={4}
            align="stretch"
            w="100%"
            pb={{ base: "90px", md: "100px" }}
          >
            {isLoading ? (
              <Flex justify="center" py={8}>
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : reservations.length > 0 ? (
              reservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onCancelReservation={handleCancel}
                  isConfirmed={reservation.isConfirmed}
                />
              ))
            ) : (
              <VStack spacing={4} py={8}>
                <Text color="gray.500" textAlign="center">
                  예약 내역이 없습니다.
                </Text>
              </VStack>
            )}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default ReservationHistory;