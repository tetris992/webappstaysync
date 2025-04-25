import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  Box,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  ModalBody,
  HStack,
  Badge,
  Divider,
  Image,
  IconButton,
} from '@chakra-ui/react';
import { CalendarIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaMapSigns, FaCopy, FaTag } from 'react-icons/fa';
import * as Icons from 'react-icons/fa';
import { DateRange } from 'react-date-range';
import {
  format,
  addDays,
  startOfDay,
  differenceInCalendarDays,
  isBefore,
  addMonths,
  isValid,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import BottomNavigation from '../components/BottomNavigation';
import CouponCard from '../utils/CouponCard';
import {
  fetchHotelAvailability,
  fetchCustomerHotelSettings,
  fetchHotelPhotos,
} from '../api/api';
import { useAuth } from '../contexts/AuthContext';

// HotelMap 컴포넌트를 동적으로 임포트
const HotelMap = React.lazy(() => import('../components/HotelMap'));

const RoomSelection = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const {
    customer,
    customerCoupons,
    isCouponsLoading,
    couponsLoadError,
    updateCustomerCouponsAfterUse,
    downloadCoupon,
  } = useAuth();

  const {
    checkIn: initialCheckIn = format(new Date(), 'yyyy-MM-dd'),
    checkOut: initialCheckOut = format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    guestCount = 1,
    hotelSettings: preloadedHotelSettings = null,
  } = location.state || {};

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const maxDate = addMonths(today, 3);

  const [dateRange, setDateRange] = useState([
    {
      startDate: isValid(new Date(initialCheckIn))
        ? new Date(initialCheckIn)
        : today,
      endDate: isValid(new Date(initialCheckOut))
        ? new Date(initialCheckOut)
        : tomorrow,
      key: 'selection',
    },
  ]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
  const [hotelSettings, setHotelSettings] = useState(preloadedHotelSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomPhotosMap, setRoomPhotosMap] = useState({});
  const [currentPhotoIndices, setCurrentPhotoIndices] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [shouldFetchAvailability, setShouldFetchAvailability] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [sortMode, setSortMode] = useState('event');
  const [selectedCoupons, setSelectedCoupons] = useState({});
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [currentRoomInfo, setCurrentRoomInfo] = useState(null);
  const [applicableCouponsForModal, setApplicableCouponsForModal] = useState([]);
  const [hotelCoupons, setHotelCoupons] = useState([]);
  const [selectedCouponIndex, setSelectedCouponIndex] = useState(null);

  const numDays = differenceInCalendarDays(
    dateRange[0].endDate,
    dateRange[0].startDate
  );

  const startLabel = isValid(dateRange[0].startDate)
    ? format(dateRange[0].startDate, 'yyyy-MM-dd')
    : '';
  const endLabel = isValid(dateRange[0].endDate)
    ? format(dateRange[0].endDate, 'yyyy-MM-dd')
    : '';

  const normalizeKey = (str) =>
    (str || '').toLowerCase().replace(/\s+/g, '').replace(/-/g, '');

  const mapIconNameToComponent = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={14} /> : null;
  };

  useEffect(() => {
    if (couponsLoadError) {
      setError(couponsLoadError);
      toast({
        title: '쿠폰 로드 실패',
        description: couponsLoadError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [couponsLoadError, toast]);

  useEffect(() => {
    let isMounted = true;
    const loadHotelSettings = async () => {
      if (preloadedHotelSettings) {
        setHotelSettings(preloadedHotelSettings);
        setHotelCoupons(preloadedHotelSettings.coupons || []);
        const roomTypes = preloadedHotelSettings.roomTypes || [];
        const photosPromises = roomTypes.map(async (roomType) => {
          try {
            const photosData = await fetchHotelPhotos(
              hotelId,
              'room',
              roomType.roomInfo
            );
            return {
              roomInfo: roomType.roomInfo,
              photos: photosData.roomPhotos || [],
            };
          } catch (error) {
            console.error(
              'Failed to fetch photos for room:',
              roomType.roomInfo,
              error
            );
            return { roomInfo: roomType.roomInfo, photos: [] };
          }
        });

        const photosResults = await Promise.all(photosPromises);
        const photosMap = photosResults.reduce((acc, { roomInfo, photos }) => {
          acc[roomInfo.toLowerCase()] = photos;
          return acc;
        }, {});
        setRoomPhotosMap(photosMap);
        setCurrentPhotoIndices(
          roomTypes.reduce((acc, room) => {
            acc[room.roomInfo.toLowerCase()] = 0;
            return acc;
          }, {})
        );
        setShouldFetchAvailability(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const settings = await fetchCustomerHotelSettings(hotelId);
        if (!isMounted) return;
        setHotelSettings(settings);
        setHotelCoupons(settings.coupons || []);

        const roomTypes = settings.roomTypes || [];
        const photosPromises = roomTypes.map(async (roomType) => {
          try {
            const photosData = await fetchHotelPhotos(
              hotelId,
              'room',
              roomType.roomInfo
            );
            return {
              roomInfo: roomType.roomInfo,
              photos: photosData.roomPhotos || [],
            };
          } catch (error) {
            console.error(
              'Failed to fetch photos for room:',
              roomType.roomInfo,
              error
            );
            return { roomInfo: roomType.roomInfo, photos: [] };
          }
        });

        const photosResults = await Promise.all(photosPromises);
        const photosMap = photosResults.reduce((acc, { roomInfo, photos }) => {
          acc[roomInfo.toLowerCase()] = photos;
          return acc;
        }, {});
        setRoomPhotosMap(photosMap);
        setCurrentPhotoIndices(
          roomTypes.reduce((acc, room) => {
            acc[room.roomInfo.toLowerCase()] = 0;
            return acc;
          }, {})
        );
        setShouldFetchAvailability(true);
      } catch (error) {
        console.error('[RoomSelection] Failed to load hotel settings:', error);
        if (isMounted) {
          setError(error.message || '호텔 설정을 불러오지 못했습니다.');
          toast({
            title: '호텔 설정 로딩 실패',
            description: error.message || '호텔 설정을 불러오지 못했습니다.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadHotelSettings();
    return () => {
      isMounted = false;
    };
  }, [hotelId, toast, preloadedHotelSettings]);

  useEffect(() => {
    const syncAutoDistributeCoupons = async () => {
      if (!customer?._id || !hotelCoupons || hotelCoupons.length === 0) return;

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const autoDistributeCoupons = hotelCoupons.filter(
        (coupon) =>
          coupon.autoDistribute &&
          coupon.isActive &&
          coupon.maxUses - coupon.usedCount > 0 &&
          coupon.endDate >= todayStr &&
          coupon.startDate <= todayStr &&
          !customerCoupons.some((cc) => cc.couponUuid === coupon.uuid)
      );

      if (autoDistributeCoupons.length === 0) return;

      try {
        for (const coupon of autoDistributeCoupons) {
          await downloadCoupon(coupon.uuid);
        }
        console.log(
          '[RoomSelection] Synced auto-distribute coupons:',
          autoDistributeCoupons
        );
      } catch (error) {
        console.error(
          '[RoomSelection] Failed to sync auto-distribute coupons:',
          error
        );
        toast({
          title: '쿠폰 동기화 실패',
          description:
            error.message || '자동 배포 쿠폰을 동기화하지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    syncAutoDistributeCoupons();
  }, [customer, hotelCoupons, toast, hotelId, customerCoupons, downloadCoupon]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndices((prev) => {
        const newIndices = { ...prev };
        Object.keys(newIndices).forEach((roomKey) => {
          const photos = roomPhotosMap[roomKey] || [];
          if (photos.length > 1) {
            const currentIndex = newIndices[roomKey] || 0;
            newIndices[roomKey] = (currentIndex + 1) % photos.length;
          }
        });
        return newIndices;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [roomPhotosMap]);

  const calculateEventDays = (checkIn, checkOut, eventStart, eventEnd) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const eventStartDate = new Date(eventStart);
    const eventEndDate = new Date(eventEnd);
    eventEndDate.setDate(eventEndDate.getDate() + 1);
    const start = new Date(Math.max(checkInDate, eventStartDate));
    const end = new Date(Math.min(checkOutDate, eventEndDate));
    const days = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return days;
  };

  const calculateDiscount = useCallback(
    (roomInfo, checkIn, checkOut) => {
      if (!hotelSettings?.events || !checkIn || !checkOut) {
        return {
          discount: 0,
          fixedDiscount: 0,
          discountType: null,
          eventName: null,
          eventUuid: null,
          eventStartDate: null,
          eventEndDate: null,
          totalFixedDiscount: 0,
        };
      }
      const roomKey = roomInfo?.toLowerCase() || '';
      const checkInDateStr = format(new Date(checkIn), 'yyyy-MM-dd');
      const checkOutDateStr = format(new Date(checkOut), 'yyyy-MM-dd');

      const applicableEvents = (hotelSettings.events || []).filter((event) => {
        return (
          event.isActive &&
          event.applicableRoomTypes?.includes(roomKey) &&
          event.startDate <= checkOutDateStr &&
          event.endDate >= checkInDateStr
        );
      });

      let maxDiscount = 0;
      let maxFixedDiscount = 0;
      let selectedDiscountType = null;
      let selectedEventName = null;
      let selectedEventUuid = null;
      let selectedEventStartDate = null;
      let selectedEventEndDate = null;
      let totalFixedDiscount = 0;

      applicableEvents.forEach((event) => {
        const currentEventDays = calculateEventDays(
          checkIn,
          checkOut,
          event.startDate,
          event.endDate
        );
        if (
          event.discountType === 'percentage' &&
          event.discountValue > maxDiscount
        ) {
          maxDiscount = event.discountValue;
          maxFixedDiscount = 0;
          selectedDiscountType = 'percentage';
          selectedEventName = event.eventName;
          selectedEventUuid = event.uuid;
          selectedEventStartDate = event.startDate;
          selectedEventEndDate = event.endDate;
        } else if (
          event.discountType === 'fixed' &&
          event.discountValue > maxFixedDiscount
        ) {
          maxFixedDiscount = event.discountValue;
          maxDiscount = 0;
          selectedDiscountType = 'fixed';
          selectedEventName = event.eventName;
          selectedEventUuid = event.uuid;
          selectedEventStartDate = event.startDate;
          selectedEventEndDate = event.endDate;
          totalFixedDiscount = maxFixedDiscount * currentEventDays;
        }
      });

      console.log('[RoomSelection] Calculated discount:', {
        roomInfo,
        discount: maxDiscount,
        fixedDiscount: maxFixedDiscount,
        totalFixedDiscount,
        discountType: selectedDiscountType,
        eventName: selectedEventName,
        eventUuid: selectedEventUuid,
        eventStartDate: selectedEventStartDate,
        eventEndDate: selectedEventEndDate,
      });

      return {
        discount: maxDiscount,
        fixedDiscount: maxFixedDiscount,
        discountType: selectedDiscountType,
        eventName: selectedEventName,
        eventUuid: selectedEventUuid,
        eventStartDate: selectedEventStartDate,
        eventEndDate: selectedEventEndDate,
        totalFixedDiscount,
      };
    },
    [hotelSettings]
  );

  const handleCheckAvailability = useCallback(async () => {
    const checkIn = dateRange[0].startDate;
    const checkOut = dateRange[0].endDate;

    if (!checkIn || !checkOut || !isValid(checkIn) || !isValid(checkOut)) {
      toast({
        title: '날짜 오류',
        description: '체크인/체크아웃 날짜가 올바르지 않습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isBefore(checkIn, today)) {
      toast({
        title: '날짜 오류',
        description: '체크인 날짜는 오늘 이후여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (isBefore(maxDate, checkIn)) {
      toast({
        title: '날짜 범위 오류',
        description: '체크인 날짜는 현재로부터 3개월 이내여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (numDays <= 0) {
      toast({
        title: '날짜 오류',
        description: '체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const maxCheckOutDate = addMonths(checkIn, 3);
    if (isBefore(maxCheckOutDate, checkOut)) {
      toast({
        title: '날짜 범위 오류',
        description: '체크아웃 날짜는 체크인 날짜로부터 3개월 이내여야 합니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const hotelData = await fetchHotelAvailability(
        hotelId,
        format(checkIn, 'yyyy-MM-dd'),
        format(checkOut, 'yyyy-MM-dd')
      );
      if (hotelData?.availability?.length === 0) {
        setAvailableRooms([]);
        setIsAvailabilityChecked(true);
        return;
      }
      if (!hotelSettings?.roomTypes) {
        toast({
          title: '호텔 설정 오류',
          description: '호텔 설정이 로드되지 않았습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const roomTypes = hotelSettings.roomTypes || [];
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const availabilityWithAmenities = (hotelData.availability || []).map(
        (room) => {
          const key = room.roomInfo?.toLowerCase() || '';
          const foundType = roomTypes.find(
            (rt) => rt.roomInfo?.toLowerCase() === key
          );
          const activeAmenities =
            foundType?.roomAmenities
              ?.filter((amenity) => amenity.isActive)
              .map((amenity) => ({
                nameKor: amenity.nameKor || '',
                nameEng: amenity.nameEng || '',
                icon: amenity.icon || '',
              })) || [];
          const {
            discount = 0,
            fixedDiscount = 0,
            discountType = null,
            eventName = null,
            eventUuid = null,
            eventStartDate = null,
            eventEndDate = null,
            totalFixedDiscount = 0,
          } = calculateDiscount(room.roomInfo, checkIn, checkOut);

          // room.price가 undefined일 경우 0으로 대체
          const dayStayPrice = Number(room.price) || 0;
          const dayUsePrice = Math.round(dayStayPrice * 0.5);

          // totalPrice와 originalPrice 계산 시 숫자 보장
          let totalPrice = dayStayPrice * numDays;
          let originalPrice = totalPrice;

          // 이벤트 할인이 없으면 가장 큰 쿠폰의 할인 적용
          let couponDiscount = 0; // 퍼센트 할인
          let couponFixedDiscount = 0; // 고정 금액 할인
          let couponDiscountType = null; // 할인 타입
          let couponDiscountValue = 0; // 할인 값

          // 호텔 쿠폰 필터링
          const applicableHotelCoupons = (hotelCoupons || []).filter(
            (coupon) => {
              const typeKey = normalizeKey(coupon.applicableRoomType);
              const roomKey = normalizeKey(room.roomInfo);
              const isRoomMatch = typeKey === 'all' || typeKey === roomKey;
              const isActive = coupon.isActive;
              const hasUsesLeft = coupon.maxUses - coupon.usedCount > 0;
              const isDateValid = coupon.startDate <= todayStr && coupon.endDate >= todayStr;

              console.log('[RoomSelection] Hotel coupon filter conditions:', {
                coupon: {
                  code: coupon.code,
                  applicableRoomType: coupon.applicableRoomType,
                  isActive: coupon.isActive,
                  maxUses: coupon.maxUses,
                  usedCount: coupon.usedCount,
                  startDate: coupon.startDate,
                  endDate: coupon.endDate,
                },
                conditions: {
                  isRoomMatch,
                  isActive,
                  hasUsesLeft,
                  isDateValid,
                  roomInfo: room.roomInfo,
                  todayStr,
                },
              });

              return (
                isActive &&
                hasUsesLeft &&
                isDateValid &&
                isRoomMatch
              );
            }
          );

          // 고객 쿠폰 필터링
          const applicableCustomerCoupons = (customerCoupons || []).filter(
            (coupon) => {
              const typeKey = normalizeKey(coupon.applicableRoomType);
              const roomKey = normalizeKey(room.roomInfo);
              const isRoomMatch = !coupon.applicableRoomType || typeKey === 'all' || typeKey === roomKey;
              const isHotelMatch = coupon.hotelId === hotelId;
              const isNotUsed = !coupon.used;
              const isDateValid = coupon.endDate >= todayStr && coupon.startDate <= todayStr;

              console.log('[RoomSelection] Customer coupon filter conditions:', {
                coupon: {
                  code: coupon.code,
                  hotelId: coupon.hotelId,
                  applicableRoomType: coupon.applicableRoomType,
                  used: coupon.used,
                  startDate: coupon.startDate,
                  endDate: coupon.endDate,
                },
                conditions: {
                  isRoomMatch,
                  isHotelMatch,
                  isNotUsed,
                  isDateValid,
                  hotelId,
                  roomInfo: room.roomInfo,
                  todayStr,
                },
              });

              return (
                isRoomMatch &&
                isHotelMatch &&
                isNotUsed &&
                isDateValid
              );
            }
          );

          const applicableCoupons = [
            ...applicableCustomerCoupons,
            ...applicableHotelCoupons,
          ];
          console.log('[RoomSelection] Applicable coupons for room:', {
            roomInfo: room.roomInfo,
            applicableCustomerCoupons,
            applicableHotelCoupons,
            applicableCoupons,
          });

          // 중복 제거 후 가장 할인 금액이 큰 쿠폰 하나만 선택
          const uniqueCoupons = Array.from(
            new Map(applicableCoupons.map(coupon => [coupon.couponUuid, coupon])).values()
          );

          // 할인 금액이 가장 큰 쿠폰 선택
          const bestCoupon = uniqueCoupons
            .map((coupon) => {
              let discountValue = 0;
              const totalPriceForCalc = dayStayPrice * numDays;
              // 할인 값 검증: 비정상적으로 큰 값 방지
              const validatedDiscountValue = coupon.discountType === 'percentage'
                ? Math.min(Number(coupon.discountValue) || 0, 100) // 퍼센트는 100% 이하로 제한
                : Number(coupon.discountValue) || 0;

              if (coupon.discountType === 'percentage') {
                discountValue = totalPriceForCalc * (validatedDiscountValue / 100);
              } else if (coupon.discountType === 'fixed') {
                discountValue = validatedDiscountValue * numDays;
              }
              return { ...coupon, discountValue, validatedDiscountValue };
            })
            .sort((a, b) => b.discountValue - a.discountValue)[0] || null;

          // 이벤트 할인 적용
          if (discountType === 'fixed' && totalFixedDiscount > 0) {
            totalPrice = Math.max(0, totalPrice - totalFixedDiscount);
          } else if (discountType === 'percentage' && discount > 0) {
            totalPrice = Math.round(totalPrice * (1 - discount / 100));
          }

          // 이벤트 할인이 없으면 가장 큰 쿠폰의 할인 적용
          if (bestCoupon && !(discount > 0 || fixedDiscount > 0)) {
            if (bestCoupon.discountType === 'percentage') {
              couponDiscount = bestCoupon.validatedDiscountValue;
              couponDiscountType = 'percentage';
              couponDiscountValue = bestCoupon.validatedDiscountValue;
              totalPrice = Math.round(totalPrice * (1 - couponDiscount / 100));
            } else if (bestCoupon.discountType === 'fixed') {
              couponFixedDiscount = bestCoupon.validatedDiscountValue * numDays;
              couponDiscountType = 'fixed';
              couponDiscountValue = bestCoupon.validatedDiscountValue * numDays;
              totalPrice = Math.max(0, totalPrice - couponFixedDiscount);
            }
          }

          return {
            ...room,
            activeAmenities,
            photos: roomPhotosMap[key] || [],
            discount,
            fixedDiscount,
            discountType,
            eventName,
            eventUuid,
            eventStartDate,
            eventEndDate,
            totalFixedDiscount,
            dayStayPrice,
            dayUsePrice,
            applicableCoupons,
            bestCoupon, // 선택된 쿠폰 정보 저장
            couponDiscount,
            couponFixedDiscount,
            couponDiscountType,
            couponDiscountValue,
            totalPrice: totalPrice || 0,
            originalPrice: originalPrice || 0,
          };
        }
      );

      setAvailableRooms(availabilityWithAmenities);
      setIsAvailabilityChecked(true);
    } catch (error) {
      console.error('[RoomSelection] Failed to check availability:', error);
      setError(error.message || '가용 객실을 확인하지 못했습니다.');
      toast({
        title: '가용 객실 조회 실패',
        description: error.message || '가용 객실을 확인하지 못했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setShouldFetchAvailability(false);
    }
  }, [
    dateRange,
    hotelId,
    hotelSettings,
    roomPhotosMap,
    toast,
    today,
    maxDate,
    numDays,
    customerCoupons,
    hotelCoupons,
    calculateDiscount,
  ]);

  useEffect(() => {
    if (
      shouldFetchAvailability &&
      hotelSettings &&
      Object.keys(roomPhotosMap).length > 0
    ) {
      handleCheckAvailability();
      setShouldFetchAvailability(false);
    }
  }, [
    shouldFetchAvailability,
    hotelSettings,
    roomPhotosMap,
    handleCheckAvailability,
  ]);

  const handleSelectRoom = useCallback(
    (
      roomInfo,
      perNightPrice,
      discount = 0,
      fixedDiscount = 0,
      discountType = null,
      eventName = null,
      eventUuid = null,
      eventStartDate = null,
      eventEndDate = null,
      totalFixedDiscount = 0,
      couponDiscount = 0,
      couponFixedDiscount = 0,
      couponDiscountType = null,
      couponDiscountValue = 0,
      couponCode = null,
      couponUuid = null
    ) => {
      const nights = differenceInCalendarDays(
        dateRange[0].endDate,
        dateRange[0].startDate
      );
      let totalPrice = perNightPrice * nights;
      let originalPrice = totalPrice;

      // 이벤트 할인 적용
      if (discountType === 'fixed' && totalFixedDiscount > 0) {
        totalPrice = Math.max(0, totalPrice - totalFixedDiscount);
      } else if (discountType === 'percentage' && discount > 0) {
        totalPrice = Math.round(totalPrice * (1 - discount / 100));
      }

      // 쿠폰 할인 적용 (하나만 적용)
      if (couponDiscount > 0) {
        totalPrice = Math.round(totalPrice * (1 - couponDiscount / 100));
      } else if (couponFixedDiscount > 0) {
        totalPrice = Math.max(0, totalPrice - couponFixedDiscount);
      }

      if (couponUuid) {
        updateCustomerCouponsAfterUse(couponUuid);
      }

      navigate('/confirm', {
        state: {
          hotelId,
          roomInfo,
          checkIn: format(dateRange[0].startDate, 'yyyy-MM-dd'),
          checkOut: format(dateRange[0].endDate, 'yyyy-MM-dd'),
          guestCount,
          price: totalPrice,
          originalPrice,
          discount,
          fixedDiscount,
          discountType,
          eventName,
          eventUuid,
          eventStartDate,
          eventEndDate,
          numNights: nights,
          specialRequests: null,
          couponDiscount,
          couponTotalFixedDiscount: couponFixedDiscount,
          couponDiscountType,
          couponDiscountValue,
          couponCode,
          couponUuid,
        },
      });
    },
    [dateRange, hotelId, guestCount, navigate, updateCustomerCouponsAfterUse]
  );

  const handleApplyCoupon = (roomInfo, coupon) => {
    setSelectedCoupons((prev) => ({
      ...prev,
      [roomInfo]: coupon || null,
    }));
    console.log('[RoomSelection] Applied coupon for room:', {
      roomInfo,
      coupon,
    });

    const room = availableRooms.find((r) => r.roomInfo === roomInfo);
    if (!room) return;

    // 이벤트 할인과 쿠폰 할인 중복 적용 불가 검증
    if (coupon && (room.discount > 0 || room.fixedDiscount > 0)) {
      toast({
        title: '할인 중복 적용 불가',
        description: '이벤트 할인과 쿠폰 할인은 중복 적용할 수 없습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setSelectedCoupons((prev) => ({
        ...prev,
        [roomInfo]: null,
      }));
      setIsCouponModalOpen(false);
      return;
    }

    // 상태만 갱신하고 네비게이션은 하지 않음
    setIsCouponModalOpen(false);
  };

  const getRepresentativeCoupons = (coupons) => {
    const map = (coupons || []).reduce((acc, c) => {
      const typeKey = normalizeKey(c.applicableRoomType);
      const key = `${c.discountType}-${c.discountValue}-${typeKey}`;
      if (!acc[key]) acc[key] = c;
      return acc;
    }, {});
    return Object.values(map);
  };

  const openCouponModal = (roomInfo) => {
    const room = availableRooms.find((r) => r.roomInfo === roomInfo);
    if (
      !room ||
      !room.applicableCoupons ||
      room.applicableCoupons.length === 0
    ) {
      toast({
        title: '쿠폰 없음',
        description: '이 객실에 적용 가능한 쿠폰이 없습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const reps = getRepresentativeCoupons(room.applicableCoupons);
    if (reps.length === 0) {
      toast({
        title: '쿠폰 없음',
        description: '대표 쿠폰을 찾을 수 없습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCurrentRoomInfo(roomInfo);
    setApplicableCouponsForModal(reps);
    setSelectedCouponIndex(null);
    setIsCouponModalOpen(true);
  };

  const handleAddressClick = () => {
    if (hotelSettings && (hotelSettings.latitude || hotelSettings.longitude)) {
      setIsMapOpen(true);
    } else {
      toast({
        title: '위치 정보 없음',
        description: '호텔 좌표 정보를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTMapNavigation = () => {
    if (!hotelSettings?.latitude || !hotelSettings?.longitude) {
      toast({
        title: '좌표 정보 없음',
        description: '호텔 좌표를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tmapUrl = `tmap://route?goalx=${hotelSettings.longitude}&goaly=${
      hotelSettings.latitude
    }&name=${encodeURIComponent(hotelSettings?.hotelName || '호텔')}`;
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href =
          'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
      } else if (isIOS) {
        window.location.href = 'https://apps.apple.com/kr/app/tmap/id431589174';
      } else {
        toast({
          title: 'T맵 설치 필요',
          description:
            'T맵 앱이 설치되어 있지 않습니다. 설치 페이지로 이동합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 2000);
  };

  const handleCopyAddress = () => {
    if (hotelSettings && hotelSettings.address) {
      navigator.clipboard
        .writeText(hotelSettings.address)
        .then(() => {
          toast({
            title: '주소 복사 완료',
            description: '호텔 주소가 클립보드에 복사되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
          toast({
            title: '주소 복사 실패',
            description: `주소를 복사하는 데 실패했습니다: ${error.message}`,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  };

  const handleDateSelectionDone = () => {
    setIsOpen(false);
    setShouldFetchAvailability(true);
  };

  const memoizedRooms = useMemo(() => {
    return availableRooms.map((room, index) => {
      const selectedCoupon = selectedCoupons[room.roomInfo];
      let totalPrice = Number(room.totalPrice) || 0;
      let originalPrice = Number(room.originalPrice) || 0;
      let couponDiscount = 0; // 초기화
      let couponFixedDiscount = 0; // 초기화
      let couponDiscountType = null;
      let couponDiscountValue = 0;

      // 고객이 선택한 쿠폰이 있으면 해당 쿠폰으로 교체
      if (selectedCoupon) {
        if (room.discount > 0 || room.fixedDiscount > 0) {
          totalPrice = originalPrice;
          couponDiscount = 0;
          couponFixedDiscount = 0;
          couponDiscountType = null;
          couponDiscountValue = 0;
        } else if (selectedCoupon.discountType === 'percentage') {
          couponDiscount = Math.min(Number(selectedCoupon.discountValue) || 0, 100);
          couponFixedDiscount = 0;
          couponDiscountType = 'percentage';
          couponDiscountValue = couponDiscount;
          totalPrice = Math.round(originalPrice * (1 - couponDiscount / 100));
        } else if (selectedCoupon.discountType === 'fixed') {
          couponFixedDiscount = (Number(selectedCoupon.discountValue) || 0) * numDays;
          couponDiscount = 0;
          couponDiscountType = 'fixed';
          couponDiscountValue = couponFixedDiscount;
          totalPrice = Math.max(0, originalPrice - couponFixedDiscount);
        }
      } else {
        // 선택한 쿠폰이 없으면 bestCoupon 기준으로 설정
        couponDiscount = Number(room.couponDiscount) || 0;
        couponFixedDiscount = Number(room.couponFixedDiscount) || 0;
        couponDiscountType = room.couponDiscountType;
        couponDiscountValue = Number(room.couponDiscountValue) || 0;
      }

      return {
        ...room,
        totalPrice,
        originalPrice,
        couponDiscount,
        couponFixedDiscount,
        couponDiscountType,
        couponDiscountValue,
        onSelect: () => {
          const applied = selectedCoupons[room.roomInfo] || null;
          handleSelectRoom(
            room.roomInfo,
            room.dayStayPrice,
            room.discount,
            room.fixedDiscount,
            room.discountType,
            room.eventName,
            room.eventUuid,
            room.eventStartDate,
            room.eventEndDate,
            room.totalFixedDiscount,
            applied?.discountType === 'percentage' ? applied.discountValue : 0,
            applied?.discountType === 'fixed' ? applied.discountValue * numDays : 0,
            applied?.discountType,
            applied?.discountType === 'percentage' ? applied.discountValue : applied?.discountType === 'fixed' ? applied.discountValue * numDays : 0,
            applied?.code,
            applied?.couponUuid
          );
        },
        uniqueKey: `${room.roomInfo}-${index}-${room.dayStayPrice}`,
      };
    });
  }, [availableRooms, selectedCoupons, numDays, handleSelectRoom]);

  if (error) {
    return (
      <Container maxW="100%" w="100%" p={4}>
        <VStack spacing={4} align="stretch">
          <Text color="red.500" textAlign="center">
            {error}
          </Text>
          <Button colorScheme="blue" onClick={() => navigate('/hotels')}>
            호텔 목록으로 돌아가기
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container
      maxW="100%"
      w="100%"
      p={0}
      h="100vh"
      display="flex"
      flexDirection="column"
      bg="gray.50"
      overflow="hidden"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflowX="hidden"
    >
      <Box
        w="100%"
        py={3}
        px={{ base: 2, sm: 3 }}
        bg="white"
        position="sticky"
        top={0}
        zIndex={2}
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Flex align="center" justify="space-between" flexWrap="nowrap">
          <Flex align="center" maxWidth={{ base: '60%', md: '70%' }}>
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              color="gray.700"
              mr={2}
            />
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              fontWeight="700"
              color="gray.900"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {hotelSettings?.hotelName || '객실 선택'}
            </Text>
            {hotelSettings && (
              <Button
                variant="ghost"
                color="gray.700"
                onClick={handleAddressClick}
                _hover={{ color: 'blue.500', bg: 'blue.50' }}
                size="sm"
                ml={2}
                p={0}
              >
                <FaMapMarkerAlt size={14} />
              </Button>
            )}
          </Flex>
          <HStack spacing={2}>
            <Button
              variant="solid"
              colorScheme="gray"
              size="sm"
              fontWeight="400"
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={() => {
                const next =
                  sortMode === 'event'
                    ? 'asc'
                    : sortMode === 'asc'
                    ? 'desc'
                    : 'event';
                let sorted;
                if (next === 'event') {
                  sorted = [...availableRooms].sort((a, b) => {
                    const ea = a.eventName ? 1 : 0;
                    const eb = b.eventName ? 1 : 0;
                    if (ea !== eb) return eb - ea;
                    const aDiscount = a.fixedDiscount || a.discount || 0;
                    const bDiscount = b.fixedDiscount || b.discount || 0;
                    return bDiscount - aDiscount;
                  });
                } else if (next === 'asc') {
                  sorted = [...availableRooms].sort(
                    (a, b) => a.dayStayPrice - b.dayStayPrice
                  );
                } else {
                  sorted = [...availableRooms].sort(
                    (a, b) => b.dayStayPrice - b.dayStayPrice
                  );
                }
                setAvailableRooms(sorted);
                setSortMode(next);
                const labels = {
                  event: '이벤트 우선 정렬',
                  asc: '가격 낮은순 정렬',
                  desc: '가격 높은순 정렬',
                };
                toast({
                  title: labels[next],
                  status: 'success',
                  duration: 2000,
                  isClosable: true,
                });
              }}
              _hover={{ bg: 'gray.300' }}
              whiteSpace="nowrap"
            >
              {sortMode === 'event'
                ? '이벤트'
                : sortMode === 'asc'
                ? '가격 낮은순'
                : '가격 높은순'}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Box
        w="100%"
        bg="white"
        position="sticky"
        top="60px"
        zIndex={1}
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
        p={{ base: 2, sm: 3 }}
      >
        <VStack spacing={2}>
          <Box w="100%">
            <Popover
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              closeOnBlur={false}
              placement="bottom"
              matchWidth
            >
              <PopoverTrigger>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <CalendarIcon color="gray.600" />
                  </InputLeftElement>
                  <Input
                    readOnly
                    value={`${startLabel || '체크인'} ~ ${
                      endLabel || '체크아웃'
                    } (${numDays}박)`}
                    onClick={() => setIsOpen(true)}
                    placeholder="체크인 - 체크아웃"
                    bg="white"
                    color="gray.800"
                    fontWeight="500"
                    fontSize={{ base: 'sm', md: 'md' }}
                    _hover={{ borderColor: 'blue.500' }}
                  />
                </InputGroup>
              </PopoverTrigger>
              <PopoverContent
                width={{ base: '95vw', md: 'auto' }}
                maxWidth="95vw"
                border="none"
                boxShadow="xl"
                _focus={{ boxShadow: 'xl' }}
                bg="white"
              >
                <PopoverArrow />
                <PopoverBody p={0}>
                  <Box
                    className="custom-calendar-wrapper"
                    sx={{
                      '.rdrCalendarWrapper': {
                        width: '100%',
                        fontSize: { base: '12px', md: '14px' },
                        bg: 'white',
                      },
                      '.rdrMonth': {
                        width: '100%',
                      },
                      '.rdrDateDisplayWrapper': {
                        background: 'none',
                      },
                      '.rdrDayToday .rdrDayNumber span:after': {
                        background: 'blue.500',
                      },
                      '.rdrDateRangePickerWrapper': {
                        p: 2,
                      },
                      '@media (max-width: 480px)': {
                        '.rdrCalendarWrapper, .rdrMonth': {
                          width: '100%',
                        },
                        '.rdrDateRangeWrapper': {
                          flexDirection: 'column',
                        },
                      },
                    }}
                  >
                    <DateRange
                      onChange={(item) => {
                        setDateRange([item.selection]);
                      }}
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                      months={window.innerWidth > 768 ? 2 : 1}
                      direction={
                        window.innerWidth > 768 ? 'horizontal' : 'vertical'
                      }
                      minDate={today}
                      maxDate={maxDate}
                      locale={ko}
                      rangeColors={['#3182CE']}
                      showSelectionPreview={true}
                      showDateDisplay={true}
                      editableDateInputs={true}
                      retainEndDateOnFirstSelection={true}
                    />
                    <Flex justify="flex-end" p={2}>
                      <Button
                        colorScheme="blue"
                        size="sm"
                        onClick={handleDateSelectionDone}
                      >
                        닫기
                      </Button>
                    </Flex>
                  </Box>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </Box>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">
            최대 3개월 이내의 날짜만 예약 가능합니다.
          </Text>
        </VStack>
      </Box>

      <Box
        flex="1"
        overflowY="auto"
        px={{ base: 2, sm: 0 }}
        pb="200px"
        overflowX="hidden"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {isLoading || isCouponsLoading ? (
          <VStack
            flex="1"
            justify="center"
            align="center"
            bg="white"
            rounded="md"
            shadow="sm"
            p={6}
          >
            <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
              객실 및 쿠폰 로드 중...
            </Text>
          </VStack>
        ) : isAvailabilityChecked && availableRooms.length === 0 ? (
          <Box bg="white" rounded="md" shadow="sm" p={6}>
            <Text
              textAlign="center"
              color="gray.500"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              선택하신 기간({startLabel} ~ {endLabel})에 이용 가능한 객실이
              없습니다.
              <br />
              다른 날짜를 선택해 주세요.
            </Text>
          </Box>
        ) : (
          isAvailabilityChecked && (
            <VStack spacing={0} align="stretch" w="100%">
              {memoizedRooms.map((room, index) => {
                const repCoupons = getRepresentativeCoupons(room.applicableCoupons);
                const originalTotalPrice = Number(room.originalPrice) || 0;
                const displayedAmenities = (room.activeAmenities || []).slice(0, 2);
                const remainingAmenities = (room.activeAmenities || []).length - 2;
                const photos = room.photos || [];
                const currentIndex = currentPhotoIndices[room.roomInfo.toLowerCase()] || 0;
                const photoCount = photos.length;

                return (
                  <Box key={room.uniqueKey} w="100%">
                    <Flex align="center" px={{ base: 3, sm: 4 }} py={4} bg="white" minH="120px">
                      <Box position="relative">
                        <Image
                          src={photos[currentIndex]?.photoUrl || '/assets/default-room.jpg'}
                          alt={room.roomInfo}
                          w={{ base: '80px', sm: '100px' }}
                          h={{ base: '100px', sm: '130px' }}
                          objectFit="cover"
                          borderRadius="md"
                          mr={{ base: 3, sm: 4 }}
                          onError={(e) => (e.target.src = '/assets/default-room.jpg')}
                          onClick={(e) => {
                            e.stopPropagation();
                            room.onSelect();
                          }}
                          cursor="pointer"
                        />
                        {photoCount > 1 && (
                          <Flex
                            position="absolute"
                            bottom="2"
                            left="50%"
                            transform="translateX(-50%)"
                            gap="2"
                          >
                            {photos.map((_, idx) => (
                              <Box
                                key={idx}
                                w="8px"
                                h="8px"
                                borderRadius="full"
                                bg={idx === currentIndex ? 'white' : 'whiteAlpha.600'}
                                boxShadow="0 0 2px rgba(0,0,0,0.5)"
                              />
                            ))}
                          </Flex>
                        )}
                      </Box>
                      <VStack align="start" flex="1" spacing={1}>
                        <Flex justify="space-between" w="100%" align="center" px={0}>
                          <Flex align="center" gap={2}>
                            <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700">{room.roomInfo}</Text>
                            {room.eventName && (
                              <Badge colorScheme="teal" fontSize={{ base: 'xs', md: 'sm' }}>{room.eventName}</Badge>
                            )}
                          </Flex>
                          {repCoupons.length > 0 && (
                            <Button
                              variant="outline"
                              colorScheme="teal"
                              size="xs"
                              px={2}
                              py={1}
                              fontSize="xs"
                              mr={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                openCouponModal(room.roomInfo);
                              }}
                              leftIcon={<FaTag />}
                            >
                              {repCoupons.length}개 쿠폰
                            </Button>
                          )}
                        </Flex>
                        <Text fontSize="sm" color="gray.600">
                          대실 3시간 | 숙박 {hotelSettings?.checkInTime || '17:00'} 체크인
                        </Text>
                        <Flex justify="space-between" w="100%" align="center">
                          <VStack align="start" spacing={0}>
                            <Flex align="center" gap={1}>
                              {(room.discount > 0 ||
                                room.fixedDiscount > 0 ||
                                room.couponDiscount > 0 ||
                                room.couponFixedDiscount > 0) && (
                                <Text
                                  fontSize={{ base: 'xs', md: 'sm' }}
                                  color="gray.500"
                                  textDecoration="line-through"
                                  mr={1}
                                >
                                  ₩{(originalTotalPrice || 0).toLocaleString()}
                                </Text>
                              )}
                              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="600" color="blue.500">
                                ₩{(room.totalPrice || 0).toLocaleString()}
                              </Text>
                            </Flex>
                            {(room.discount > 0 || room.fixedDiscount > 0) && (
                              <Text fontSize="xs" color="red.500">
                                {room.discountType === 'fixed' && (room.fixedDiscount ?? 0) > 0
                                  ? `이벤트 ₩${(room.fixedDiscount ?? 0).toLocaleString()}원 할인`
                                  : room.discount > 0
                                  ? `이벤트 ${room.discount}% 할인`
                                  : null}
                              </Text>
                            )}
                            {(room.couponDiscount > 0 || room.couponFixedDiscount > 0) && (
                              <Text fontSize="xs" color="red.500">
                                {room.couponDiscountType === 'percentage'
                                  ? `쿠폰 ${(room.couponDiscountValue ?? 0)}% 할인`
                                  : `쿠폰 ₩${(room.couponDiscountValue ?? 0).toLocaleString()}원 할인`}
                              </Text>
                            )}
                          </VStack>
                          <Text fontSize="xs" color="red.500">
                            {(room.availableRooms || room.stock || 0) === 0
                              ? '객실 마감'
                              : `남은 객실 ${room.availableRooms || room.stock || 0}개`}
                          </Text>
                        </Flex>
                        <Flex justify="space-between" w="100%" align="center">
                          <Flex display="inline-flex" align="center" gap={1}>
                            {displayedAmenities.map((amenity, idx) => (
                              <Box key={idx} color="gray.500">
                                {mapIconNameToComponent(amenity.icon)}
                              </Box>
                            ))}
                            {remainingAmenities > 0 && (
                              <Text fontSize="xs" color="gray.500">
                                +{remainingAmenities}
                              </Text>
                            )}
                          </Flex>
                          <Button
                            colorScheme="blue"
                            size="xs"
                            px={2}
                            py={1}
                            fontSize="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              room.onSelect();
                            }}
                          >
                            선택하기
                          </Button>
                        </Flex>
                      </VStack>
                    </Flex>
                    {index < memoizedRooms.length - 1 && (
                      <Divider borderColor="gray.300" borderWidth="1.5px" />
                    )}
                  </Box>
                );
              })}
            </VStack>
          )
        )}
      </Box>

      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        size={{ base: 'sm', md: 'lg' }}
      >
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader bg="gray.100" borderTopRadius="xl">
            적용 가능한 쿠폰
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={4}>
            {applicableCouponsForModal.length > 0 ? (
              <VStack spacing={3}>
                {applicableCouponsForModal.map((coupon, index) => (
                  <Box
                    key={coupon.couponUuid}
                    w="100%"
                    border={
                      selectedCouponIndex === index ? '2px solid' : '1px solid'
                    }
                    borderColor={
                      selectedCouponIndex === index ? 'blue.500' : 'gray.200'
                    }
                    borderRadius="lg"
                    onClick={() => setSelectedCouponIndex(index)}
                    cursor="pointer"
                    p={3}
                    transition="all 0.2s"
                    _hover={{ bg: 'gray.50' }}
                  >
                    <CouponCard
                      name={coupon.name}
                      discountType={coupon.discountType}
                      discountValue={coupon.discountValue}
                      endDate={coupon.endDate}
                      applicableRoomType={coupon.applicableRoomType}
                      couponCode={coupon.code}
                      onApply={() => handleApplyCoupon(currentRoomInfo, coupon)}
                    />
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500" textAlign="center">
                적용 가능한 쿠폰이 없습니다.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              colorScheme="gray"
              size="md"
              onClick={() => {
                setSelectedCoupons((prev) => ({
                  ...prev,
                  [currentRoomInfo]: null,
                }));
                setIsCouponModalOpen(false);
              }}
              width="100%"
              borderRadius="lg"
            >
              쿠폰 사용 안함
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} size={{ base: 'sm', md: 'lg' }}>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader bg="gray.100" borderTopRadius="xl">
            호텔 위치
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" mb={2}>
              호텔 ID: {hotelId}
            </Text>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" mb={4}>
              주소: {hotelSettings?.address || '주소 정보 없음'}
            </Text>
            <Box h={{ base: '300px', md: '400px' }} w="100%">
              <Suspense fallback={<Text>지도 로딩 중...</Text>}>
                <HotelMap
                  address={hotelSettings?.address}
                  latitude={hotelSettings?.latitude}
                  longitude={hotelSettings?.longitude}
                  onCoordinatesChange={() => {}}
                />
              </Suspense>
            </Box>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button
                variant="outline"
                color="teal.600"
                leftIcon={<FaMapSigns />}
                onClick={handleTMapNavigation}
                fontSize={{ base: 'sm', md: 'md' }}
                borderRadius="lg"
              >
                T맵으로 길찾기
              </Button>
              <Button
                variant="outline"
                color="gray.600"
                leftIcon={<FaCopy />}
                onClick={handleCopyAddress}
                fontSize={{ base: 'sm', md: 'md' }}
                borderRadius="lg"
              >
                주소 복사
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => setIsMapOpen(false)}
                fontSize={{ base: 'sm', md: 'md' }}
                borderRadius="lg"
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

export default RoomSelection;