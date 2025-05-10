import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useToast } from '@chakra-ui/react';
import {
  fetchCustomerCoupons,
  fetchAvailableCoupons,
  fetchHotelList,
  refreshCustomerToken,
  logoutCustomer,
} from '../api/api';
import ApiError from '../utils/ApiError';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const toast = useToast();

  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState(null);

  // 호텔 목록 상태
  const [hotelList, setHotelList] = useState([]);

  // 고객 쿠폰 상태
  const [customerCoupons, setCustomerCoupons] = useState([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(false);
  const [couponsLoadError, setCouponsLoadError] = useState(null);

  // 사용 가능 쿠폰 상태
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isAvailableCouponsLoading, setIsAvailableCouponsLoading] =
    useState(false);
  const [availableCouponsError, setAvailableCouponsError] = useState(null);

  // 리프레시 및 디바이스 토큰 상태
  const [refreshToken, setRefreshToken] = useState(null);
  const [deviceToken, setDeviceToken] = useState(null);

  // 로컬 스토리지에서 초기 인증 데이터 로드
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('customerToken');
      const storedCustomer = localStorage.getItem('customer');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedDeviceToken = localStorage.getItem('deviceToken');

      if (token && storedCustomer) {
        try {
          setIsAuthenticated(true);
          setCustomer(JSON.parse(storedCustomer));
          setRefreshToken(storedRefreshToken);
          setDeviceToken(storedDeviceToken);
        } catch (error) {
          console.error(
            '[AuthContext] Failed to parse stored auth data:',
            error
          );
          clearAuthData();
        }
      }
    };
    initializeAuth();
  }, []);

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
    localStorage.removeItem('customer');
    localStorage.removeItem('deviceToken');
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('csrfTokenId');
    setIsAuthenticated(false);
    setCustomer(null);
    setHotelList([]);
    setCustomerCoupons([]);
    setCouponsLoadError(null);
    setIsCouponsLoading(false);
    setAvailableCoupons([]);
    setAvailableCouponsError(null);
    setIsAvailableCouponsLoading(false);
    setRefreshToken(null);
    setDeviceToken(null);
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
    const customerData = { ...dataOrCustomer };
    try {
      // 로컬 스토리지 및 상태 설정
      localStorage.setItem('customerToken', token);
      localStorage.setItem('refreshToken', refreshTokenValue);
      localStorage.setItem('deviceToken', deviceTokenValue);
      localStorage.setItem('customer', JSON.stringify(customerData));
      setIsAuthenticated(true);
      setCustomer(customerData);
      setRefreshToken(refreshTokenValue);
      setDeviceToken(deviceTokenValue);

      // 초기 데이터 로드
      const [hotels, coupons] = await Promise.all([
        fetchHotelList(),
        fetchCustomerCoupons(),
      ]);
      setHotelList(hotels || []);
      setCustomerCoupons(coupons || []);

      return {
        token,
        refreshToken: refreshTokenValue,
        deviceToken: deviceTokenValue,
        customer: customerData,
      };
    } catch (err) {
      console.error('[AuthContext] login error:', {
        message: err.message,
        stack: err.stack,
      });
      clearAuthData();
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
        hotelList,
        setHotelList,
        customerCoupons,
        setCustomerCoupons,
        isCouponsLoading,
        couponsLoadError,
        availableCoupons,
        isAvailableCouponsLoading,
        availableCouponsError,
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
