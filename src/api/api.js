// src/api/api.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import ApiError from '../utils/ApiError';
import { getDeviceToken } from '../utils/device';

// 환경별 API 기본 URL 설정
const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://staysync.org'
    : 'http://localhost:3004');

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// axios-retry 설정
axiosRetry(api, {
  retries: 3,
  retryCondition: (err) => {
    if (err.config.url?.includes('/login/social/kakao')) {
      return false;
    }
    return axiosRetry.isNetworkError(err) || err.response?.status >= 500;
  },
});

// 에러 핸들링 통일
const handleApiError = (error, defaultMessage) => {
  const status = error.response?.status || 500;
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  throw new ApiError(status, message, error.response?.data);
};

// 토큰 및 CSRF 관련 유틸리티 함수
const getCustomerToken = () => localStorage.getItem('customerToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const getCsrfToken = () => localStorage.getItem('csrfToken');
const getCsrfTokenId = () => localStorage.getItem('csrfTokenId');

// 로깅 레벨 조정: 개발 환경에서만 디버그 로그 출력
const logDebug = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// 요청 인터셉터
api.interceptors.request.use(
  async (config) => {
    const requestBaseUrl = config.url.split('?')[0];
    logDebug('[api.js] Request URL:', `${BASE_URL}${config.url}`);
    logDebug('[api.js] Request Body:', config.data);

    const token = getCustomerToken();
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
      logDebug(`[api.js] Setting Authorization header: Bearer ${token}`);
    } else {
      logDebug('[api.js] No customerToken found in localStorage');
      const noRedirectRoutes = [
        '/api/customer/refresh-token',
        '/api/customer/login',
        '/api/customer/login/social/kakao',
        '/api/customer/register',
        '/api/customer/check-duplicate',
        '/api/csrf-token',
        '/api/customer/activate-account',
        '/api/customer/send-otp',
        '/api/customer/verify-otp',
        '/api/customer/send-phone-otp',
        '/api/customer/verify-phone-otp',
      ];
      if (!noRedirectRoutes.includes(requestBaseUrl)) {
        throw new ApiError(401, 'No customer token available');
      }
    }

    const isSafeMethod = ['get', 'head', 'options'].includes(config.method);
    const isCsrfTokenRequest = config.url === '/api/csrf-token';
    const skipCsrfRoutes = [
      '/api/customer/register',
      '/api/customer/login',
      '/api/customer/login/social/kakao',
      '/api/customer/check-duplicate',
      '/api/customer/activate-account',
      '/api/hotel-settings/photos',
      '/api/customer/logout',
      '/api/customer/refresh-token',
      '/api/customer/send-phone-otp',
      '/api/customer/verify-phone-otp',
    ];
    const skipCsrf =
      config.skipCsrf ||
      skipCsrfRoutes.includes(requestBaseUrl) ||
      isSafeMethod;

    if (!isSafeMethod && !isCsrfTokenRequest && !skipCsrf) {
      let csrfToken = getCsrfToken();
      let csrfTokenId = getCsrfTokenId();
      if (!csrfToken || !csrfTokenId) {
        logDebug('[api.js] Fetching CSRF token');
        const startTime = Date.now();
        const { data } = await api.get('/api/csrf-token', { skipCsrf: true });
        const endTime = Date.now();
        logDebug(`[api.js] CSRF token fetched in ${endTime - startTime}ms`);
        csrfToken = data.csrfToken;
        csrfTokenId = data.tokenId;
        localStorage.setItem('csrfToken', csrfToken);
        localStorage.setItem('csrfTokenId', csrfTokenId);
      }
      config.headers['X-CSRF-Token'] = csrfToken;
      config.headers['X-CSRF-Token-Id'] = csrfTokenId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retryCount &&
      originalRequest.url !== '/api/customer/login' &&
      originalRequest.url !== '/api/customer/login/social/kakao' &&
      originalRequest.url !== '/api/customer/register'
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        // 없으면 새로 만들어서 로컬에 저장까지 해줍니다
        const deviceToken = getDeviceToken();

        // 이제 deviceToken 유무는 체크하지 않고, refreshToken만 검사
        if (!refreshToken) {
          localStorage.removeItem('customerToken');
          localStorage.removeItem('refreshToken');
          // deviceToken은 남겨둡니다!
          localStorage.removeItem('phoneNumber');
          localStorage.removeItem('csrfToken');
          localStorage.removeItem('csrfTokenId');
          window.location.href = '/login';
          throw new ApiError(401, '리프레시 토큰이 없습니다.');
        }

        const response = await api.post(
          '/api/customer/refresh-token',
          { refreshToken, deviceToken },
          { headers: { Authorization: undefined }, skipCsrf: true }
        );
        const { token } = response.data;

        localStorage.setItem('customerToken', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('refreshToken');
        // deviceToken은 남겨둡니다!
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenId');
        window.location.href = '/login';
        throw new ApiError(401, err.message || '토큰 갱신 실패');
      } finally {
        isRefreshing = false;
      }
    }

    // 401 외에는 그냥 에러 던져줍니다
    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || '서버 오류',
      error.response?.data
    );
  }
);

// 리프레시 토큰 API
export const refreshCustomerToken = async ({ refreshToken, deviceToken }) => {
  try {
    const response = await api.post(
      '/api/customer/refresh-token',
      { refreshToken, deviceToken },
      { headers: { Authorization: undefined }, skipCsrf: true }
    );
    logDebug('[api.js] refreshCustomerToken response:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '토큰 갱신 실패');
  }
};

// 로그인 API
export const customerLogin = async (data) => {
  try {
    const response = await api.post('/api/customer/login', data);
    const { token, refreshToken } = response.data;
    localStorage.setItem('customerToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    logDebug(`[api.js] Stored customerToken: ${token}`);
    logDebug(`[api.js] Stored refreshToken: ${refreshToken}`);
    return response.data;
  } catch (error) {
    handleApiError(error, '로그인 실패');
  }
};

// 소셜 로그인 API
export const customerLoginSocial = async (provider, data) => {
  try {
    const endpoint = `/api/customer/login/social/${provider}`;
    logDebug(`[api.js] Social login start - Provider: ${provider}`);
    logDebug(`[api.js] Current environment: ${process.env.NODE_ENV}`);
    logDebug(`[api.js] API base URL: ${BASE_URL}`);

    if (!data || !data.code) {
      throw new ApiError(400, `${provider} 인증 코드가 없습니다.`);
    }

    const codeString = String(data.code);
    const requestData = { code: codeString, provider };
    const response = await api.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    logDebug('[api.js] Social login successful response:', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, '소셜 로그인 처리 중 오류가 발생했습니다.');
  }
};

// 소셜 계정 연결 API
export const connectSocialAccount = async (provider, socialData) => {
  try {
    const response = await api.post(
      `/api/customer/connect-social/${provider}`,
      socialData
    );
    const redirectUrl = response.data.redirectUrl;
    if (!redirectUrl) throw new ApiError(400, '리다이렉트 URL이 없습니다.');
    const urlParams = new URLSearchParams(redirectUrl.split('?')[1]);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');
    if (!token || !refreshToken) {
      throw new ApiError(400, '토큰 또는 리프레시 토큰이 없습니다.');
    }
    localStorage.setItem('customerToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    logDebug(`[api.js] Stored customerToken (social connect): ${token}`);
    logDebug(`[api.js] Stored refreshToken (social connect): ${refreshToken}`);
    return response.data;
  } catch (error) {
    handleApiError(error, '소셜 계정 연결 실패');
  }
};

// 동의 항목 수정 API
export const updateCustomer = async ({ name, nickname, agreements } = {}) => {
  try {
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (nickname !== undefined) payload.nickname = nickname;
    if (agreements !== undefined) payload.agreements = agreements;

    console.log('[api.js] updateCustomer payload:', payload);
    const response = await api.put('/api/customer/update', payload);
    console.log('[api.js] updateCustomer response:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '고객 정보 업데이트 실패');
  }
};

// 동의 내역 조회 API
export const getAgreements = async () => {
  try {
    const response = await api.get('/api/customer/agreements');
    return response.data;
  } catch (error) {
    handleApiError(error, '동의 내역 조회 실패');
  }
};

// 호텔 목록 조회 API
export const fetchHotelList = async () => {
  try {
    const response = await api.get('/api/customer/hotel-list');
    logDebug('[api.js] fetchHotelList raw response:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '호텔 목록 조회 실패');
  }
};

// 호텔 설정 조회 API
export const fetchCustomerHotelSettings = async (hotelId, options = {}) => {
  try {
    const params = { hotelId };
    if (options.checkIn && options.checkOut) {
      params.checkIn = options.checkIn;
      params.checkOut = options.checkOut;
    }
    const response = await api.get('/api/customer/hotel-settings', { params });
    const hotelData = {
      ...response.data,
      latitude: response.data.latitude || null,
      longitude: response.data.longitude || null,
      roomTypes:
        response.data.roomTypes?.map((rt) => ({
          ...rt,
          appliedDiscount: rt.appliedDiscount || 0,
          appliedFixedDiscount: rt.appliedFixedDiscount || 0,
          appliedEvent: rt.appliedEvent || null,
        })) || [],
    };
    logDebug('[api.js] fetchCustomerHotelSettings response:', hotelData);
    return hotelData;
  } catch (error) {
    handleApiError(error, '호텔 설정 조회 실패');
  }
};

// 호텔 사진 조회 API
export const fetchHotelPhotos = async (hotelId, category, subCategory) => {
  try {
    const startTime = Date.now();
    const response = await api.get('/api/hotel-settings/photos', {
      params: { hotelId, category, subCategory },
    });
    const endTime = Date.now();
    logDebug(
      `[api.js] fetchHotelPhotos for hotelId ${hotelId} took ${
        endTime - startTime
      }ms`
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '호텔 사진 불러오기 실패');
  }
};

// 호텔 가용성 조회 API
export const fetchHotelAvailability = async (hotelId, checkIn, checkOut) => {
  try {
    const response = await api.get('/api/customer/hotel-availability', {
      params: { hotelId, checkIn, checkOut },
    });
    const availabilityData = {
      ...response.data,
      availability:
        response.data.availability?.map((room) => ({
          ...room,
          discount: room.discount || 0,
          fixedDiscount: room.fixedDiscount || 0,
          discountType: room.discountType || null,
        })) || [],
    };
    return availabilityData;
  } catch (error) {
    handleApiError(error, '호텔 가용성 조회 실패');
  }
};

// 예약 생성 API
export const createReservation = async (finalReservationData) => {
  try {
    const response = await api.post('/api/customer/reservation', {
      hotelId: finalReservationData.hotelId,
      roomInfo: finalReservationData.roomInfo,
      checkIn: finalReservationData.checkIn,
      checkOut: finalReservationData.checkOut,
      price: finalReservationData.price,
      originalPrice: finalReservationData.originalPrice,
      discount: finalReservationData.discount,
      fixedDiscount: finalReservationData.fixedDiscount,
      discountType: finalReservationData.discountType,
      eventName: finalReservationData.eventName,
      eventUuid: finalReservationData.eventUuid,
      specialRequests: finalReservationData.specialRequests,
      couponUuid: finalReservationData.couponUuid,
      couponDiscount: finalReservationData.couponDiscount,
      couponFixedDiscount: finalReservationData.couponFixedDiscount,
      couponTotalFixedDiscount: finalReservationData.couponTotalFixedDiscount,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, '예약 저장 실패');
  }
};

// 예약 히스토리 조회 API
export const getReservationHistory = async () => {
  try {
    const response = await api.get('/api/customer/history');
    if (!response.data || typeof response.data !== 'object') {
      throw new ApiError(500, 'Invalid response format');
    }
    if (!Array.isArray(response.data.history)) {
      throw new ApiError(500, 'History is not an array');
    }
    const reservations = (response.data.history || []).map((reservation) => ({
      ...reservation,
      price: typeof reservation.price === 'number' ? reservation.price : 0,
      hotelName: reservation.hotelName || '알 수 없음',
      checkIn: reservation.checkIn || '',
      checkOut: reservation.checkOut || '',
      latitude: reservation.latitude || null,
      longitude: reservation.latitude || null,
    }));
    return {
      history: reservations,
      totalVisits: response.data.totalVisits || 0,
    };
  } catch (error) {
    handleApiError(error, '예약 히스토리 조회 실패');
  }
};

// 예약 취소 API
export const cancelReservation = async (reservationId) => {
  try {
    logDebug(`[api.js] Cancelling reservation: ${reservationId}`);
    const response = await api.delete(
      `/api/customer/reservation/${reservationId}`
    );
    logDebug('[api.js] Cancel reservation response:', response.data);

    // 취소 후 쿠폰 목록 갱신
    const updatedCoupons = await fetchCustomerCoupons();
    logDebug('[api.js] Updated coupons after cancellation:', updatedCoupons);

    return {
      ...response.data,
      updatedCoupons,
    };
  } catch (error) {
    logDebug('[api.js] Cancel reservation error:', error);
    handleApiError(error, '예약 취소에 실패했습니다. 다시 시도해 주세요.');
  }
};

// 로그아웃 API
export const logoutCustomer = async () => {
  try {
    const token = getCustomerToken();
    if (!token) {
      logDebug('[api.js] No customerToken found, already logged out');
      return { redirect: '/login' };
    }
    const response = await api.post(
      '/api/customer/logout',
      {},
      { skipCsrf: true }
    );
    return { redirect: '/login', ...response.data };
  } catch (error) {
    handleApiError(error, '로그아웃 실패');
  } finally {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('csrfTokenId');
    logDebug(
      'Logout completed, refreshToken retained:',
      localStorage.getItem('refreshToken')
    );
  }
};

// 전화번호 인증 OTP 발송 API
export const sendPhoneOTP = async (phoneNumber) => {
  try {
    const response = await api.post('/api/customer/send-phone-otp', {
      phoneNumber,
    });
    logDebug('[api.js] sendPhoneOTP response:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '전화번호 인증 OTP 발송 실패');
  }
};

// 전화번호 인증 OTP 검증 API
export const verifyPhoneOTP = async (phoneNumber, otp) => {
  try {
    const response = await api.post('/api/customer/verify-phone-otp', {
      phoneNumber,
      otp,
    });
    logDebug('[api.js] verifyPhoneOTP response:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, '전화번호 인증 OTP 검증 실패');
  }
};

// 고객의 쿠폰 보관함 조회 API
export const fetchCustomerCoupons = async () => {
  try {
    const response = await api.get('/api/customer/coupons/wallet');
    console.log('[fetchCustomerCoupons] Raw response:', response.data);
    const coupons = response.data.coupons || [];
    console.log('[fetchCustomerCoupons] Processed coupons:', coupons);
    return coupons;
  } catch (error) {
    handleApiError(error, '쿠폰 보관함 조회 실패');
  }
};

// 쿠폰 사용 API
export const useCoupon = async ({ couponUuid, reservationId }) => {
  try {
    logDebug(
      `[api.js] Using coupon: ${couponUuid} for reservation: ${reservationId}`
    );
    const response = await api.post('/api/customer/coupons/use', {
      couponUuid,
      reservationId,
    });
    logDebug('[api.js] Use coupon response:', response.data);

    // 쿠폰 사용 후 쿠폰 목록 갱신
    const updatedCoupons = await fetchCustomerCoupons();
    logDebug('[api.js] Updated coupons after use:', updatedCoupons);

    return {
      ...response.data,
      updatedCoupons,
    };
  } catch (error) {
    logDebug('[api.js] Use coupon error:', error);
    handleApiError(error, '쿠폰 사용 실패');
  }
};

// 쿠폰 복원 API
export const restoreCoupon = async ({ couponUuid }) => {
  try {
    logDebug(`[api.js] Restoring coupon: ${couponUuid}`);
    const response = await api.post('/api/customer/coupons/restore', {
      couponUuid,
    });
    logDebug('[api.js] Restore coupon response:', response.data);

    // 쿠폰 복원 후 쿠폰 목록 갱신
    const updatedCoupons = await fetchCustomerCoupons();
    logDebug('[api.js] Updated coupons after restore:', updatedCoupons);

    return {
      ...response.data,
      updatedCoupons,
    };
  } catch (error) {
    logDebug('[api.js] Restore coupon error:', error);
    handleApiError(error, '쿠폰 복원 실패');
  }
};

// 방문 횟수 증가 API
export const incrementVisit = async () => {
  try {
    const response = await api.post('/api/customer/visits/increment', {});
    return response.data;
  } catch (error) {
    handleApiError(error, '방문 횟수 증가 실패');
  }
};

// 방문 횟수 감소 API
export const decrementVisit = async () => {
  try {
    const response = await api.post('/api/customer/visits/decrement', {});
    return response.data;
  } catch (error) {
    handleApiError(error, '방문 횟수 감소 실패');
  }
};

export const fetchAvailableCoupons = async () => {
  try {
    const response = await api.get('/api/customer/available-coupons');
    logDebug('[api.js] fetchAvailableCoupons response:', response.data);
    const available = response.data.coupons || [];
    return available;
  } catch (error) {
    handleApiError(error, '사용 가능 쿠폰 조회 실패');
  }
};

export { getCustomerToken, getCsrfToken, getCsrfTokenId };
export default api;