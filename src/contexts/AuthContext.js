// webapp/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { customerLogin, logoutCustomer } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      setIsAuthenticated(true);
      const storedCustomer = localStorage.getItem('customer');
      if (storedCustomer) {
        setCustomer(JSON.parse(storedCustomer));
      }
    }
  }, []);

  /**
   * login 함수 (두 모드 지원)
   * - Mode A (백엔드 로그인): dataOrCustomer에 { phoneNumber, password }가 있을 때,
   *    백엔드 로그인 API를 호출합니다.
   * - Mode B (이미 토큰이 있는 경우): token이 있으면, 로컬 상태만 갱신합니다.
   *
   * @param {object} dataOrCustomer - Mode A: { phoneNumber, password }, Mode B: { name, phoneNumber, email, ... }
   * @param {string} [token] - 이미 발급받은 토큰 (회원가입/소셜 콜백 등)
   */
  const login = async (dataOrCustomer, token) => {
    // Mode B: token이 있다면 백엔드 호출 없이 상태만 갱신
    if (token) {
      setIsAuthenticated(true);
      // eslint-disable-next-line no-unused-vars
      const { password: _password, ...customerWithoutPassword } = dataOrCustomer;
      setCustomer(customerWithoutPassword);
      localStorage.setItem('customerToken', token);
      localStorage.setItem('customer', JSON.stringify(customerWithoutPassword));
      return { token, customer: customerWithoutPassword };
    }

    // Mode A: 백엔드 로그인
    try {
      const response = await customerLogin(dataOrCustomer);
      setIsAuthenticated(true);
      // eslint-disable-next-line no-unused-vars
      const { password: _password, ...customerWithoutPassword } = response.customer;
      setCustomer(customerWithoutPassword);
      localStorage.setItem('customerToken', response.token);
      localStorage.setItem('customer', JSON.stringify(customerWithoutPassword));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutCustomer();
      setIsAuthenticated(false);
      setCustomer(null);
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, customer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
