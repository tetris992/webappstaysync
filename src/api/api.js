import axios from 'axios';
import axiosRetry from 'axios-retry';
import ApiError from '../utils/ApiError';

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://staysync.org'
    : 'http://localhost:3004');
console.log('[api.js] BASE_URL:', BASE_URL);

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

// 요청 인터셉터: Authorization 및 CSRF 토큰 설정
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
      ];
      if (!noRedirectRoutes.includes(config.url)) {
        throw new ApiError(401, 'No customer token available');
      }
    }

    const isGetRequest = config.method === 'get';
    const isCsrfTokenRequest = config.url === 'api/csrf-token';
    const skipCsrfRoutes = [
      '/api/customer/register',
      '/api/customer/login',
      '/api/customer/login/social/kakao',
      '/api/customer/check-duplicate',
      '/api/customer/activate-account',
      '/api/hotel-settings/photos',
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
        const token = await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new ApiError(401, '리프레시 토큰이 없습니다.');
        const response = await api.post(
          '/api/customer/refresh-token',
          { refreshToken },
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
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenId');
        throw new ApiError(401, '토큰 갱신 실패');
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
    const storedToken = localStorage.getItem('customerToken');
    if (storedToken !== token) {
      console.error('[api.js] Failed to store customerToken in localStorage');
      throw new Error('토큰 저장에 실패했습니다.');
    }
    return response.data;
  } catch (error) {
    handleApiError(error, '로그인 실패');
  }
};

// 소셜 로그인 API
export const customerLoginSocial = async (provider, socialData) => {
  try {
    const response = await api.post(
      `/api/customer/login/social/${provider}`,
      socialData,
      { skipCsrf: true }
    );
    const { token, refreshToken } = response.data;
    localStorage.setItem('customerToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    console.log(`[api.js] Stored customerToken (social): ${token}`);
    console.log(`[api.js] Stored refreshToken (social): ${refreshToken}`);
    return response.data;
  } catch (error) {
    handleApiError(error, '소셜 로그인 실패');
  }
};

// 소셜 계정 연결 API
export const connectSocialAccount = async (provider, socialData) => {
  try {
    const response = await api.post(
      `/api/customer/connect-social/${provider}`,
      socialData
    );
    const { token, refreshToken } = response.data;
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

// 회원 가입 API
export const registerCustomer = async (customerData) => {
  try {
    const response = await api.post('/api/customer/register', customerData);
    return response.data; // { message, customerId, redirectUrl } 반환
  } catch (error) {
    handleApiError(error, '회원가입 실패');
  }
};

// 계정 활성화 API
export const activateAccount = async (activationData) => {
  try {
    const response = await api.post(
      '/api/customer/activate-account',
      activationData
    );
    return response.data;
  } catch (error) {
    handleApiError(error, '계정 활성화 실패');
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
    handleApiError(error, '호텔 목록 불러오기 실패');
  }
};

// 호텔 설정 조회 API
export const fetchCustomerHotelSettings = async (hotelId) => {
  try {
    const response = await api.get('/api/customer/hotel-settings', {
      params: { hotelId },
    });
    // 좌표 데이터를 명시적으로 포함하도록 보장
    const hotelData = {
      ...response.data,
      latitude: response.data.latitude || null,
      longitude: response.data.longitude || null,
    };
    return hotelData;
  } catch (error) {
    handleApiError(error, '고객용 호텔 설정 조회 실패');
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
    return response.data;
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
      latitude: reservation.latitude || null, // 좌표 추가
      longitude: reservation.longitude || null, // 좌표 추가
    }));
    return {
      history: reservations,
      totalVisits: response.data.totalVisits || 0,
    };
  } catch (error) {
    handleApiError(error, '예약 히스토리 조회 실패');
  }
};

// 중복 체크 API 호출 함수 추가
export const checkDuplicate = async ({ phoneNumber, email, nickname }) => {
  try {
    console.log('checkDuplicate input:', { phoneNumber, email, nickname });
    const response = await api.post('/api/customer/check-duplicate', {
      phoneNumber,
      email: email || null,
      nickname: nickname || null,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, '중복 체크 실패');
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
    handleApiError(error, '예약 취소 실패');
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
    const response = await api.post('/api/customer/logout', {});
    return { redirect: '/login', ...response.data };
  } catch (error) {
    console.error('[api.js] Logout failed:', error);
    return { error: error.message, redirect: '/login' };
  } finally {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('csrfTokenId');
  }
};

export { getCustomerToken, getCsrfToken, getCsrfTokenId };

export default api;