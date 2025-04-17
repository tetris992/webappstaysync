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
  Button,
  Collapse,
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
  const [showPastReservations, setShowPastReservations] = useState(false); // 과거 예약 표시 여부
  const [deletedReservationIds, setDeletedReservationIds] = useState(() => {
    // 로컬 스토리지에서 삭제된 예약 ID 불러오기
    const stored = localStorage.getItem('deletedReservations');
    return stored ? JSON.parse(stored) : [];
  });

  // 삭제된 예약 ID를 로컬 스토리지에 저장
  const saveDeletedReservations = (ids) => {
    localStorage.setItem('deletedReservations', JSON.stringify(ids));
    setDeletedReservationIds(ids);
  };

  // 체크인 당일 14시 이후면 확정 (히스토리 화면에서 표시용)
  const isReservationConfirmed = useCallback((res) => {
    const chkIn = new Date(res.checkIn);
    chkIn.setHours(14, 0, 0, 0);
    return new Date() >= chkIn;
  }, []);

  // 활성화된 예약 판단: 체크아웃 시간(오전 11시)까지 활성화 유지
  const isActiveReservation = useCallback((res) => {
    const checkOutDate = new Date(res.checkOut);
    checkOutDate.setHours(11, 0, 0, 0); // 체크아웃 시간 오전 11시 설정
    const currentDate = new Date();
    return currentDate < checkOutDate; // 체크아웃 시간 이전이면 활성화
  }, []);

  // 과거 예약 판단: 체크아웃 시간이 현재 시간보다 이전
  const isPastReservation = useCallback((res) => {
    const checkOutDate = new Date(res.checkOut);
    checkOutDate.setHours(11, 0, 0, 0); // 체크아웃 시간 오전 11시 설정
    const currentDate = new Date();
    return currentDate > checkOutDate; // 체크아웃 시간이 지났으면 과거 예약
  }, []);

  // 히스토리 불러오기
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

            const photoUrl =
              photosData?.roomPhotos?.[0]?.photoUrl ||
              '/assets/default-room1.jpg';
            const hotelPhoneNumber =
              settings?.phoneNumber || r.hotelPhoneNumber || '연락처 준비중';

            const discount = r.couponInfo?.discount || 0;
            const eventName = r.couponInfo?.eventName || null;

            return {
              ...r,
              photoUrl,
              hotelPhoneNumber,
              isConfirmed: isReservationConfirmed(r),
              discount,
              eventName,
            };
          } catch (err) {
            console.error('[History] enrichment error', err);
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

      // 삭제된 예약 제외
      const filtered = enriched.filter(
        (r) => !deletedReservationIds.includes(r.reservationId)
      );

      // 활성화된 예약과 과거 예약으로 분리
      const active = filtered.filter((r) => isActiveReservation(r));
      const past = filtered.filter((r) => isPastReservation(r));

      // 활성화된 예약을 체크인 날짜 기준으로 정렬 (가장 가까운 순)
      const sortedActive = active.sort((a, b) => {
        const checkInA = new Date(a.checkIn);
        const checkInB = new Date(b.checkIn);
        return checkInA - checkInB; // 체크인 날짜가 가까운 순으로 정렬
      });

      setActiveReservations(sortedActive);
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
    isReservationConfirmed,
    isActiveReservation,
    isPastReservation,
    toast,
    deletedReservationIds,
  ]);

  // 취소 핸들러
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

  // 개별 과거 예약 삭제
  const handleDeleteReservation = (id) => {
    const updatedDeletedIds = [...deletedReservationIds, id];
    saveDeletedReservations(updatedDeletedIds);
    toast({
      title: '과거 예약 삭제',
      description: '과거 예약이 삭제되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    loadHistory();
  };

  // 모든 과거 예약 삭제
  const handleDeleteAllPastReservations = () => {
    const pastIds = pastReservations.map((r) => r.reservationId);
    const updatedDeletedIds = [...deletedReservationIds, ...pastIds];
    saveDeletedReservations(updatedDeletedIds);
    toast({
      title: '모든 과거 예약 삭제',
      description: '모든 과거 예약이 삭제되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setShowPastReservations(false); // 과거 예약 섹션 숨김
    loadHistory();
  };

  // 최초 로드
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 소켓 구독
  useEffect(() => {
    if (!socket || typeof socket.emit !== 'function' || !customer?._id) return;

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

    return () => {
      if (socket.off) socket.off('reservationUpdated');
    };
  }, [socket, customer, toast, loadHistory]);

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

      {/* 본문 영역 - 스크롤 가능 */}
      <Box
        pt="64px" // 상단바 높이 (py={4}로 인해 64px로 가정)
        pb="60px" // 하단바 높이 (가정)
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
        <Container maxW="container.sm" py={4}>
          {isLoading ? (
            <Flex justify="center" align="center" h="200px" flexDirection="column">
              <Spinner size="lg" color="teal.500" thickness="4px" />
              <Text mt={4} color="gray.500">
                예약 내역을 불러오는 중입니다...
              </Text>
            </Flex>
          ) : (
            <VStack spacing={8} align="stretch">
              {/* 활성화된 예약 섹션 */}
              <Box
                bg="white"
                rounded="lg"
                shadow="sm"
                p={4}
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontSize="lg" fontWeight="bold" mb={4} color="teal.600">
                  활성화된 예약
                </Text>
                {activeReservations.length > 0 ? (
                  <VStack spacing={6}>
                    {activeReservations.map((r) => (
                      <ReservationCard
                        key={r.reservationId}
                        reservation={r}
                        onCancelReservation={handleCancel}
                        isConfirmed={r.isConfirmed}
                      />
                    ))}
                  </VStack>
                ) : (
                  <Text textAlign="center" color="gray.500">
                    활성화된 예약이 없습니다.
                  </Text>
                )}
              </Box>

              {/* 과거 예약 보기 버튼 */}
              {pastReservations.length > 0 && (
                <Button
                  colorScheme="gray"
                  variant="outline"
                  onClick={() => setShowPastReservations(!showPastReservations)}
                  mb={4}
                >
                  {showPastReservations ? '과거 예약 숨기기' : '과거 예약 보기'}
                </Button>
              )}

              {/* 과거 예약 섹션 - 토글로 표시 */}
              <Collapse in={showPastReservations} animateOpacity>
                <Box
                  bg="gray.50"
                  rounded="lg"
                  shadow="sm"
                  p={4}
                  border="1px solid"
                  borderColor="gray.300"
                >
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
                    <VStack spacing={6}>
                      {pastReservations.map((r) => (
                        <Box key={r.reservationId} position="relative" width="100%">
                          <ReservationCard
                            reservation={r}
                            onCancelReservation={handleCancel}
                            isConfirmed={r.isConfirmed}
                            bg="gray.100" // 회색 톤 적용
                            opacity={0.8} // 약간 투명하게
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            size="sm"
                            position="absolute"
                            top="10px"
                            right="10px"
                            onClick={() => handleDeleteReservation(r.reservationId)}
                            aria-label="과거 예약 삭제"
                          />
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text textAlign="center" color="gray.500">
                      과거 예약이 없습니다.
                    </Text>
                  )}
                </Box>
              </Collapse>
            </VStack>
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