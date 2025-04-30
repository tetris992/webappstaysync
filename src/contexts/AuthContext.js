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
  refreshCustomerToken,
  logoutCustomer,
} from '../api/api';
import ApiError from '../utils/ApiError';

const AuthContext = createContext();

/**
 * AuthProvider - 인증 및 고객 쿠폰 전역 상태 관리
 * @param {Object} props
 * @param {React.ReactNode} props.children - 하위 컴포넌트
 */
export const AuthProvider = ({ children }) => {
  const toast = useToast();

  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState(null);

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
    setCustomerCoupons([]);
    setCouponsLoadError(null);
    setIsCouponsLoading(false);
    setAvailableCoupons([]);
    setAvailableCouponsError(null);
    setIsAvailableCouponsLoading(false);
    setRefreshToken(null);
    setDeviceToken(null);
  };

  // 로그인 처리
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
      if (token) {
        localStorage.setItem('customerToken', token);
      }
      if (refreshTokenValue) {
        localStorage.setItem('refreshToken', refreshTokenValue);
        setRefreshToken(refreshTokenValue);
      }
      if (deviceTokenValue) {
        localStorage.setItem('deviceToken', deviceTokenValue);
        setDeviceToken(deviceTokenValue);
      }
      localStorage.setItem('customer', JSON.stringify(customerData));
      setIsAuthenticated(true);
      setCustomer(customerData);
      return {
        token,
        refreshToken: refreshTokenValue,
        deviceToken: deviceTokenValue,
        customer: customerData,
      };
    } catch (err) {
      console.error('[AuthContext] login error:', err);
      clearAuthData();
      throw new Error('인증 정보 저장에 실패했습니다.');
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

  // contexts/AuthContext.js
  const updateCustomerCouponsAfterUse = useCallback(
    async (couponUuid) => {
      setCustomerCoupons((prevCoupons) =>
        prevCoupons.map((coupon) =>
          coupon.couponUuid === couponUuid
            ? { ...coupon, used: true, usedAt: new Date().toISOString() }
            : coupon
        )
      );
      // 최신 쿠폰 목록으로 동기화
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

/**
 * useAuth - AuthContext 값을 반환
 * @returns {Object} 인증 및 쿠폰 관련 상태와 함수
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
