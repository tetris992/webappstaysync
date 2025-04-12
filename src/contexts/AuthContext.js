// webapp/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerLogin, logoutCustomer, autoLogin } from '../api/api';
import { getDeviceToken } from '../utils/device';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState(null);

  // 초기 로드 시 디바이스 토큰 확인 및 자동 로그인 시도
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // 디바이스 토큰 확인 (없으면 생성)
    getDeviceToken();

    // 초기 토큰 확인 및 상태 설정
    const token = localStorage.getItem('customerToken');
    if (token) {
      setIsAuthenticated(true);
      const storedCustomer = localStorage.getItem('customer');
      if (storedCustomer) {
        setCustomer(JSON.parse(storedCustomer));
      }
    }

    // 자동 로그인 시도
    const tryAutoLogin = async () => {
      const storedPhoneNumber = localStorage.getItem('phoneNumber');
      const refreshToken = localStorage.getItem('refreshToken');
      const deviceToken = localStorage.getItem('deviceToken');

      if (
        storedPhoneNumber &&
        refreshToken &&
        deviceToken &&
        !isAuthenticated
      ) {
        try {
          const response = await autoLogin({
            phoneNumber: storedPhoneNumber,
            deviceToken,
          });
          setIsAuthenticated(true);
          setCustomer(response.customer);
          localStorage.setItem('customerToken', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('customer', JSON.stringify(response.customer));
          console.log('Auto-login successful on init');
        } catch (error) {
          console.error('Auto-login failed on init:', error);
          setIsAuthenticated(false);
          setCustomer(null);
          localStorage.removeItem('customerToken');
          if (error.message.includes('디바이스 인증 실패')) {
            // 디바이스 토큰 불일치 시 초기화 후 재시도
            localStorage.removeItem('deviceToken');
            getDeviceToken();
          } else if (
            error.message.includes('자동로그인 기간이 만료되었습니다')
          ) {
            console.log(
              'Auto-login period expired, user needs to re-authenticate'
            );
          }
        }
      }
    };

    tryAutoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 배열에 인증상태를 넣으면, 로그아웃 안됨
  // 로그인 함수
  const login = async (dataOrCustomer, token, refreshToken) => {
    if (token) {
      // Mode B: 이미 토큰과 고객 객체를 받은 경우 (예: OTP 인증 후)
      setIsAuthenticated(true);
      setCustomer(dataOrCustomer);
      localStorage.setItem('customerToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('customer', JSON.stringify(dataOrCustomer));
      if (dataOrCustomer.phoneNumber) {
        localStorage.setItem('phoneNumber', dataOrCustomer.phoneNumber);
      }
      getDeviceToken();
      localStorage.removeItem('loggedOut');
      return { token, refreshToken, customer: dataOrCustomer };
    }

    // Mode A: 백엔드 로그인 API 호출 (현재 사용되지 않음)
    try {
      const response = await customerLogin(dataOrCustomer);
      setIsAuthenticated(true);
      setCustomer(response.customer);
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('customer', JSON.stringify(response.customer));
      localStorage.setItem('phoneNumber', dataOrCustomer.phoneNumber);
      getDeviceToken();
      return response;
    } catch (error) {
      throw error;
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await logoutCustomer();
      setIsAuthenticated(false);
      setCustomer(null);
      localStorage.removeItem('customerToken');
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('csrfTokenId');
      localStorage.removeItem('customer');
      // phoneNumber, deviceToken, refreshToken은 유지
      console.log('Logout completed, retained values:', {
        phoneNumber: localStorage.getItem('phoneNumber'),
        deviceToken: localStorage.getItem('deviceToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      });
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      setIsAuthenticated(false);
      setCustomer(null);
      localStorage.removeItem('customerToken');
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('csrfTokenId');
      localStorage.removeItem('customer');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, customer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
