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
  Select,
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
  const [sortOption, setSortOption] = useState('latest');

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
    return new Date() < checkOutDate && !res.isCancelled;
  }, []);

  const isPastReservation = useCallback((res) => {
    const checkOutDate = new Date(res.checkOut);
    checkOutDate.setHours(11, 0, 0, 0);
    return new Date() >= checkOutDate || res.isCancelled;
  }, []);

  const sortReservations = (reservations, sortOption) => {
    switch (sortOption) {
      case 'latest':
        return [...reservations].sort(
          (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
        );
      case 'checkIn':
        return [...reservations].sort(
          (a, b) => new Date(a.checkIn) - new Date(b.checkIn)
        );
      case 'checkOut':
        return [...reservations].sort(
          (a, b) => new Date(a.checkOut) - new Date(b.checkOut)
        );
      default:
        return reservations;
    }
  };

  const fetchRawHistory = useCallback(async () => {
    rawHistoryRef.current = null;
    const resp = await getReservationHistory();
    console.log('[ReservationHistory] Fetched raw history:', resp.history);
    rawHistoryRef.current = (resp.history || []).sort(
      (a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)
    );
    return rawHistoryRef.current;
  }, []);

  const enrichReservations = useCallback(
    async (reservations) => {
      const hotelIds = [...new Set(reservations.map((r) => r.hotelId))];
  
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
  
      const enriched = await Promise.all(
        reservations.map(async (r) => {
          if (!r || !r.reservationId) {
            console.warn('[enrichReservations] Skipping invalid reservation:', r);
            return null;
          }
  
          const settings = await settingsCache.current[r.hotelId];
          let photoUrl = r.photoUrl;
  
          if (!photoUrl || photoUrl === '/assets/default-room1.jpg') {
            const cacheKey = `${r.hotelId}::${r.roomInfo}`;
            if (!photosCache.current[cacheKey]) {
              try {
                photosCache.current[cacheKey] = await fetchHotelPhotos(
                  r.hotelId,
                  'room',
                  r.roomInfo
                );
              } catch (err) {
                console.error(
                  `Failed to fetch photos for hotel ${r.hotelId}, room ${r.roomInfo}:`,
                  err
                );
                photosCache.current[cacheKey] = { roomPhotos: [] };
              }
            }
            photoUrl =
              photosCache.current[cacheKey]?.roomPhotos?.[0]?.photoUrl ||
              '/assets/default-room1.jpg';
            console.log(
              `[ReservationHistory] Processed reservation ID ${r.reservationId}:`,
              {
                photoUrlFromServer: r.photoUrl,
                photoUrlFromAPI:
                  photosCache.current[cacheKey]?.roomPhotos?.[0]?.photoUrl,
                finalPhotoUrl: photoUrl,
              }
            );
          }
  
          return {
            ...r,
            _id: r.reservationId, // 서버에서 제공된 reservationId 사용
            photoUrl,
            hotelPhoneNumber:
              settings?.phoneNumber || r.hotelPhoneNumber || '연락처 준비중',
            isConfirmed: isReservationConfirmed(r),
            discount: r.discount || 0,
            fixedDiscount: r.fixedDiscount || 0,
            discountType: r.discountType || null,
            eventName: r.eventName || null,
          };
        })
      );
  
      // 유효한 예약만 필터링
      return enriched.filter((reservation) => reservation !== null);
    },
    [isReservationConfirmed]
  );

  const loadHistory = useCallback(async () => {
    setIsLoadingActive(true);
    try {
      const sorted = await fetchRawHistory();
      const enriched = await enrichReservations(sorted);

      const filtered = enriched.filter(
        (r) => !deletedReservationIds.includes(r.reservationId)
      );
      const active = filtered.filter(isActiveReservation);
      const sortedActive = sortReservations(active, sortOption);
      setActiveReservations(sortedActive);
      saveActiveReservationsToCache(sortedActive);

      if (showPastReservations && pastLoaded) {
        const past = filtered.filter(isPastReservation);
        setPastReservations(past);
      }
    } catch (err) {
      toast({
        title: '예약 내역 로드 실패',
        description: err.message || '예약 내역을 불러오지 못했습니다.',
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
    showPastReservations,
    toast,
    fetchRawHistory,
    sortOption,
  ]);

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
        description: err.message || '과거 예약을 불러오지 못했습니다.',
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
        const updated = activeReservations.filter((r) => r.reservationId !== id);
        setActiveReservations(updated);
        saveActiveReservationsToCache(updated);
        rawHistoryRef.current = null;
        await loadHistory();
      } catch (err) {
        toast({
          title: '예약 취소 실패',
          description: err.message || '예약 취소를 실패했습니다.',
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
    const updatedActive = activeReservations.filter((r) => r.reservationId !== id);
    setActiveReservations(updatedActive);
    saveActiveReservationsToCache(updatedActive);
    const updatedPast = pastReservations.filter((r) => r.reservationId !== id);
    setPastReservations(updatedPast);
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
    const updatedActive = activeReservations.filter(
      (r) => !pastIds.includes(r.reservationId)
    );
    setActiveReservations(updatedActive);
    saveActiveReservationsToCache(updatedActive);
    setPastReservations([]);
    setShowPastReservations(false);
    setPastLoaded(false);
  };

  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    const sortedActive = sortReservations(activeReservations, newSortOption);
    setActiveReservations(sortedActive);
    saveActiveReservationsToCache(sortedActive);
  };

  useEffect(() => {
    const cached = localStorage.getItem('activeReservations');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const hasInvalidPhotos = parsed.some(
          (r) => !r.photoUrl || r.photoUrl === '/assets/default-room1.jpg'
        );
        if (hasInvalidPhotos) {
          console.log(
            '[ReservationHistory] Invalid photos in cache, refreshing data'
          );
          loadHistory();
        } else {
          const sorted = sortReservations(parsed, sortOption);
          setActiveReservations(sorted);
          console.log('[ReservationHistory] Loaded from cache:', sorted);
        }
      } catch (err) {
        console.error('Failed to parse cached active reservations:', err);
        loadHistory();
      }
    } else {
      loadHistory();
    }

    if (location.state?.newReservationId) {
      loadHistory();
    }
  }, [loadHistory, sortOption, location.state]);

  useEffect(() => {
    if (showPastReservations && !pastLoaded) {
      loadPastReservations();
    }
  }, [showPastReservations, pastLoaded, loadPastReservations]);

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
      rawHistoryRef.current = null;
      loadHistory();
    });
    return () => socket.off?.('reservationUpdated');
  }, [customer, loadHistory, socket, toast]);

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

      <Box
        pt="64px"
        pb="80px"
        flex="1"
        maxH="calc(100vh - 124px)"
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
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color="teal.600">
                  활성화된 예약
                </Text>
                <Select
                  width="150px"
                  size="sm"
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="latest">최신 예약순</option>
                  <option value="checkIn">체크인 날짜순</option>
                  <option value="checkOut">체크아웃 날짜순</option>
                </Select>
              </Flex>
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