import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Image,
  Button,
  useToast,
  Spinner,
  Box,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Flex,
  Icon,
  HStack,
  IconButton,
  Grid,
  Select,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaMapSigns, FaCopy, FaPhone } from 'react-icons/fa';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  createReservation,
  fetchCustomerHotelSettings,
  fetchHotelPhotos,
  fetchHotelList,
  useCoupon as applyCoupon,
} from '../api/api';
import { differenceInCalendarDays, format } from 'date-fns';
import Map from '../components/HotelMap';
import BottomNavigation from '../components/BottomNavigation';

const ReservationConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    customer,
    customerCoupons,
    isCouponsLoading,
    couponsLoadError,
    updateCustomerCouponsAfterUse,
  } = useAuth();

  const [reservationState, setReservationState] = useState({
    hotelId: null,
    hotelInfo: null,
    hotelPhoneNumber: null,
    coordinates: null,
    roomImage: null,
    checkIn: null,
    checkOut: null,
    price: 0,
    originalPrice: 0,
    discount: 0,
    fixedDiscount: 0,
    totalFixedDiscount: 0,
    discountType: null,
    eventName: '',
    eventUuid: '',
    couponDiscount: 0,
    couponFixedDiscount: 0,
    couponTotalFixedDiscount: 0,
    couponCode: null,
    couponUuid: null,
    reservationId: '',
    isLoading: false,
    isMapOpen: false,
    isHotelInfoLoading: true,
    hotelInfoError: null,
  });

  const {
    roomInfo = '',
    checkIn: stateCheckIn = null,
    checkOut: stateCheckOut = null,
    specialRequests = null,
    hotelId: initHotelId,
    price: initPrice,
    originalPrice: initOriginal,
    discount: initDiscount = 0,
    fixedDiscount: initFixedDiscount = 0,
    totalFixedDiscount: initTotalFixedDiscount = 0,
    discountType: initDiscountType = null,
    eventName: initEventName = '',
    eventUuid: initEventUuid = '',
    couponDiscount: initCouponDiscount = 0,
    couponFixedDiscount: initCouponFixedDiscount = 0,
    couponTotalFixedDiscount: initCouponTotalFixedDiscount = 0,
    couponCode: initCouponCode = null,
    couponUuid: initCouponUuid = null,
    numNights: initNumNights = 1,
  } = location.state || {};

  const numNights = useMemo(
    () =>
      stateCheckIn && stateCheckOut
        ? Math.max(
            differenceInCalendarDays(
              new Date(stateCheckOut),
              new Date(stateCheckIn)
            ),
            1
          )
        : initNumNights,
    [stateCheckIn, stateCheckOut, initNumNights]
  );

  const updateReservationState = (updates) => {
    setReservationState((prev) => {
      const newState = { ...prev, ...updates };
      console.log(
        '[ReservationConfirmation] Updated reservationState:',
        newState
      );
      return newState;
    });
  };

  const applicableCoupons = useMemo(() => {
    if (!customerCoupons || !reservationState.hotelId || !roomInfo) {
      return [];
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return customerCoupons.filter(
      (coupon) =>
        coupon.isActive &&
        !coupon.used &&
        String(coupon.hotelId) === String(reservationState.hotelId) &&
        (!coupon.applicableRoomType ||
          coupon.applicableRoomType.toLowerCase() === 'all' ||
          coupon.applicableRoomType.toLowerCase() === roomInfo.toLowerCase()) &&
        coupon.startDate <= todayStr &&
        coupon.endDate >= todayStr
    );
  }, [customerCoupons, reservationState.hotelId, roomInfo]);

  useEffect(() => {
    if (isCouponsLoading) {
      updateReservationState({ isCouponsLoaded: false });
    } else {
      updateReservationState({ isCouponsLoaded: true });
      if (couponsLoadError) {
        toast({
          title: '쿠폰 로드 실패',
          description: couponsLoadError,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      if (
        initCouponUuid &&
        applicableCoupons.some((coupon) => coupon.couponUuid === initCouponUuid)
      ) {
        // 초기 쿠폰 적용 시 할인 계산
        const selectedCoupon = applicableCoupons.find(
          (coupon) => coupon.couponUuid === initCouponUuid
        );
        let newPrice = initOriginal;
        let newCouponDiscount = 0;
        let newCouponFixedDiscount = 0;
        let newCouponTotalFixedDiscount = 0;

        if (initDiscountType === 'fixed' && initTotalFixedDiscount > 0) {
          newPrice = Math.max(0, newPrice - initTotalFixedDiscount);
        } else if (initDiscountType === 'percentage' && initDiscount > 0) {
          newPrice = Math.round(newPrice * (1 - initDiscount / 100));
        } else if (selectedCoupon) {
          if (selectedCoupon.discountType === 'percentage') {
            newCouponDiscount = selectedCoupon.discountValue;
            newPrice = Math.round(newPrice * (1 - newCouponDiscount / 100));
          } else if (selectedCoupon.discountType === 'fixed') {
            newCouponFixedDiscount = selectedCoupon.discountValue;
            newCouponTotalFixedDiscount = newCouponFixedDiscount * numNights;
            newPrice = Math.max(0, newPrice - newCouponTotalFixedDiscount);
          }
        }

        updateReservationState({
          couponUuid: initCouponUuid,
          couponCode: initCouponCode,
          price: newPrice,
          couponDiscount: newCouponDiscount,
          couponFixedDiscount: newCouponFixedDiscount,
          couponTotalFixedDiscount: newCouponTotalFixedDiscount,
        });
      }
    }
  }, [
    isCouponsLoading,
    couponsLoadError,
    applicableCoupons,
    initCouponUuid,
    initCouponCode,
    initOriginal,
    initDiscountType,
    initTotalFixedDiscount,
    initDiscount,
    numNights,
    toast,
  ]);

  const handleCouponChange = useCallback(
    (couponUuid) => {
      const selectedCoupon = customerCoupons.find(
        (coupon) => coupon.couponUuid === couponUuid
      );
      let newPrice = reservationState.originalPrice;
      let newCouponDiscount = 0;
      let newCouponFixedDiscount = 0;
      let newCouponTotalFixedDiscount = 0;
      let newCouponCode = null;
      let newCouponUuid = null;

      if (
        reservationState.discountType === 'fixed' &&
        reservationState.totalFixedDiscount > 0
      ) {
        toast({
          title: '할인 중복 적용 불가',
          description: '이벤트 할인과 쿠폰 할인은 중복 적용할 수 없습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        newPrice = Math.max(0, newPrice - reservationState.totalFixedDiscount);
      } else if (
        reservationState.discountType === 'percentage' &&
        reservationState.discount > 0
      ) {
        toast({
          title: '할인 중복 적용 불가',
          description: '이벤트 할인과 쿠폰 할인은 중복 적용할 수 없습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        newPrice = Math.round(newPrice * (1 - reservationState.discount / 100));
      } else if (selectedCoupon) {
        if (selectedCoupon.discountType === 'percentage') {
          newCouponDiscount = selectedCoupon.discountValue;
          newPrice = Math.round(newPrice * (1 - newCouponDiscount / 100));
        } else if (selectedCoupon.discountType === 'fixed') {
          newCouponFixedDiscount = selectedCoupon.discountValue;
          newCouponTotalFixedDiscount = newCouponFixedDiscount * numNights;
          newPrice = Math.max(0, newPrice - newCouponTotalFixedDiscount);
        }
        newCouponCode = selectedCoupon.code;
        newCouponUuid = selectedCoupon.couponUuid;
      } else {
        // 쿠폰 선택 해제 시 원래 가격 복원
        if (
          reservationState.discountType === 'fixed' &&
          reservationState.totalFixedDiscount > 0
        ) {
          newPrice = Math.max(
            0,
            newPrice - reservationState.totalFixedDiscount
          );
        } else if (
          reservationState.discountType === 'percentage' &&
          reservationState.discount > 0
        ) {
          newPrice = Math.round(
            newPrice * (1 - reservationState.discount / 100)
          );
        }
      }

      updateReservationState({
        price: newPrice,
        couponDiscount: newCouponDiscount,
        couponFixedDiscount: newCouponFixedDiscount,
        couponTotalFixedDiscount: newCouponTotalFixedDiscount,
        couponCode: newCouponCode,
        couponUuid: newCouponUuid,
      });
    },
    [
      customerCoupons,
      reservationState.originalPrice,
      reservationState.discountType,
      reservationState.totalFixedDiscount,
      reservationState.discount,
      numNights,
      toast,
    ]
  );

  const loadHotelInfoAndPhotos = useCallback(
    async (hotelId) => {
      if (!hotelId) {
        updateReservationState({
          hotelInfoError: '호텔 ID가 제공되지 않았습니다.',
          isHotelInfoLoading: false,
        });
        toast({
          title: '호텔 ID 누락',
          description: '호텔 ID가 제공되지 않았습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      try {
        updateReservationState({
          isHotelInfoLoading: true,
          hotelInfoError: null,
        });
        const [hotelList, settings, photosData] = await Promise.all([
          fetchHotelList(),
          fetchCustomerHotelSettings(hotelId, {
            checkIn: stateCheckIn,
            checkOut: stateCheckOut,
          }),
          fetchHotelPhotos(hotelId, 'room', roomInfo),
        ]);

        const hotelData = hotelList.find((h) => h.hotelId === hotelId);
        updateReservationState({
          hotelPhoneNumber: hotelData?.phoneNumber || '연락처 준비중',
          hotelInfo: settings,
        });

        if (settings.latitude && settings.longitude) {
          updateReservationState({
            coordinates: { lat: settings.latitude, lng: settings.longitude },
          });
        } else {
          toast({
            title: '좌표 정보 없음',
            description: '호텔 위치 정보를 불러올 수 없습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }

        const s3PhotoUrl = photosData?.roomPhotos?.[0]?.photoUrl || null;
        updateReservationState({ roomImage: s3PhotoUrl });

        const inTime = settings.checkInTime || '15:00';
        const outTime = settings.checkOutTime || '11:00';
        const inDt = stateCheckIn
          ? new Date(`${stateCheckIn}T${inTime}:00+09:00`)
          : null;
        const outDt = stateCheckOut
          ? new Date(`${stateCheckOut}T${outTime}:00+09:00`)
          : null;
        updateReservationState({ checkIn: inDt, checkOut: outDt });
      } catch (err) {
        console.error('[ReservationConfirmation] load error:', err);
        updateReservationState({
          hotelInfoError:
            err.message || '호텔 정보를 불러오는 중 오류가 발생했습니다.',
          isHotelInfoLoading: false,
        });
        toast({
          title: '호텔 정보 로드 실패',
          description:
            err.message || '호텔 정보를 불러오는 중 오류가 발생했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        updateReservationState({ isHotelInfoLoading: false });
      }
    },
    [roomInfo, stateCheckIn, stateCheckOut, toast]
  );

  useEffect(() => {
    if (!location.state) {
      toast({
        title: '필수 정보 누락',
        description: '예약에 필요한 필수 정보가 누락되었습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/hotels', { replace: true });
      return;
    }

    const requiredFields = {
      initHotelId,
      initPrice,
      initOriginal,
      roomInfo,
    };
    if (
      Object.values(requiredFields).some(
        (field) => field === undefined || field === null
      )
    ) {
      toast({
        title: '필수 정보 누락',
        description: '예약에 필요한 필수 정보가 누락되었습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/hotels', { replace: true });
      return;
    }

    updateReservationState({
      hotelId: initHotelId,
      price: initPrice,
      originalPrice: initOriginal,
      discount: initDiscount,
      fixedDiscount: initFixedDiscount,
      totalFixedDiscount: initTotalFixedDiscount,
      discountType: initDiscountType,
      eventName: initEventName,
      eventUuid: initEventUuid,
      couponDiscount: initCouponDiscount,
      couponFixedDiscount: initCouponFixedDiscount,
      couponTotalFixedDiscount: initCouponTotalFixedDiscount,
      couponCode: initCouponCode,
      couponUuid: initCouponUuid,
    });
    loadHotelInfoAndPhotos(initHotelId);
  }, [
    location.state,
    initHotelId,
    initPrice,
    initOriginal,
    initDiscount,
    initFixedDiscount,
    initTotalFixedDiscount,
    initDiscountType,
    initEventName,
    initEventUuid,
    initCouponDiscount,
    initCouponFixedDiscount,
    initCouponTotalFixedDiscount,
    initCouponCode,
    initCouponUuid,
    roomInfo,
    toast,
    navigate,
    loadHotelInfoAndPhotos,
  ]);

  const handleConfirm = async () => {
    if (!customer) {
      toast({
        title: '인증 오류',
        description: '로그인이 필요합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return navigate('/login');
    }

    let finalPhotoUrl = reservationState.roomImage;
    if (!reservationState.roomImage) {
      try {
        const photosData = await fetchHotelPhotos(
          reservationState.hotelId,
          'room',
          roomInfo
        );
        finalPhotoUrl =
          photosData?.roomPhotos?.[0]?.photoUrl || '/assets/default-room1.jpg';
      } catch (err) {
        finalPhotoUrl = '/assets/default-room1.jpg';
      }
    }

    const finalReservationData = {
      hotelId: reservationState.hotelId,
      siteName: '단잠',
      customerId: customer._id,
      customerName: customer.name,
      phoneNumber: customer.phoneNumber,
      hotelPhoneNumber: reservationState.hotelPhoneNumber,
      roomInfo,
      checkIn: reservationState.checkIn
        ? format(reservationState.checkIn, "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
        : null,
      checkOut: reservationState.checkOut
        ? format(reservationState.checkOut, "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
        : null,
      reservationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'+09:00'"),
      reservationStatus: '예약완료',
      price: reservationState.price,
      originalPrice: reservationState.originalPrice,
      discount: reservationState.discount,
      fixedDiscount: reservationState.totalFixedDiscount,
      discountType: reservationState.discountType,
      eventName: reservationState.eventName || null,
      eventUuid: reservationState.eventUuid || null,
      couponDiscount: reservationState.couponDiscount,
      couponFixedDiscount: reservationState.couponFixedDiscount,
      couponTotalFixedDiscount: reservationState.couponTotalFixedDiscount,
      couponCode: reservationState.couponCode || null,
      couponUuid: reservationState.couponUuid || null,
      specialRequests,
      duration: numNights,
      paymentMethod: '현장결제',
      hotelName: reservationState.hotelInfo?.hotelName || '알 수 없음',
      address: reservationState.hotelInfo?.address || '주소 정보 없음',
      additionalFees: 0,
      paymentStatus: '미결제',
      isCancelled: false,
      type: 'stay',
      isCheckedIn: false,
      isCheckedOut: false,
      manuallyCheckedOut: false,
      paymentHistory: [],
      remainingBalance: reservationState.price,
      notificationHistory: [],
      sentCreate: false,
      sentCancel: false,
      photoUrl: finalPhotoUrl,
    };

    try {
      updateReservationState({ isLoading: true });
      const res = await createReservation(finalReservationData);
      updateReservationState({ reservationId: res.reservationId });

      if (reservationState.couponCode && reservationState.couponUuid) {
        await applyCoupon({
          hotelId: reservationState.hotelId,
          couponUuid: reservationState.couponUuid,
          reservationId: res.reservationId,
          customerId: customer._id,
        });
        updateCustomerCouponsAfterUse(reservationState.couponUuid);
        toast({
          title: '쿠폰 사용 성공',
          description: '쿠폰이 성공적으로 사용되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      toast({
        title: '예약 성공',
        description: '예약이 완료되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/history', {
        replace: true,
        state: {
          newReservationId: res.reservationId,
          newPhotoUrl: finalPhotoUrl,
        },
      });
    } catch (err) {
      console.error('[ReservationConfirmation] 예약 실패:', err);
      toast({
        title: '예약 실패',
        description: err.message || '예약을 완료하지 못했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      updateReservationState({ isLoading: false });
    }
  };

  const handleCopyAddress = async () => {
    if (!reservationState.hotelInfo?.address) {
      toast({
        title: '주소 정보 없음',
        description: '복사할 주소가 없습니다.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(reservationState.hotelInfo.address);
      toast({
        title: '주소 복사 완료',
        description: '주소가 클립보드에 복사되었습니다.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error('[ReservationConfirmation] 주소 복사 실패:', err);
      toast({
        title: '주소 복사 실패',
        description: `주소를 복사하는 데 실패했습니다: ${err.message}`,
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleTMapNavigation = () => {
    if (
      !reservationState.coordinates?.lat ||
      !reservationState.coordinates?.lng
    ) {
      updateReservationState({ isMapOpen: true });
      return;
    }
    const url = `tmap://route?goalx=${reservationState.coordinates.lng}&goaly=${
      reservationState.coordinates.lat
    }&name=${encodeURIComponent(
      reservationState.hotelInfo?.hotelName || '호텔'
    )}`;
    window.location.href = url;
    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid || isIOS) {
        updateReservationState({ isMapOpen: true });
      } else {
        toast({
          title: 'T맵 설치 필요',
          description:
            'T맵 앱이 설치되어 있지 않습니다. 기본 지도를 표시합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        updateReservationState({ isMapOpen: true });
      }
    }, 2000);
  };

  return (
    <Container
      maxW={{ base: '100%', sm: 'container.sm' }}
      p={0}
      minH="100vh"
      display="flex"
      flexDirection="column"
      w="100%"
      overflowY="auto"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflowX="hidden"
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
        <Container maxW={{ base: '100%', sm: 'container.sm' }}>
          <Flex align="center" justify="center" pos="relative">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              pos="absolute"
              left={0}
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              color="gray.600"
              _hover={{ bg: 'gray.100' }}
            />
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="bold"
              color="gray.800"
            >
              예약 확인
            </Text>
          </Flex>
        </Container>
      </Box>

      <Box
        flex="1"
        overflowY="auto"
        px={{ base: 4, sm: 0 }}
        pt="64px"
        pb="140px"
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {reservationState.isHotelInfoLoading ? (
          <Flex justify="center" align="center" minH="50vh">
            <Spinner size="lg" color="teal.500" />
          </Flex>
        ) : reservationState.hotelInfoError ? (
          <VStack spacing={4} align="stretch" minH="50vh" justify="center">
            <Text color="red.500" textAlign="center">
              {reservationState.hotelInfoError}
            </Text>
            <Button colorScheme="blue" onClick={() => navigate('/hotels')}>
              호텔 목록으로 돌아가기
            </Button>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            <Box bg="white" rounded="lg" overflow="hidden" shadow="sm">
              <Image
                src={reservationState.roomImage || '/assets/default-room1.jpg'}
                alt={roomInfo}
                objectFit="cover"
                w="100%"
                h={{ base: '150px', sm: '180px', md: '250px' }}
                onError={(e) => (e.target.src = '/assets/default-room1.jpg')}
              />
            </Box>

            <Box
              bg="white"
              p={{ base: 4, sm: 5 }}
              rounded="lg"
              shadow="md"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <VStack align="stretch" spacing={3}>
                <Flex align="center" justify="space-between">
                  <Text
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="bold"
                    color="gray.800"
                  >
                    {reservationState.hotelInfo?.hotelName ||
                      '호텔 정보 로드 중...'}
                  </Text>
                  <IconButton
                    icon={<FaCopy />}
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    isDisabled={!reservationState.hotelInfo?.address}
                    aria-label="주소 복사"
                    color="teal.500"
                    _hover={{ color: 'teal.600' }}
                  />
                </Flex>
                <Flex align="center">
                  <Icon as={FaMapMarkerAlt} mr={2} color="teal.500" />
                  <Text
                    flex={1}
                    onClick={() => updateReservationState({ isMapOpen: true })}
                    cursor="pointer"
                    color={
                      reservationState.coordinates ? 'teal.600' : 'gray.500'
                    }
                    _hover={
                      reservationState.coordinates
                        ? { color: 'teal.800', textDecoration: 'underline' }
                        : {}
                    }
                    fontSize={{ base: 'sm', md: 'md' }}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {reservationState.hotelInfo?.address || '주소 정보 없음'}
                  </Text>
                </Flex>
                {reservationState.hotelPhoneNumber && (
                  <Flex align="center" justify="flex-end">
                    <Icon as={FaPhone} mr={2} color="teal.500" />
                    <Text
                      color="teal.600"
                      cursor="pointer"
                      fontSize={{ base: 'sm', md: 'md' }}
                      onClick={() =>
                        (window.location.href = `tel:${reservationState.hotelPhoneNumber.replace(
                          /[^0-9]/g,
                          ''
                        )}`)
                      }
                      _hover={{
                        color: 'teal.800',
                        textDecoration: 'underline',
                      }}
                    >
                      {reservationState.hotelPhoneNumber}
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>

            <Box
              bg="white"
              p={{ base: 4, sm: 5 }}
              rounded="lg"
              shadow="md"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <VStack align="stretch" spacing={3}>
                <Text
                  fontWeight="bold"
                  fontSize={{ base: 'md', md: 'lg' }}
                  color="gray.800"
                >
                  예약 정보
                </Text>
                <Divider borderColor="gray.200" />
                <Grid
                  templateColumns={{ base: '1fr 2fr', md: '1fr 3fr' }}
                  gap={3}
                >
                  <Text color="gray.600" fontSize="sm">
                    예약 번호
                  </Text>
                  <Text fontSize="sm">
                    {reservationState.reservationId || '생성 중...'}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    예약자
                  </Text>
                  <Text fontSize="sm">{customer?.name || '정보 없음'}</Text>
                  <Text color="gray.600" fontSize="sm">
                    객실
                  </Text>
                  <Text fontSize="sm">{roomInfo || '정보 없음'}</Text>
                  <Text color="gray.600" fontSize="sm">
                    체크인
                  </Text>
                  <Text fontSize="sm">
                    {reservationState.checkIn
                      ? format(reservationState.checkIn, 'yyyy-MM-dd HH:mm')
                      : 'N/A'}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    체크아웃
                  </Text>
                  <Text fontSize="sm">
                    {reservationState.checkOut
                      ? format(reservationState.checkOut, 'yyyy-MM-dd HH:mm')
                      : 'N/A'}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    숙박 일수
                  </Text>
                  <Text fontSize="sm">{numNights}박</Text>
                  <Text color="gray.600" fontSize="sm">
                    결제
                  </Text>
                  <Text fontSize="sm">현장결제</Text>
                  <Text color="gray.600" fontSize="sm">
                    예약 일시
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                  </Text>
                  {reservationState.eventName && (
                    <>
                      <Text color="gray.600" fontSize="sm">
                        적용된 이벤트
                      </Text>
                      <Text fontSize="sm" color="teal.600">
                        {reservationState.eventName}
                      </Text>
                    </>
                  )}
                  <Text color="gray.600" fontSize="sm">
                    쿠폰 선택
                  </Text>
                  <Flex align="center">
                    {isCouponsLoading ? (
                      <Flex align="center">
                        <Spinner size="xs" color="teal.500" mr={2} />
                        <Text fontSize="sm" color="gray.500">
                          쿠폰 로드 중...
                        </Text>
                      </Flex>
                    ) : applicableCoupons.length > 0 ? (
                      <Select
                        value={reservationState.couponUuid || ''}
                        onChange={(e) => handleCouponChange(e.target.value)}
                        placeholder="쿠폰 선택"
                        flex="1"
                        size="sm"
                        variant="outline"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: 'teal.500',
                          boxShadow: '0 0 0 1px teal.500',
                        }}
                      >
                        <option value="">쿠폰 사용 안함</option>
                        {applicableCoupons.map((coupon) => (
                          <option
                            key={coupon.couponUuid}
                            value={coupon.couponUuid}
                          >
                            {coupon.code} (
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% 할인`
                              : `${(
                                  coupon.discountValue ?? 0
                                ).toLocaleString()}원 할인`}
                            )
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        적용 가능한 쿠폰 없음
                      </Text>
                    )}
                  </Flex>
                  {reservationState.couponCode && (
                    <>
                      <Text color="gray.600" fontSize="sm">
                        적용된 쿠폰
                      </Text>
                      <Text fontSize="sm" color="teal.600">
                        {reservationState.couponCode} (
                        {reservationState.couponDiscount > 0
                          ? `${reservationState.couponDiscount}% 할인`
                          : `${(
                              reservationState.couponTotalFixedDiscount ?? 0
                            ).toLocaleString()}원 할인`}
                        )
                      </Text>
                    </>
                  )}
                </Grid>

                <Divider borderColor="gray.200" />

                <Flex justify="space-between" align="center">
                  <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
                    총 결제 금액
                  </Text>
                  <Box textAlign="right">
                    {(reservationState.discount > 0 ||
                      reservationState.totalFixedDiscount > 0 ||
                      reservationState.couponDiscount > 0 ||
                      reservationState.couponTotalFixedDiscount > 0) && (
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        textDecoration="line-through"
                      >
                        ₩
                        {(reservationState.originalPrice ?? 0).toLocaleString()}
                        원
                      </Text>
                    )}
                    <Text
                      fontSize={{ base: 'lg', md: 'xl' }}
                      fontWeight="bold"
                      color="teal.600"
                    >
                      ₩{(reservationState.price ?? 0).toLocaleString()}원
                    </Text>
                    {reservationState.discountType === 'fixed' &&
                    (reservationState.totalFixedDiscount ?? 0) > 0 ? (
                      <Text fontSize="xs" color="red.500">
                        이벤트 할인: 총 ₩
                        {(
                          reservationState.totalFixedDiscount ?? 0
                        ).toLocaleString()}
                        원 ({numNights}박)
                      </Text>
                    ) : reservationState.discount > 0 ? (
                      <Text fontSize="xs" color="red.500">
                        이벤트 할인: {reservationState.discount}% 할인
                      </Text>
                    ) : null}
                    {(reservationState.couponTotalFixedDiscount ?? 0) > 0 && (
                      <Text fontSize="xs" color="red.500">
                        쿠폰 할인: 총 ₩
                        {(
                          reservationState.couponTotalFixedDiscount ?? 0
                        ).toLocaleString()}
                        원 ({numNights}박)
                      </Text>
                    )}
                    {reservationState.couponDiscount > 0 && (
                      <Text fontSize="xs" color="red.500">
                        쿠폰 할인: {reservationState.couponDiscount}% 할인
                      </Text>
                    )}
                  </Box>
                </Flex>

                <Box pt={3}>
                  {reservationState.isLoading ? (
                    <Flex justify="center">
                      <Spinner size="lg" color="teal.500" />
                    </Flex>
                  ) : (
                    <Button
                      colorScheme="teal"
                      w="full"
                      size="lg"
                      onClick={handleConfirm}
                      isDisabled={
                        !reservationState.hotelId || !reservationState.price
                      }
                      bg="teal.500"
                      _hover={{ bg: 'teal.600' }}
                      _active={{ bg: 'teal.700' }}
                    >
                      예약하기
                    </Button>
                  )}
                </Box>
              </VStack>
            </Box>
          </VStack>
        )}
      </Box>

      <Modal
        isOpen={reservationState.isMapOpen}
        onClose={() => updateReservationState({ isMapOpen: false })}
        size={{ base: 'full', sm: 'lg' }}
      >
        <ModalOverlay />
        <ModalContent rounded="lg">
          <ModalHeader fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
            호텔 위치
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {reservationState.coordinates?.lat &&
            reservationState.coordinates?.lng ? (
              <Map
                address={reservationState.hotelInfo?.address}
                latitude={reservationState.coordinates.lat}
                longitude={reservationState.coordinates.lng}
              />
            ) : (
              <Text color="red.500">지도 데이터를 불러올 수 없습니다.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                leftIcon={<FaMapSigns />}
                onClick={handleTMapNavigation}
                isDisabled={!reservationState.coordinates}
                colorScheme="teal"
                size="sm"
                rounded="lg"
              >
                T맵 길찾기
              </Button>
              <Button
                variant="outline"
                leftIcon={<FaCopy />}
                onClick={handleCopyAddress}
                isDisabled={!reservationState.hotelInfo?.address}
                colorScheme="teal"
                size="sm"
                rounded="lg"
              >
                주소 복사
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => updateReservationState({ isMapOpen: false })}
                size="sm"
                rounded="lg"
              >
                닫기
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <BottomNavigation />
    </Container>
  );
};

export default ReservationConfirmation;
