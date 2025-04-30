import React, { useEffect, useCallback, useReducer, useMemo } from 'react';
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
} from '../api/api';
import { differenceInCalendarDays, format } from 'date-fns';
import Map from '../components/HotelMap';
import BottomNavigation from '../components/BottomNavigation';
import { resolveCouponMetadata } from '../utils/coupon';
import logger from '../utils/logger';

const initialState = {
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
  couponName: null,
  couponDiscountType: null,
  reservationId: '',
  isLoading: false,
  isMapOpen: false,
  isHotelInfoLoading: true,
  hotelInfoError: null,
  isCouponsLoaded: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'INIT_STATE':
      return { ...state, ...action.payload };
    case 'APPLY_COUPON':
      return {
        ...state,
        couponUuid: action.payload.couponUuid,
        couponCode: action.payload.couponCode,
        couponName: action.payload.couponName,
        couponDiscount: action.payload.couponDiscount,
        couponFixedDiscount: action.payload.couponFixedDiscount,
        couponTotalFixedDiscount: action.payload.couponTotalFixedDiscount,
        couponDiscountType: action.payload.couponDiscountType,
        price: action.payload.price,
      };
    default:
      return state;
  }
};

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

  const [state, dispatch] = useReducer(reducer, initialState);

  const { state: locState } = location;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const numNights = useMemo(() => {
    return (
      differenceInCalendarDays(
        new Date(locState?.checkOut),
        new Date(locState?.checkIn)
      ) ||
      locState?.numNights ||
      1
    );
  }, [locState]);

  const applicableCoupons = useMemo(() => {
    return customerCoupons.filter((coupon) => {
      const expiry = coupon.expiryDate || coupon.endDate;
      return (
        coupon.isActive &&
        !coupon.used &&
        String(coupon.hotelId) === String(state.hotelId) &&
        (!coupon.applicableRoomType ||
          coupon.applicableRoomType.toLowerCase() === 'all' ||
          coupon.applicableRoomType.toLowerCase() ===
            locState?.roomInfo?.toLowerCase()) &&
        coupon.startDate <= todayStr &&
        expiry >= todayStr &&
        coupon.code &&
        coupon.code.trim() !== ''
      );
    });
  }, [customerCoupons, state.hotelId, locState?.roomInfo, todayStr]);

  // 1) 초기 데이터 로딩 (한 번만 실행)
  useEffect(() => {
    if (!locState) {
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
      couponName: initCouponName = null,
    } = locState;

    const requiredFields = {
      initHotelId,
      initPrice,
      initOriginal,
      roomInfo,
    };
    if (Object.values(requiredFields).some((field) => field == null)) {
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

    dispatch({
      type: 'INIT_STATE',
      payload: {
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
        couponName: initCouponName,
        specialRequests,
      },
    });

    (async () => {
      try {
        const [hotelList, settings, photosData] = await Promise.all([
          fetchHotelList(),
          fetchCustomerHotelSettings(initHotelId, {
            checkIn: stateCheckIn,
            checkOut: stateCheckOut,
          }),
          fetchHotelPhotos(initHotelId, 'room', roomInfo),
        ]);

        const hotelData = hotelList.find((h) => h.hotelId === initHotelId);
        const inTime = settings.checkInTime || '15:00';
        const outTime = settings.checkOutTime || '11:00';
        const inDt = stateCheckIn
          ? new Date(`${stateCheckIn}T${inTime}:00+09:00`)
          : null;
        const outDt = stateCheckOut
          ? new Date(`${stateCheckOut}T${outTime}:00+09:00`)
          : null;

        dispatch({
          type: 'INIT_STATE',
          payload: {
            hotelPhoneNumber: hotelData?.phoneNumber || '연락처 준비중',
            hotelInfo: settings,
            coordinates:
              settings.latitude && settings.longitude
                ? { lat: settings.latitude, lng: settings.longitude }
                : null,
            roomImage: photosData?.roomPhotos?.[0]?.photoUrl || null,
            checkIn: inDt,
            checkOut: outDt,
            isHotelInfoLoading: false,
            hotelInfoError: null,
          },
        });

        if (!settings.latitude || !settings.longitude) {
          toast({
            title: '좌표 정보 없음',
            description: '호텔 위치 정보를 불러올 수 없습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        const errorMessage =
          err.message || '호텔 정보를 불러오는 중 오류가 발생했습니다.';
        dispatch({
          type: 'INIT_STATE',
          payload: {
            hotelInfoError: errorMessage,
            isHotelInfoLoading: false,
          },
        });
        toast({
          title: errorMessage,
          description: errorMessage,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        logger.error(
          '[ReservationConfirmation] Initialization error:',
          errorMessage
        );
        return;
      }
    })();
  }, [locState, navigate, toast]);

  useEffect(() => {
    if (!locState) return;

    const {
      originalPrice: initOriginal,
      discountType: initDiscountType,
      totalFixedDiscount: initTotalFixedDiscount,
      discount: initDiscount,
      couponUuid: initCouponUuid,
    } = locState;

    if (isCouponsLoading) {
      dispatch({
        type: 'INIT_STATE',
        payload: { isCouponsLoaded: false },
      });
      return;
    }

    dispatch({
      type: 'INIT_STATE',
      payload: { isCouponsLoaded: true },
    });

    if (couponsLoadError) {
      toast({
        title: '쿠폰 로드 실패',
        description: couponsLoadError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!initCouponUuid) return;

    const selectedCoupon = customerCoupons.find(
      (c) => c.couponUuid === initCouponUuid
    );
    if (!selectedCoupon) {
      logger.warn(
        `[ReservationConfirmation] initCouponUuid (${initCouponUuid})에 해당하는 쿠폰이 customerCoupons에 존재하지 않습니다. customerCoupons:`,
        customerCoupons
      );
      return;
    }

    const { code, name } = resolveCouponMetadata(
      initCouponUuid,
      customerCoupons
    );
    if (!code || code.trim() === '') {
      logger.warn(
        `[ReservationConfirmation] initCouponUuid (${initCouponUuid})에 해당하는 쿠폰의 code가 누락되었습니다. selectedCoupon:`,
        selectedCoupon
      );
      return;
    }

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
        newCouponTotalFixedDiscount = Math.round(
          initOriginal * (newCouponDiscount / 100)
        );
      } else if (selectedCoupon.discountType === 'fixed') {
        newCouponFixedDiscount = selectedCoupon.discountValue;
        newCouponTotalFixedDiscount = newCouponFixedDiscount * numNights;
        newPrice = Math.max(0, newPrice - newCouponTotalFixedDiscount);
      }
    }

    dispatch({
      type: 'APPLY_COUPON',
      payload: {
        couponUuid: initCouponUuid,
        couponCode: code,
        couponName: name || `쿠폰 ${code}`,
        couponDiscount: newCouponDiscount,
        couponFixedDiscount: newCouponFixedDiscount,
        couponTotalFixedDiscount: newCouponTotalFixedDiscount,
        couponDiscountType: selectedCoupon.discountType,
        price: newPrice,
      },
    });
  }, [
    locState,
    isCouponsLoading,
    couponsLoadError,
    customerCoupons,
    toast,
    numNights,
  ]);

  const handleCouponChange = useCallback(
    (couponUuid) => {
      const selectedCoupon = customerCoupons.find(
        (coupon) => coupon.couponUuid === couponUuid
      );
      let newPrice = state.originalPrice;

      if (state.discountType === 'fixed' && state.totalFixedDiscount > 0) {
        toast({
          title: '할인 중복 적용 불가',
          description: '이벤트 할인과 쿠폰 할인은 중복 적용할 수 없습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        newPrice = Math.max(0, newPrice - state.totalFixedDiscount);
      } else if (state.discountType === 'percentage' && state.discount > 0) {
        toast({
          title: '할인 중복 적용 불가',
          description: '이벤트 할인과 쿠폰 할인은 중복 적용할 수 없습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        newPrice = Math.round(newPrice * (1 - state.discount / 100));
      } else if (selectedCoupon) {
        const { code, name } = resolveCouponMetadata(
          couponUuid,
          customerCoupons
        );
        if (!code || code.trim() === '') {
          logger.warn(
            `[handleCouponChange] couponUuid (${couponUuid})에 해당하는 쿠폰의 code가 누락되었습니다. selectedCoupon:`,
            selectedCoupon
          );
          toast({
            title: '쿠폰 코드 오류',
            description:
              '선택한 쿠폰의 코드가 누락되었습니다. 쿠폰 없이 예약을 진행합니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          newPrice = state.originalPrice;
          dispatch({
            type: 'APPLY_COUPON',
            payload: {
              couponUuid: null,
              couponCode: null,
              couponName: null,
              couponDiscount: 0,
              couponFixedDiscount: 0,
              couponTotalFixedDiscount: 0,
              couponDiscountType: null,
              price: newPrice,
            },
          });
          return;
        }

        let newCouponDiscount = 0;
        let newCouponFixedDiscount = 0;
        let newCouponTotalFixedDiscount = 0;

        if (selectedCoupon.discountType === 'percentage') {
          newCouponDiscount = selectedCoupon.discountValue;
          newPrice = Math.round(newPrice * (1 - newCouponDiscount / 100));
          newCouponTotalFixedDiscount = Math.round(
            state.originalPrice * (newCouponDiscount / 100)
          );
        } else if (selectedCoupon.discountType === 'fixed') {
          newCouponFixedDiscount = selectedCoupon.discountValue;
          newCouponTotalFixedDiscount = newCouponFixedDiscount * numNights;
          newPrice = Math.max(0, newPrice - newCouponTotalFixedDiscount);
        }

        dispatch({
          type: 'APPLY_COUPON',
          payload: {
            couponUuid,
            couponCode: code,
            couponName: name || `쿠폰 ${code}`,
            couponDiscount: newCouponDiscount,
            couponFixedDiscount: newCouponFixedDiscount,
            couponTotalFixedDiscount: newCouponTotalFixedDiscount,
            couponDiscountType: selectedCoupon.discountType,
            price: newPrice,
          },
        });
        logger.info(`[handleCouponChange] Coupon selected: ${couponUuid}`);
      } else {
        newPrice = state.originalPrice;
        if (state.discountType === 'fixed' && state.totalFixedDiscount > 0) {
          newPrice = Math.max(0, newPrice - state.totalFixedDiscount);
        } else if (state.discountType === 'percentage' && state.discount > 0) {
          newPrice = Math.round(newPrice * (1 - state.discount / 100));
        }

        dispatch({
          type: 'APPLY_COUPON',
          payload: {
            couponUuid: null,
            couponCode: null,
            couponName: null,
            couponDiscount: 0,
            couponFixedDiscount: 0,
            couponTotalFixedDiscount: 0,
            couponDiscountType: null,
            price: newPrice,
          },
        });
        logger.info(`[handleCouponChange] No coupon selected`);
      }
    },
    [
      state.originalPrice,
      state.discountType,
      state.totalFixedDiscount,
      state.discount,
      customerCoupons,
      toast,
      numNights,
    ]
  );
  
  
  const handleConfirm = async () => {
    const {
      hotelId,
      hotelPhoneNumber,
      roomImage,
      checkIn,
      checkOut,
      price,
      originalPrice,
      discount,
      totalFixedDiscount,
      discountType: eventDiscountType,
      eventName,
      eventUuid,
      couponUuid,
      couponCode,
      couponName,
      couponDiscountType,
      couponDiscount,
      couponTotalFixedDiscount,
    } = state;
  
    const { roomInfo, specialRequests } = locState || {};
  
    // 인증 확인
    if (!localStorage.getItem('customerToken')) {
      toast({
        title: '인증 오류',
        description: '로그인이 필요합니다. 로그인 페이지로 이동합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login', { replace: true });
      return;
    }
  
    // hotelId 유효성 검증
    if (!hotelId || typeof hotelId !== 'string' || hotelId.trim() === '') {
      logger.warn('[handleConfirm] Invalid hotelId:', hotelId);
      toast({
        title: '호텔 정보 오류',
        description: '유효한 호텔 정보를 찾을 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    // couponUuid 유효성 검증
    if (couponUuid && (typeof couponUuid !== 'string' || couponUuid.trim() === '')) {
      logger.warn('[handleConfirm] Invalid couponUuid:', couponUuid);
      toast({
        title: '쿠폰 오류',
        description: '유효한 쿠폰 정보를 찾을 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    // 중복 요청 방지
    if (state.isLoading) {
      logger.warn('[handleConfirm] Already processing a reservation request');
      return;
    }
  
    // 즉시 로딩 상태 설정
    dispatch({ type: 'INIT_STATE', payload: { isLoading: true } });
  
    // 이미지 처리
    let finalPhotoUrl = roomImage;
    if (!finalPhotoUrl) {
      try {
        const photosData = await fetchHotelPhotos(hotelId, 'room', roomInfo);
        finalPhotoUrl =
          photosData?.roomPhotos?.[0]?.photoUrl || '/assets/default-room1.jpg';
      } catch {
        finalPhotoUrl = '/assets/default-room1.jpg';
      }
    }
  
    // 쿠폰 처리
    let finalCouponCode = couponCode;
    let finalCouponName = couponName;
    let finalCouponDiscountType = couponDiscountType;
    let finalCouponDiscount = couponDiscount;
    let finalCouponTotalFixedDiscount = couponTotalFixedDiscount;
  
    if (couponUuid) {
      const selectedCoupon = customerCoupons.find(
        (c) => c.couponUuid === couponUuid
      );
      if (selectedCoupon) {
        finalCouponCode = selectedCoupon.code || `COUPON-${couponUuid.slice(0, 8)}`;
        finalCouponName = selectedCoupon.name || `쿠폰-${couponUuid.slice(0, 8)}`;
        finalCouponDiscountType = selectedCoupon.discountType || 'percentage';
        finalCouponDiscount = Number(selectedCoupon.discountValue) || 0;
        finalCouponTotalFixedDiscount =
          selectedCoupon.discountType === 'fixed'
            ? Number(selectedCoupon.discountValue) * numNights
            : Math.round(originalPrice * (finalCouponDiscount / 100));
      } else {
        logger.warn(`[handleConfirm] Coupon not found for UUID: ${couponUuid}`);
        toast({
          title: '쿠폰 오류',
          description: '쿠폰 정보를 찾을 수 없습니다. 쿠폰 없이 예약을 진행합니다.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        finalCouponCode = null;
        finalCouponName = null;
        finalCouponDiscountType = null;
        finalCouponDiscount = 0;
        finalCouponTotalFixedDiscount = 0;
      }
    }
  
    // couponInfo 구성
    const couponInfo = couponUuid && finalCouponCode
      ? {
          couponUuid,
          code: finalCouponCode,
          name: finalCouponName,
          discountType: finalCouponDiscountType,
          discountValue: finalCouponDiscount,
          discountAmount: finalCouponTotalFixedDiscount,
        }
      : null;
  
    logger.debug('[handleConfirm] Constructed couponInfo:', couponInfo);
  
    const payload = {
      hotelId,
      siteName: '단잠',
      customerId: customer?._id || '',
      customerName: customer?.name || '',
      phoneNumber: customer?.phoneNumber || '',
      hotelPhoneNumber,
      roomInfo,
      checkIn: checkIn
        ? format(checkIn, "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
        : null,
      checkOut: checkOut
        ? format(checkOut, "yyyy-MM-dd'T'HH:mm:ss'+09:00'")
        : null,
      reservationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'+09:00"),
      reservationStatus: '예약완료',
      price,
      originalPrice,
      discount: discount || 0,
      fixedDiscount: totalFixedDiscount || 0,
      discountType: eventDiscountType || null,
      eventName: eventName || null,
      eventUuid: eventUuid || null,
      specialRequests: specialRequests || null,
      couponInfo,
      duration: numNights,
      paymentMethod: '현장결제',
      hotelName: state.hotelInfo?.hotelName || '알 수 없음',
      address: state.hotelInfo?.address || '주소 정보 없음',
      additionalFees: 0,
      paymentStatus: '미결제',
      isCancelled: false,
      type: 'stay',
      isCheckedIn: false,
      isCheckedOut: false,
      manuallyCheckedOut: false,
      paymentHistory: [],
      remainingBalance: price,
      notificationHistory: [],
      sentCreate: false,
      sentCancel: false,
      photoUrl: finalPhotoUrl,
      couponUuid: couponUuid || null,
      couponCode: finalCouponCode || null,
      couponName: finalCouponName || null,
      couponDiscountType: finalCouponDiscountType || null,
      couponDiscountValue: finalCouponDiscount || null,
      couponDiscountAmount: finalCouponTotalFixedDiscount || null,
    };
  
    logger.debug('[handleConfirm] Sending reservation data:', payload);
  
    try {
      const res = await createReservation(payload);
      logger.info(`[handleConfirm] Reservation created: ${res.reservationId}`);
  
      // 쿠폰 처리 알림
      if (couponUuid && finalCouponCode) {
        logger.info(
          `[handleConfirm] Coupon included in reservation: ${couponUuid} for ${res.reservationId}`
        );
        updateCustomerCouponsAfterUse(couponUuid);
        toast({
          title: '쿠폰 포함 예약',
          description: '쿠폰이 예약에 포함되었습니다.',
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
          couponInfo: couponInfo || null,
        },
      });
    } catch (err) {
      let errorMessage = '예약을 완료하지 못했습니다.';
      if (err.message === '호텔 설정 정보를 찾을 수 없습니다.') {
        errorMessage = '호텔 정보를 불러올 수 없습니다. 다른 호텔을 선택해 주세요.';
      } else if (err.message === '예약을 찾을 수 없습니다.') {
        errorMessage = '예약 정보를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.';
      } else if (err.message === '이미 발행된 쿠폰입니다.') {
        errorMessage = '이미 사용된 쿠폰입니다. 다른 쿠폰을 선택해 주세요.';
      }
      logger.error('[handleConfirm] 예약 실패:', err.message);
      toast({
        title: '예약 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      dispatch({ type: 'INIT_STATE', payload: { isLoading: false } });
    }
  };


  const handleCopyAddress = async () => {
    if (!state.hotelInfo?.address) {
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
      await navigator.clipboard.writeText(state.hotelInfo.address);
      toast({
        title: '주소 복사 완료',
        description: '주소가 클립보드에 복사되었습니다.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      logger.error('[ReservationConfirmation] 주소 복사 실패:', err.message);
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
    if (!state.coordinates?.lat || !state.coordinates?.lng) {
      dispatch({ type: 'INIT_STATE', payload: { isMapOpen: true } });
      return;
    }
    const url = `tmap://route?goalx=${state.coordinates.lng}&goaly=${
      state.coordinates.lat
    }&name=${encodeURIComponent(state.hotelInfo?.hotelName || '호텔')}`;
    window.location.href = url;
    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid || isIOS) {
        dispatch({ type: 'INIT_STATE', payload: { isMapOpen: true } });
      } else {
        toast({
          title: 'T맵 설치 필요',
          description:
            'T맵 앱이 설치되어 있지 않습니다. 기본 지도를 표시합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        dispatch({ type: 'INIT_STATE', payload: { isMapOpen: true } });
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
        pb="160px"
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {state.isHotelInfoLoading ? (
          <Flex justify="center" align="center" minH="50vh">
            <Spinner size="lg" color="teal.500" />
          </Flex>
        ) : state.hotelInfoError ? (
          <VStack spacing={4} align="stretch" minH="50vh" justify="center">
            <Text color="red.500" textAlign="center">
              {state.hotelInfoError}
            </Text>
            <Button colorScheme="blue" onClick={() => navigate('/hotels')}>
              호텔 목록으로 돌아가기
            </Button>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            <Box bg="white" rounded="lg" overflow="hidden" shadow="sm">
              <Image
                src={state.roomImage || '/assets/default-room1.jpg'}
                alt={locState?.roomInfo || '객실 이미지'}
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
                    {state.hotelInfo?.hotelName || '호텔 정보 로드 중...'}
                  </Text>
                  <IconButton
                    icon={<FaCopy />}
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    isDisabled={!state.hotelInfo?.address}
                    aria-label="주소 복사"
                    color="teal.500"
                    _hover={{ color: 'teal.600' }}
                  />
                </Flex>
                <Flex align="center">
                  <Icon as={FaMapMarkerAlt} mr={2} color="teal.500" />
                  <Text
                    flex={1}
                    onClick={() =>
                      dispatch({
                        type: 'INIT_STATE',
                        payload: { isMapOpen: true },
                      })
                    }
                    cursor="pointer"
                    color={state.coordinates ? 'teal.600' : 'gray.500'}
                    _hover={
                      state.coordinates
                        ? { color: 'teal.800', textDecoration: 'underline' }
                        : {}
                    }
                    fontSize={{ base: 'sm', md: 'md' }}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {state.hotelInfo?.address || '주소 정보 없음'}
                  </Text>
                </Flex>
                {state.hotelPhoneNumber && (
                  <Flex align="center" justify="flex-end">
                    <Icon as={FaPhone} mr={2} color="teal.500" />
                    <Text
                      color="teal.600"
                      cursor="pointer"
                      fontSize={{ base: 'sm', md: 'md' }}
                      onClick={() =>
                        (window.location.href = `tel:${state.hotelPhoneNumber.replace(
                          /[^0-9]/g,
                          ''
                        )}`)
                      }
                      _hover={{
                        color: 'teal.800',
                        textDecoration: 'underline',
                      }}
                    >
                      {state.hotelPhoneNumber}
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
                    {state.reservationId || '생성 중...'}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    예약자
                  </Text>
                  <Text fontSize="sm">{customer?.name || '정보 없음'}</Text>
                  <Text color="gray.600" fontSize="sm">
                    객실
                  </Text>
                  <Text fontSize="sm">{locState?.roomInfo || '정보 없음'}</Text>
                  <Text color="gray.600" fontSize="sm">
                    체크인
                  </Text>
                  <Text fontSize="sm">
                    {state.checkIn
                      ? format(state.checkIn, 'yyyy-MM-dd HH:mm')
                      : 'N/A'}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    체크아웃
                  </Text>
                  <Text fontSize="sm">
                    {state.checkOut
                      ? format(state.checkOut, 'yyyy-MM-dd HH:mm')
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
                  {state.eventName && (
                    <>
                      <Text color="gray.600" fontSize="sm">
                        적용된 이벤트
                      </Text>
                      <Text fontSize="sm" color="teal.600">
                        {state.eventName}
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
                        value={state.couponUuid || ''}
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
                  {state.couponCode && (
                    <>
                      <Text color="gray.600" fontSize="sm">
                        적용된 쿠폰
                      </Text>
                      <Text fontSize="sm" color="teal.600">
                        {state.couponName || state.couponCode} (
                        {state.couponDiscount > 0
                          ? `${state.couponDiscount}% 할인`
                          : `${(
                              state.couponTotalFixedDiscount ?? 0
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
                    {(state.discount > 0 ||
                      state.totalFixedDiscount > 0 ||
                      state.couponDiscount > 0 ||
                      state.couponTotalFixedDiscount > 0) && (
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        textDecoration="line-through"
                      >
                        ₩{(state.originalPrice ?? 0).toLocaleString()}원
                      </Text>
                    )}
                    <Text
                      fontSize={{ base: 'lg', md: 'xl' }}
                      fontWeight="bold"
                      color="teal.600"
                    >
                      ₩{(state.price ?? 0).toLocaleString()}원
                    </Text>
                    {state.discountType === 'fixed' &&
                    (state.totalFixedDiscount ?? 0) > 0 ? (
                      <Text fontSize="xs" color="red.500">
                        이벤트 할인: 총 ₩
                        {(state.totalFixedDiscount ?? 0).toLocaleString()}원 (
                        {numNights}박)
                      </Text>
                    ) : state.discount > 0 ? (
                      <Text fontSize="xs" color="red.500">
                        이벤트 할인: {state.discount}% 할인
                      </Text>
                    ) : null}
                    {(state.couponTotalFixedDiscount ?? 0) > 0 && (
                      <Text fontSize="xs" color="red.500">
                        쿠폰 할인: 총 ₩
                        {(state.couponTotalFixedDiscount ?? 0).toLocaleString()}
                        원 ({numNights}박)
                      </Text>
                    )}
                    {state.couponDiscount > 0 && (
                      <Text fontSize="xs" color="red.500">
                        쿠폰 할인: {state.couponDiscount}% 할인
                      </Text>
                    )}
                  </Box>
                </Flex>

                <Box pt={3}>
                  {state.isLoading ? (
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
                        !state.hotelId || !state.price || state.isLoading
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
        isOpen={state.isMapOpen}
        onClose={() =>
          dispatch({ type: 'INIT_STATE', payload: { isMapOpen: false } })
        }
        size={{ base: 'full', sm: 'lg' }}
      >
        <ModalOverlay />
        <ModalContent rounded="lg">
          <ModalHeader fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
            호텔 위치
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {state.coordinates?.lat && state.coordinates?.lng ? (
              <Map
                address={state.hotelInfo?.address}
                latitude={state.coordinates.lat}
                longitude={state.coordinates.lng}
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
                isDisabled={!state.coordinates}
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
                isDisabled={!state.hotelInfo?.address}
                colorScheme="teal"
                size="sm"
                rounded="lg"
              >
                주소 복사
              </Button>
              <Button
                colorScheme="gray"
                onClick={() =>
                  dispatch({
                    type: 'INIT_STATE',
                    payload: { isMapOpen: false },
                  })
                }
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