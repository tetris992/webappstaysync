import axios from 'axios';
import axiosRetry from 'axios-retry';
import ApiError from '../utils/ApiError';

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://staysync.org'
    : 'http://localhost:3004');

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

axiosRetry(api, { retries: 3, retryDelay: (retryCount) => retryCount * 1000 });

const handleApiError = (error, defaultMessage) => {
  const status = error.response?.status || 500;
  const message =
    error.response?.data?.message || error.message || defaultMessage;
  throw new ApiError(status, message, error.response?.data);
};

const getCustomerToken = () => localStorage.getItem('customerToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const getCsrfToken = () => localStorage.getItem('csrfToken');
const getCsrfTokenId = () => localStorage.getItem('csrfTokenId');

api.interceptors.request.use(
  async (config) => {
    console.log('[api.js] Request URL:', `${BASE_URL}${config.url}`);
    console.log('[api.js] Request Body:', config.data);
    const token = getCustomerToken();
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[api.js] Setting Authorization header: Bearer ${token}`);
    } else {
      console.log('[api.js] No customerToken found in localStorage');
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
      if (!noRedirectRoutes.includes(config.url)) {
        throw new ApiError(401, 'No customer token available');
      }
    }

    const isGetRequest = config.method === 'get';
    const isCsrfTokenRequest = config.url === '/api/csrf-token';
    const skipCsrfRoutes = [
      '/api/customer/register',
      '/api/customer/login',
      '/api/customer/login/social/kakao',
      '/api/customer/check-duplicate',
      '/api/customer/activate-account',
      '/api/hotel-settings/photos',
      '/api/customer/logout',
      '/api/customer/send-phone-otp',
      '/api/customer/verify-phone-otp',
    ];
    const skipCsrf =
      config.skipCsrf || skipCsrfRoutes.includes(config.url) || isGetRequest;

    if (!isGetRequest && !isCsrfTokenRequest && !skipCsrf) {
      let csrfToken = getCsrfToken();
      let csrfTokenId = getCsrfTokenId();
      if (!csrfToken || !csrfTokenId) {
        console.log('[api.js] Fetching CSRF token');
        const startTime = Date.now();
        const { data } = await api.get('/api/csrf-token', { skipCsrf: true });
        const endTime = Date.now();
        console.log(`[api.js] CSRF token fetched in ${endTime - startTime}ms`);
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
      !originalRequest._retry &&
      originalRequest.url !== '/api/customer/login' &&
      originalRequest.url !== '/api/customer/login/social/kakao' &&
      originalRequest.url !== '/api/customer/register'
    ) {
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

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const deviceToken = localStorage.getItem('deviceToken');
        if (!refreshToken || !deviceToken) {
          localStorage.removeItem('customerToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('deviceToken');
          localStorage.removeItem('phoneNumber');
          localStorage.removeItem('csrfToken');
          localStorage.removeItem('csrfTokenId');
          window.location.href = '/login';
          throw new ApiError(
            401,
            '리프레시 토큰 또는 디바이스 토큰이 없습니다.'
          );
        }
        const response = await api.post(
          '/api/customer/refresh-token',
          { refreshToken, deviceToken },
          { headers: { Authorization: undefined } }
        );
        const { token } = response.data;
        localStorage.setItem('customerToken', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('deviceToken');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenId');
        window.location.href = '/login';
        throw new ApiError(401, err.message || '토큰 갱신 실패');
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('[api.js] Fetching CSRF token due to 403 error');
        const startTime = Date.now();
        const { data } = await api.get('/api/csrf-token', { skipCsrf: true });
        const endTime = Date.now();
        console.log(`[api.js] CSRF token fetched in ${endTime - startTime}ms`);
        localStorage.setItem('csrfToken', data.csrfToken);
        localStorage.setItem('csrfTokenId', data.tokenId);
        originalRequest.headers['X-CSRF-Token'] = data.csrfToken;
        originalRequest.headers['X-CSRF-Token-Id'] = data.tokenId;
        return api(originalRequest);
      } catch (retryError) {
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenId');
        throw new ApiError(403, 'CSRF 토큰 갱신 실패');
      }
    }
    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || '서버 오류',
      error.response?.data
    );
  }
);

// 로그인 API
export const customerLogin = async (data) => {
  try {
    const response = await api.post('/api/customer/login', data);
    const { token, refreshToken } = response.data;
    localStorage.setItem('customerToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    console.log(`[api.js] Stored customerToken: ${token}`);
    console.log(`[api.js] Stored refreshToken: ${refreshToken}`);
    return response.data;
  } catch (error) {
    handleApiError(error, '로그인 실패');
  }
};

// 소셜 로그인 API
export const customerLoginSocial = async (provider, data) => {
  try {
    const endpoint = `/api/customer/login/social/${provider}`;

    console.log(`[디버깅] 소셜 로그인 시작 - 공급자: ${provider}`);
    console.log(`[디버깅] 현재 환경: ${process.env.NODE_ENV}`);
    console.log(`[디버깅] API 기본 URL: ${process.env.REACT_APP_API_BASE_URL}`);

    if (!data || !data.code) {
      console.error('[api.js] Invalid data for social login:', data);
      throw new Error(`${provider} 인증 코드가 없습니다.`);
    }

    const codeString = String(data.code);

    console.log(`[api.js] Making social login request to: ${endpoint}`);
    console.log(`[api.js] Code length: ${codeString.length}`);
    console.log(`[api.js] Code preview: ${codeString.substring(0, 10)}...`);

    const requestData = {
      code: codeString,
      provider,
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    console.log(
      `[디버깅] 전체 요청 URL: ${process.env.REACT_APP_API_BASE_URL}${endpoint}`
    );
    console.log(`[디버깅] 요청 데이터:`, requestData);
    console.log(`[디버깅] 요청 헤더:`, headers);

    try {
      const response = await api.post(endpoint, requestData, { headers });
      console.log('[api.js] Social login successful response:', {
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (requestError) {
      console.error('[디버깅] 요청 실패 상세:', {
        message: requestError.message,
        status: requestError.response?.status,
        statusText: requestError.response?.statusText,
        data: requestError.response?.data,
        url: requestError.config?.url,
        method: requestError.config?.method,
      });
      throw requestError;
    }
  } catch (error) {
    console.error('[api.js] Social login error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      },
    });

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '소셜 로그인 처리 중 오류가 발생했습니다.';

    throw new Error(errorMessage);
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
    if (!redirectUrl) throw new Error('리다이렉트 URL이 없습니다.');
    const urlParams = new URLSearchParams(redirectUrl.split('?')[1]);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');
    if (!token || !refreshToken)
      throw new Error('토큰 또는 리프레시 토큰이 없습니다.');
    localStorage.setItem('customerToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    console.log(`[api.js] Stored customerToken (social connect): ${token}`);
    console.log(
      `[api.js] Stored refreshToken (social connect): ${refreshToken}`
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '소셜 계정 연결 실패');
  }
};

// 동의 항목 수정 API
export const updateCustomer = async (agreements) => {
  try {
    const response = await api.put('/api/customer/update', { agreements });
    return response.data;
  } catch (error) {
    handleApiError(error, '동의 항목 업데이트 실패');
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
    console.log('[api.js] fetchHotelList raw response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[api.js] fetchHotelList error:', error);
    throw error;
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
    console.log('[api.js] fetchCustomerHotelSettings response:', hotelData);
    return hotelData;
  } catch (error) {
    console.error(
      '[api.js] fetchCustomerHotelSettings error:',
      error.response?.data || error.message
    );
    throw error;
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
    console.log(
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
    const response = await api.post(
      '/api/customer/reservation',
      finalReservationData
    );
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
      longitude: reservation.longitude || null,
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
    const response = await api.delete(
      `/api/customer/reservation/${reservationId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      'Error cancelling reservation:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// 로그아웃 API
export const logoutCustomer = async () => {
  try {
    const token = getCustomerToken();
    if (!token) {
      console.warn('[api.js] No customerToken found, already logged out');
      return { redirect: '/login' };
    }
    const response = await api.post(
      '/api/customer/logout',
      {},
      { skipCsrf: true }
    );
    return { redirect: '/login', ...response.data };
  } catch (error) {
    console.error('[api.js] Logout failed:', error);
    return { error: error.message, redirect: '/login' };
  } finally {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('csrfTokenId');
    console.log(
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
    console.log('[api.js] sendPhoneOTP response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      '[api.js] sendPhoneOTP error:',
      error.response?.data || error.message
    );
    throw error;
  }
};

// 전화번호 인증 OTP 검증 API
export const verifyPhoneOTP = async (phoneNumber, otp) => {
  try {
    const response = await api.post('/api/customer/verify-phone-otp', {
      phoneNumber,
      otp,
    });
    console.log('[api.js] verifyPhoneOTP response:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      '[api.js] verifyPhoneOTP error:',
      error.response?.data || error.message
    );
    throw error;
  }
};

export { getCustomerToken, getCsrfToken, getCsrfTokenId };
export default api;
