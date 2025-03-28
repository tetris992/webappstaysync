// webapp/src/api/api.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import ApiError from '../utils/ApiError';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004';
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
const getCsrfToken = () => localStorage.getItem('csrfToken');

api.interceptors.request.use(
  async (config) => {
    console.log('[api.js] Request URL:', `${BASE_URL}${config.url}`);
    console.log('[api.js] Request Body:', config.data);
    const token = getCustomerToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[api.js] Setting Authorization header: Bearer ${token}`);
    } else {
      console.log('[api.js] No customerToken found in localStorage');
    }

    const isGetRequest = config.method === 'get';
    const isCsrfTokenRequest = config.url === '/api/csrf-token';
    const skipCsrf = config.skipCsrf || false;

    if (!isGetRequest && !isCsrfTokenRequest && !skipCsrf) {
      try {
        const { data } = await api.get('/api/csrf-token', { skipCsrf: true });
        config.headers['X-CSRF-Token'] = data.csrfToken;
        localStorage.setItem('csrfToken', data.csrfToken);
        console.log(`[api.js] Setting CSRF token: ${data.csrfToken}`);
      } catch (error) {
        console.error('[api.js] Failed to fetch CSRF token:', error);
        throw new ApiError(403, 'CSRF 토큰을 가져오지 못했습니다.');
      }
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
      originalRequest.url !== '/api/customer/login' &&
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
        console.log('[api.js] 401 Unauthorized, redirecting to login');
        localStorage.removeItem('customerToken');
        localStorage.removeItem('csrfToken');
        window.location.href = '/login';
        throw new ApiError(401, '토큰이 만료되었습니다. 다시 로그인해주세요.');
      } catch (err) {
        processQueue(err, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.get('/api/csrf-token', { skipCsrf: true });
        localStorage.setItem('csrfToken', data.csrfToken);
        originalRequest.headers['X-CSRF-Token'] = data.csrfToken;
        return api(originalRequest);
      } catch (retryError) {
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
    const { token } = response.data;
    localStorage.setItem('customerToken', token);
    console.log(`[api.js] Stored customerToken: ${token}`);
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
    const { token } = response.data;
    localStorage.setItem('customerToken', token);
    console.log(`[api.js] Stored customerToken (social): ${token}`);
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
    return response.data;
  } catch (error) {
    handleApiError(error, '소셜 계정 연결 실패');
  }
};

export const customerRegister = async (customerData) => {
  try {
    const response = await api.post('/api/customer/register', customerData);
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

export const fetchHotelSettings = async (hotelId) => {
  try {
    const response = await api.get('/api/hotel-settings', {
      params: { hotelId },
    });
    return response.data.data;
  } catch (error) {
    handleApiError(error, '호텔 설정 불러오기 실패');
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

export const createReservation = async (reservationData) => {
  try {
    const response = await api.post('/api/customer/reservation', reservationData);
    return response.data;
  } catch (error) {
    handleApiError(error, '예약 저장 실패');
  }
};

export const getReservationHistory = async () => {
  try {
    const response = await api.get('/api/customer/history');
    // 응답 데이터 검증 및 기본값 설정
    const reservations = response.data.map(reservation => ({
      ...reservation,
      price: typeof reservation.price === 'number' ? reservation.price : 0,
      hotelName: reservation.hotelName || '알 수 없음',
      checkIn: reservation.checkIn || '',
      checkOut: reservation.checkOut || '',
    }));
    return reservations;
  } catch (error) {
    handleApiError(error, '예약 히스토리 조회 실패');
  }
};

export const cancelReservation = async (reservationId) => {
  try {
    const response = await api.post('/api/customer/reservation/cancel', {
      reservationId,
    });
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
    localStorage.removeItem('csrfToken');
  }
};

export { getCustomerToken, getCsrfToken };

export default api;