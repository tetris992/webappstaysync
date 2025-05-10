// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  fetchCustomerCoupons,
  fetchAvailableCoupons,
  fetchHotelList,
  refreshCustomerToken,
  logoutCustomer,
} from '../api/api';
import ApiError from '../utils/ApiError';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const toast = useToast();

  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // 로딩 상태 추가

  // 호텔 목록 상태
  const [hotelList, setHotelList] = useState([]);

  // 고객 쿠폰 상태
  const [customerCoupons, setCustomerCoupons] = useState([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(false);
  const [couponsLoadError, setCouponsLoadError] = useState(null);

  // 사용 가능 쿠폰 상태
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isAvailableCouponsLoading, setIsAvailableCouponsLoading] = useState(false);
  const [availableCouponsError, setAvailableCouponsError] = useState(null);

  // 리프레시 및 디바이스 토큰 상태
  const [refreshToken, setRefreshToken] = useState(null);
  const [deviceToken, setDeviceToken] = useState(null);

  // 서버에서 최신 고객 정보 가져오기
  const fetchCustomerProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:3004/api/customer/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      return response.data.customer;
    } catch (error) {
      console.error('[AuthContext] Failed to fetch customer profile:', error);
      throw new ApiError(
        error.response?.status || 500,
        error.response?.data?.message || '고객 정보를 가져오지 못했습니다.'
      );
    }
  };

  // 로컬 스토리지에서 초기 인증 데이터 로드
  useEffect(() => {
    const initializeAuth = async () => {
      setIsAuthLoading(true); // 로딩 시작
      const token = localStorage.getItem('customerToken');
      const storedCustomer = localStorage.getItem('customer');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedDeviceToken = localStorage.getItem('deviceToken');

      if (token && storedCustomer) {
        try {
          setIsAuthenticated(true);
          const parsedCustomer = JSON.parse(storedCustomer);
          setCustomer(parsedCustomer);
          setRefreshToken(storedRefreshToken);
          setDeviceToken(storedDeviceToken);

          // 서버에서 최신 고객 정보 가져오기
          const latestCustomer = await fetchCustomerProfile(token);
          setCustomer(latestCustomer);
          localStorage.setItem('customer', JSON.stringify(latestCustomer));
          console.log('[AuthContext] Initialized auth with updated customer data:', latestCustomer);
        } catch (error) {
          console.error('[AuthContext] Failed to initialize auth:', error);
          clearAuthData();
        }
      }
      setIsAuthLoading(false); // 로딩 완료
    };
    initializeAuth();
  }, []);

  // customer 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (customer) {
      localStorage.setItem('customer', JSON.stringify(customer));
      console.log('[AuthContext] Customer state synced to localStorage:', customer);
    }
  }, [customer]);

  // 고객 쿠폰 가져오기
  const loadCustomerCoupons = useCallback(async () => {
    setIsCouponsLoading(true);
    try {
      const coupons = await fetchCustomerCoupons();
      setCustomerCoupons(coupons || []);
      setCouponsLoadError(null);
    } catch (err) {
      console.error('[AuthContext] fetchCustomerCoupons failed:', err);
      let errorMessage = '쿠폰 로드에 실패했습니다.';
      if (err instanceof ApiError) {
        errorMessage = err.message || errorMessage;
      }
      setCouponsLoadError(errorMessage);
      toast({
        title: '쿠폰 로드 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCouponsLoading(false);
    }
  }, [toast]);

  // 사용 가능 쿠폰 가져오기
  const loadAvailableCoupons = useCallback(async () => {
    setIsAvailableCouponsLoading(true);
    try {
      const available = await fetchAvailableCoupons();
      setAvailableCoupons(available || []);
      setAvailableCouponsError(null);
    } catch (err) {
      console.error('[AuthContext] fetchAvailableCoupons failed:', err);
      let errorMessage = '사용 가능 쿠폰 로드에 실패했습니다.';
      if (err instanceof ApiError) {
        errorMessage = err.message || errorMessage;
      }
      setAvailableCouponsError(errorMessage);
      toast({
        title: '사용 가능 쿠폰 로드 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAvailableCouponsLoading(false);
    }
  }, [toast]);

  // 로그인 또는 고객 정보 변경 시 쿠폰 로드
  useEffect(() => {
    if (isAuthenticated && customer) {
      loadCustomerCoupons();
      loadAvailableCoupons();
    }
  }, [isAuthenticated, customer, loadCustomerCoupons, loadAvailableCoupons]);

  // 인증 데이터 초기화
  const clearAuthData = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('deviceToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('csrfTokenId');
    setIsAuthenticated(false);
    setHotelList([]);
    setCustomerCoupons([]);
    setCouponsLoadError(null);
    setIsCouponsLoading(false);
    setAvailableCoupons([]);
    setAvailableCouponsError(null);
    setIsAvailableCouponsLoading(false);
    setRefreshToken(null);
    setDeviceToken(null);
    console.log('[AuthContext] Cleared auth data (customer data preserved)');
  };

  // 로그인 처리 및 초기 데이터 로드
  const login = async (
    dataOrCustomer,
    token,
    refreshTokenValue,
    deviceTokenValue
  ) => {
    if (!dataOrCustomer) {
      throw new Error('고객 정보가 제공되지 않았습니다.');
    }
    try {
      setIsAuthLoading(true); // 로딩 시작
      localStorage.setItem('customerToken', token);
      localStorage.setItem('refreshToken', refreshTokenValue);
      localStorage.setItem('deviceToken', deviceTokenValue);

      // 서버에서 최신 고객 정보 가져오기
      const latestCustomer = await fetchCustomerProfile(token);
      localStorage.setItem('customer', JSON.stringify(latestCustomer));
      setIsAuthenticated(true);
      setCustomer(latestCustomer);
      setRefreshToken(refreshTokenValue);
      setDeviceToken(deviceTokenValue);

      const [hotels, coupons] = await Promise.all([
        fetchHotelList(),
        fetchCustomerCoupons(),
      ]);
      setHotelList(hotels || []);
      setCustomerCoupons(coupons || []);

      console.log('[AuthContext] Login successful with updated customer:', latestCustomer);
      setIsAuthLoading(false); // 로딩 완료

      return {
        token,
        refreshToken: refreshTokenValue,
        deviceToken: deviceTokenValue,
        customer: latestCustomer,
      };
    } catch (err) {
      console.error('[AuthContext] login error:', {
        message: err.message,
        stack: err.stack,
      });
      clearAuthData();
      setIsAuthLoading(false);
      throw new Error('인증 정보 저장 또는 초기 데이터 로드에 실패했습니다.');
    }
  };

  // 로그아웃 처리
  const logout = async () => {
    try {
      await logoutCustomer();
      clearAuthData();
      window.location.href = '/login';
    } catch (err) {
      console.error('[AuthContext] logout failed:', err);
      let errorMessage = '로그아웃 처리 중 오류가 발생했습니다.';
      if (err instanceof ApiError) {
        errorMessage = err.message || errorMessage;
      }
      toast({
        title: '로그아웃 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      clearAuthData();
      window.location.href = '/login';
    }
  };

  // 토큰 리프레시
  const refreshAuthToken = useCallback(async () => {
    if (!refreshToken || !deviceToken) {
      console.warn('[AuthContext] Missing refreshToken or deviceToken');
      return false;
    }
    try {
      const response = await refreshCustomerToken(
        { refreshToken, deviceToken },
        { skipCsrf: true }
      );
      if (response.token) {
        localStorage.setItem('customerToken', response.token);
        console.log(
          '[AuthContext] Token refreshed successfully:',
          response.token
        );
        return true;
      }
      console.warn('[AuthContext] No token in refresh response');
      return false;
    } catch (err) {
      console.error('[AuthContext] Token refresh failed:', err);
      let errorMessage = '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.';
      if (err instanceof ApiError) {
        errorMessage = err.message || errorMessage;
      }
      clearAuthData();
      toast({
        title: '세션 만료',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  }, [refreshToken, deviceToken, toast]);

  // 쿠폰 사용 후 업데이트
  const updateCustomerCouponsAfterUse = useCallback(
    async (couponUuid) => {
      setCustomerCoupons((prevCoupons) =>
        prevCoupons.map((coupon) =>
          coupon.couponUuid === couponUuid
            ? { ...coupon, used: true, usedAt: new Date().toISOString() }
            : coupon
        )
      );
      await loadCustomerCoupons();
      console.log(
        '[AuthContext] Updated and synced coupon after use:',
        couponUuid
      );
    },
    [loadCustomerCoupons]
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        customer,
        setCustomer,
        hotelList,
        setHotelList,
        customerCoupons,
        setCustomerCoupons,
        isCouponsLoading,
        couponsLoadError,
        availableCoupons,
        isAvailableCouponsLoading,
        availableCouponsError,
        isAuthLoading, // 로딩 상태 추가
        login,
        logout,
        refreshAuthToken,
        updateCustomerCouponsAfterUse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};