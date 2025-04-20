import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const toast = useToast();
  const { customer } = useAuth();
  const socket = useSocket();
  const [activeReservations, setActiveReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [pastLoaded, setPastLoaded] = useState(false);
  const [deletedReservationIds, setDeletedReservationIds] = useState(() => {
    const stored = localStorage.getItem('deletedReservations');
    return stored ? JSON.parse(stored) : [];
  });

  // 캐시 저장을 위한 useRef
  const settingsCache = useRef({});
  const photosCache = useRef({});
  const rawHistoryRef = useRef(null);

  const saveDeletedReservations = (ids) => {
    localStorage.setItem('deletedReservations', JSON.stringify(ids));
    setDeletedReservationIds(ids);
  };

  const saveActiveReservationsToCache = (reservations) => {
    localStorage.setItem('activeReservations', JSON.stringify(reservations));
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

  // 히스토리 데이터 가져오기 (캐싱)
  const fetchRawHistory = useCallback(async () => {
    if (!rawHistoryRef.current) {
      const resp = await getReservationHistory();
      rawHistoryRef.current = (resp.history || []).sort(
        (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
      );
    }
    return rawHistoryRef.current;
  }, []);

  // 데이터 로드 및 캐싱 처리
  const enrichReservations = useCallback(
    async (reservations) => {
      // 1) 고유 hotelId 리스트
      const hotelIds = [...new Set(reservations.map((r) => r.hotelId))];

      // 2) hotel settings 한 번씩만 패치
      await Promise.all(
        hotelIds.map((hid) =>
          settingsCache.current[hid] ||
          (settingsCache.current[hid] = fetchCustomerHotelSettings(hid).catch(
            (err) => {
              console.error(`Failed to fetch settings for hotel ${hid}:`, err);
              return {};
            }
          ))
        )
      );

      // 3) 고유 photoKey 리스트 (hotelId + roomInfo)
      const photoKeys = [
        ...new Set(reservations.map((r) => `${r.hotelId}::${r.roomInfo}`)),
      ];

      // 4) 사진도 한 번씩만 패치
      await Promise.all(
        photoKeys.map((key) => {
          if (photosCache.current[key]) return photosCache.current[key];
          const [hid, roomInfo] = key.split('::');
          return (photosCache.current[key] = fetchHotelPhotos(
            hid,
            'room',
            roomInfo
          ).catch((err) => {
            console.error(
              `Failed to fetch photos for hotel ${hid}, room ${roomInfo}:`,
              err
            );
            return { roomPhotos: [] };
          }));
        })
      );

      // 5) enrichment: 예약 데이터에 추가 정보 병합
      const enriched = reservations.map((r) => {
        const settings = settingsCache.current[r.hotelId] || {};
        const photos = photosCache.current[`${r.hotelId}::${r.roomInfo}`] || {};
        return {
          ...r,
          photoUrl:
            photos.roomPhotos?.[0]?.photoUrl || '/assets/default-room1.jpg',
          hotelPhoneNumber:
            settings.phoneNumber || r.hotelPhoneNumber || '연락처 준비중',
          isConfirmed: isReservationConfirmed(r),
          discount: r.couponInfo?.discount || 0,
          eventName: r.couponInfo?.eventName || null,
        };
      });

      return enriched;
    },
    [isReservationConfirmed]
  );

  const loadHistory = useCallback(async () => {
    setIsLoadingActive(true);
    try {
      const sorted = await fetchRawHistory();
      const enriched = await enrichReservations(sorted);

      // 필터링 및 상태 업데이트
      const filtered = enriched.filter(
        (r) => !deletedReservationIds.includes(r.reservationId)
      );
      const active = filtered.filter(isActiveReservation);
      setActiveReservations(
        active.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
      );
      saveActiveReservationsToCache(active); // 캐시에 저장

      // 과거 예약은 이미 로드된 경우에만 업데이트
      if (pastLoaded) {
        const past = filtered.filter(isPastReservation);
        setPastReservations(past);
      }
    } catch (err) {
      toast({
        title: '예약 내역 로드 실패',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingActive(false);
    }
  }, [
    deletedReservationIds,
    isActiveReservation,
    isPastReservation,
    enrichReservations,
    pastLoaded,
    toast,
    fetchRawHistory,
  ]);

  // 과거 예약 로드
  const loadPastReservations = useCallback(async () => {
    setIsLoadingPast(true);
    try {
      const sorted = await fetchRawHistory();
      const enriched = await enrichReservations(sorted);

      const filtered = enriched.filter(
        (r) => !deletedReservationIds.includes(r.reservationId)
      );
      const past = filtered.filter(isPastReservation);
      setPastReservations(past);
      setPastLoaded(true);
    } catch (err) {
      toast({
        title: '과거 예약 로드 실패',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingPast(false);
    }
  }, [deletedReservationIds, isPastReservation, enrichReservations, toast, fetchRawHistory]);

  const handleCancel = useCallback(
    async (id) => {
      setIsLoadingActive(true);
      try {
        await cancelReservation(id);
        toast({
          title: '예약 취소 완료',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // 캐시 및 상태 업데이트
        const updated = activeReservations.filter((r) => r.reservationId !== id);
        setActiveReservations(updated);
        saveActiveReservationsToCache(updated);
        rawHistoryRef.current = null; // 캐시 무효화
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
        setIsLoadingActive(false);
      }
    },
    [loadHistory, toast, activeReservations]
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
    // 활성화된 예약에서도 제거 (과거 예약이 활성화된 예약일 수도 있으므로)
    const updatedActive = activeReservations.filter((r) => r.reservationId !== id);
    setActiveReservations(updatedActive);
    saveActiveReservationsToCache(updatedActive);
    rawHistoryRef.current = null; // 캐시 무효화
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
    // 활성화된 예약에서도 과거 예약 ID 제거
    const updatedActive = activeReservations.filter(
      (r) => !pastIds.includes(r.reservationId)
    );
    setActiveReservations(updatedActive);
    saveActiveReservationsToCache(updatedActive);
    setShowPastReservations(false);
    setPastLoaded(false);
    rawHistoryRef.current = null; // 캐시 무효화
    loadHistory();
  };

  // 초기 로드: 캐시에서 활성화된 예약 불러오기
  useEffect(() => {
    const cached = localStorage.getItem('activeReservations');
    if (cached) {
      try {
        setActiveReservations(JSON.parse(cached));
      } catch (err) {
        console.error('Failed to parse cached active reservations:', err);
      }
    }
    // 백그라운드에서 최신 데이터 로드
    loadHistory();
  }, [loadHistory]);

  // "과거 예약 보기" 버튼 클릭 시 과거 예약 로드
  useEffect(() => {
    if (showPastReservations && !pastLoaded) {
      loadPastReservations();
    }
  }, [showPastReservations, pastLoaded, loadPastReservations]);

  // WebSocket 이벤트 처리
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
      rawHistoryRef.current = null; // 캐시 무효화
      loadHistory();
    });
    return () => socket.off?.('reservationUpdated');
  }, [customer, loadHistory, socket, toast]);

  // 현재 페이지가 히스토리 페이지인지 확인
  const isOnHistoryPage = location.pathname === '/history';

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
        pt="64px" // 상단바 높이
        pb="80px" // 하단바 높이 + 추가 패딩
        flex="1"
        maxH="calc(100vh - 124px)" // 전체 높이에서 상단바(64px)와 하단바(60px)를 뺀 값
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
          {isLoadingActive && activeReservations.length === 0 ? (
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
              {activeReservations.length > 0 || pastReservations.length > 0 ? (
                <Box mb={4}>
                  <Button
                    colorScheme="gray"
                    variant="outline"
                    onClick={() => setShowPastReservations((prev) => !prev)}
                    w="full"
                    isLoading={isLoadingPast}
                    spinnerPlacement="end"
                  >
                    {showPastReservations ? '과거 예약 숨기기' : '과거 예약 보기'}
                  </Button>
                </Box>
              ) : null}

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
            <Button variant="ghost" onClick={() => navigate('/')}>
              홈
            </Button>
            <Button variant="ghost" onClick={() => navigate('/rooms')}>
              숙소
            </Button>
            <Button variant="ghost" onClick={() => navigate('/logout')}>
              로그아웃
            </Button>
            <Button
              variant="ghost"
              onClick={() => !isOnHistoryPage && loadHistory()}
              isDisabled={isOnHistoryPage}
              isLoading={isLoadingActive && isOnHistoryPage}
            >
              나의 내역
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default ReservationHistory;