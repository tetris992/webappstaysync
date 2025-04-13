import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('customerToken');
      const storedCustomer = localStorage.getItem('customer');
      if (token && storedCustomer) {
        try {
          setIsAuthenticated(true);
          setCustomer(JSON.parse(storedCustomer));
        } catch (error) {
          console.error('Failed to parse stored customer:', error);
          clearAuthData();
        }
      }
    };
    checkAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('customer');
    localStorage.removeItem('deviceToken');
    setIsAuthenticated(false);
    setCustomer(null);
  };

  const login = async (dataOrCustomer, token) => {
    try {
      if (!dataOrCustomer) {
        throw new Error('고객 정보가 제공되지 않았습니다.');
      }

      const customerData = { ...dataOrCustomer };
      
      try {
        if (token) {
          localStorage.setItem('customerToken', token);
        }
        localStorage.setItem('customer', JSON.stringify(customerData));
      } catch (storageError) {
        console.error('Failed to store auth data:', storageError);
        throw new Error('인증 정보 저장에 실패했습니다.');
      }

      setIsAuthenticated(true);
      setCustomer(customerData);
      return { token, customer: customerData };
    } catch (error) {
      clearAuthData();
      throw error;
    }
  };

  const logout = async () => {
    try {
      clearAuthData();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: '로그아웃 실패',
        description: '로그아웃 처리 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, customer, login, logout }}>
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