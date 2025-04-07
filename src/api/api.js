import axios from 'axios';
import axiosRetry from 'axios-retry';
import ApiError from '../utils/ApiError';

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://staysync.org' : 'http://localhost:3004');
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
  throw new ApiError(status, message);
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
      // 로그인, 소셜 로그인, 회원가입, 리프레시 토큰, CSRF 토큰 요청은 리다이렉트하지 않음
      if (
        config.url !== '/api/customer/refresh-token' &&
        config.url !== '/api/customer/login' &&
        config.url !== '/api/customer/login/social/kakao' &&
        config.url !== '/api/customer/login/social/naver' &&
        config.url !== '/api/customer/login/social/google' &&
        config.url !== '/api/customer/register' && // 회원가입 요청 추가
        config.url !== '/api/csrf-token'
      ) {
        window.location.href = '/login';
        throw new ApiError(401, 'No customer token available, redirecting to login');
      }
    }

    const isGetRequest = config.method === 'get';
    const isCsrfTokenRequest = config.url === '/api/csrf-token';
    const skipCsrf = config.skipCsrf || false;

    if (!isGetRequest && !isCsrfTokenRequest && !skipCsrf) {
      let csrfToken = getCsrfToken();
      let csrfTokenId = getCsrfTokenId();
      if (!csrfToken || !csrfTokenId) {
        try {
          const { data } = await api.get('/api/csrf-token', { skipCsrf: true });
          csrfToken = data.csrfToken;
          csrfTokenId = data.tokenId;
          localStorage.setItem('csrfToken', csrfToken);
          localStorage.setItem('csrfTokenId', csrfTokenId);
          console.log(
            `[api.js] Setting CSRF token: ${csrfToken}, tokenId: ${csrfTokenId}`
          );
        } catch (error) {
          console.error('[api.js] Failed to fetch CSRF token:', error);
          throw new ApiError(403, 'CSRF 토큰을 가져오지 못했습니다.');
        }
      }
      config.headers['X-CSRF-Token'] = csrfToken;
      config.headers['X-CSRF-Token-Id'] = csrfTokenId;
      console.log(
        `[api.js] Setting CSRF headers: X-CSRF-Token=${csrfToken}, X-CSRF-Token-Id=${csrfTokenId}`
      );
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

// 응답 인터셉터: 401(토큰 만료) 및 403(CSRF 문제) 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // 401 에러 처리: 토큰 갱신 시도 후 재요청
    if (
      error.response?.status === 401 &&
      originalRequest.url !== '/api/customer/login' &&
      originalRequest.url !== '/api/customer/login/social/kakao' &&
      originalRequest.url !== '/api/customer/login/social/naver' &&
      originalRequest.url !== '/api/customer/login/social/google' &&
      originalRequest.url !== '/api/customer/register' && // 회원가입 요청 추가
      !originalRequest._retry
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
        console.log('[api.js] 401 Unauthorized, attempting to refresh token');
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new ApiError(401, 'No refresh token available');
        }
        // refresh-token 요청 시 Authorization 헤더를 제거
        const response = await api.post('/api/customer/refresh-token', { refreshToken }, {
          headers: {
            Authorization: undefined, // Authorization 헤더 제거
          },
        });
        const { token } = response.data;
        localStorage.setItem('customerToken', token);
        console.log(`[api.js] Refreshed customerToken: ${token}`);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        return api(originalRequest);
      } catch (err) {
        console.log('[api.js] Token refresh failed, redirecting to login');
        localStorage.removeItem('customerToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('csrfToken');
        localStorage.removeItem('csrfTokenId');
        window.location.href = '/login';
        throw new ApiError(401, '토큰이 만료되었습니다. 다시 로그인해주세요.');
      } finally {
        isRefreshing = false;
      }
    }
    // 403 에러 처리: CSRF 토큰 갱신 후 재요청
    else if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.get('/api/csrf-token', { skipCsrf: true });
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
      error.response?.data?.message || '서버 오류'
    );
  }
);

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

export const customerLoginSocial = async (provider, socialData) => {
  try {
    const response = await api.post(
      `/api/customer/login/social/${provider}`,
      socialData,
      {
        skipCsrf: true,
      }
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
    console.log(`[api.js] Stored refreshToken (social connect): ${refreshToken}`);
    return response.data;
  } catch (error) {
    handleApiError(error, '소셜 계정 연결 실패');
  }
};

export const customerRegister = async (customerData) => {
  try {
    const response = await api.post('/api/customer/register', customerData);
    const { token, refreshToken } = response.data;
    localStorage.setItem('customerToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    console.log(`[api.js] Stored customerToken (register): ${token}`);
    console.log(`[api.js] Stored refreshToken (register): ${refreshToken}`);
    return response.data;
  } catch (error) {
    handleApiError(error, '회원가입 실패');
  }
};

export const fetchHotelList = async () => {
  try {
    const response = await api.get('/api/customer/hotel-list');
    return response.data;
  } catch (error) {
    handleApiError(error, '호텔 목록 불러오기 실패');
  }
};

// 고객 전용 호텔설정 조회 API
export const fetchCustomerHotelSettings = async (hotelId) => {
  try {
    const response = await api.get('/api/customer/hotel-settings', {
      params: { hotelId },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, '고객용 호텔 설정 조회 실패');
  }
};

export const fetchHotelPhotos = async (hotelId, category, subCategory) => {
  try {
    const response = await api.get('/api/hotel-settings/photos', {
      params: { hotelId, category, subCategory },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, '호텔 사진 불러오기 실패');
  }
};

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
    }));
    return {
      history: reservations,
      totalVisits: response.data.totalVisits || 0,
    };
  } catch (error) {
    handleApiError(error, '예약 히스토리 조회 실패');
  }
};

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