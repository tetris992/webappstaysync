import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Text,
  Spinner,
  Box,
  useToast,
  Flex,
  IconButton,
  Button,
  Collapse,
  VStack,
} from '@chakra-ui/react';
import { ArrowBackIcon, DeleteIcon } from '@chakra-ui/icons';
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
  const [activeReservations, setActiveReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [deletedReservationIds, setDeletedReservationIds] = useState(() => {
    const stored = localStorage.getItem('deletedReservations');
    return stored ? JSON.parse(stored) : [];
  });

  const saveDeletedReservations = (ids) => {
    localStorage.setItem('deletedReservations', JSON.stringify(ids));
    setDeletedReservationIds(ids);
  };

  const isReservationConfirmed = useCallback((res) => {
    const chkIn = new Date(res.checkIn);
    chkIn.setHours(14, 0, 0, 0);
    return new Date() >= chkIn;
  }, []);

  const isActiveReservation = useCallback((res) => {
    const checkOutDate = new Date(res.checkOut);
    checkOutDate.setHours(11, 0, 0, 0);
    return new Date() < checkOutDate;
  }, []);

  const isPastReservation = useCallback((res) => {
    const checkOutDate = new Date(res.checkOut);
    checkOutDate.setHours(11, 0, 0, 0);
    return new Date() > checkOutDate;
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await getReservationHistory();
      const sorted = (resp.history || []).sort(
        (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
      );

      const enriched = await Promise.all(
        sorted.map(async (r) => {
          try {
            const [photosData, settings] = await Promise.all([
              fetchHotelPhotos(r.hotelId, 'room', r.roomInfo),
              fetchCustomerHotelSettings(r.hotelId),
            ]);

            return {
              ...r,
              photoUrl:
                photosData?.roomPhotos?.[0]?.photoUrl ||
                '/assets/default-room1.jpg',
              hotelPhoneNumber:
                settings?.phoneNumber || r.hotelPhoneNumber || '연락처 준비중',
              isConfirmed: isReservationConfirmed(r),
              discount: r.couponInfo?.discount || 0,
              eventName: r.couponInfo?.eventName || null,
            };
          } catch {
            return {
              ...r,
              photoUrl: '/assets/default-room1.jpg',
              hotelPhoneNumber: r.hotelPhoneNumber || '연락처 준비중',
              isConfirmed: isReservationConfirmed(r),
              discount: r.couponInfo?.discount || 0,
              eventName: r.couponInfo?.eventName || null,
            };
          }
        })
      );

      const filtered = enriched.filter(
        (r) => !deletedReservationIds.includes(r.reservationId)
      );
      const active = filtered.filter(isActiveReservation);
      const past = filtered.filter(isPastReservation);

      setActiveReservations(
        active.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
      );
      setPastReservations(past);
    } catch (err) {
      toast({
        title: '예약 내역 로드 실패',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    deletedReservationIds,
    isActiveReservation,
    isPastReservation,
    isReservationConfirmed,
    toast,
  ]);

  const handleCancel = useCallback(
    async (id) => {
      setIsLoading(true);
      try {
        await cancelReservation(id);
        toast({
          title: '예약 취소 완료',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadHistory();
      } catch (err) {
        toast({
          title: '예약 취소 실패',
          description: err.message,
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

  const handleDeleteReservation = (id) => {
    const updated = [...deletedReservationIds, id];
    saveDeletedReservations(updated);
    toast({
      title: '과거 예약 삭제',
      description: '과거 예약이 삭제되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    loadHistory();
  };

  const handleDeleteAllPastReservations = () => {
    const pastIds = pastReservations.map((r) => r.reservationId);
    saveDeletedReservations([...deletedReservationIds, ...pastIds]);
    toast({
      title: '모든 과거 예약 삭제',
      description: '모든 과거 예약이 삭제되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setShowPastReservations(false);
    loadHistory();
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!socket?.emit || !customer?._id) return;
    socket.emit('subscribeToReservationUpdates', customer._id);
    socket.on('reservationUpdated', (upd) => {
      toast({
        title: '예약 상태 변경',
        description: `예약 ${upd.reservationId} 상태가 변경되었습니다.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      loadHistory();
    });
    return () => socket.off?.('reservationUpdated');
  }, [customer, loadHistory, socket, toast]);

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      flexDirection="column"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflow="hidden"
    >
      {/* 상단바 */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bg="white"
        borderBottom="1px"
        borderColor="gray.200"
        py={4}
        zIndex={1000}
      >
        <Container maxW="container.sm">
          <Flex align="center" justify="center" position="relative">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              position="absolute"
              left={0}
              onClick={() => navigate('/')}
              aria-label="홈으로"
            />
            <Text fontSize="xl" fontWeight="bold">
              My History
            </Text>
          </Flex>
        </Container>
      </Box>

      {/* 본문 영역 */}
      <Box
        pt="64px"
        pb="60px"
        flex="1"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.200',
            borderRadius: '24px',
          },
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Container maxW="container.sm" py={4}>
          {isLoading ? (
            <Flex
              justify="center"
              align="center"
              h="200px"
              flexDirection="column"
            >
              <Spinner size="lg" color="teal.500" thickness="4px" />
              <Text mt={4} color="gray.500">
                예약 내역을 불러오는 중입니다...
              </Text>
            </Flex>
          ) : (
            <>
              {/* 활성화된 예약 */}
              <Text fontSize="lg" fontWeight="bold" mb={4} color="teal.600">
                활성화된 예약
              </Text>
              {activeReservations.length > 0 ? (
                <VStack spacing={6} mb={4}>
                  {activeReservations.map((r) => (
                    <ReservationCard
                      key={r._id}
                      reservation={r}
                      onCancelReservation={handleCancel}
                      isConfirmed={r.isConfirmed}
                    />
                  ))}
                </VStack>
              ) : (
                <Text textAlign="center" color="gray.500" mb={4}>
                  활성화된 예약이 없습니다.
                </Text>
              )}

              {/* 과거 예약 보기 버튼 */}
              {pastReservations.length > 0 && (
                <Button
                  colorScheme="gray"
                  variant="outline"
                  onClick={() => setShowPastReservations((prev) => !prev)}
                  mb={4}
                >
                  {showPastReservations ? '과거 예약 숨기기' : '과거 예약 보기'}
                </Button>
              )}

              {/* 과거 예약 */}
              <Collapse in={showPastReservations} animateOpacity>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.600">
                    과거 예약
                  </Text>
                  {pastReservations.length > 0 && (
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={handleDeleteAllPastReservations}
                    >
                      모두 삭제
                    </Button>
                  )}
                </Flex>
                {pastReservations.length > 0 ? (
                  <VStack spacing={6} mb={4}>
                    {pastReservations.map((r) => (
                      <Box key={r._id} position="relative" width="100%">
                        <ReservationCard
                          reservation={r}
                          onCancelReservation={handleCancel}
                          isConfirmed={r.isConfirmed}
                          bg="gray.100"
                          opacity={0.8}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          size="sm"
                          position="absolute"
                          top="10px"
                          right="10px"
                          onClick={() =>
                            handleDeleteReservation(r.reservationId)
                          }
                          aria-label="과거 예약 삭제"
                        />
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Text textAlign="center" color="gray.500" mb={4}>
                    과거 예약이 없습니다.
                  </Text>
                )}
              </Collapse>
            </>
          )}
        </Container>
      </Box>

      {/* 하단바 */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px"
        borderColor="gray.200"
        py={2}
        zIndex={1000}
        height="60px"
      >
        <Container maxW="container.sm">
          <Flex justify="space-around">
            <Text>홈</Text>
            <Text>숙소</Text>
            <Text>로그아웃</Text>
            <Text>나의 내역</Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default ReservationHistory;
