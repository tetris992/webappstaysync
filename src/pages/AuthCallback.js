// webapp/src/pages/AuthCallback.js
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const customer = JSON.parse(params.get('customer'));

        if (!token || !customer) {
          throw new Error('토큰 또는 고객 정보가 없습니다.');
        }

        // Mode B: 소셜 콜백으로 받은 token과 customer 정보를 AuthContext에 저장
        await login(customer, token);

        toast({
          title: '소셜 로그인 성공',
          description: '환영합니다!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      } catch (error) {
        toast({
          title: '소셜 로그인 실패',
          description: error.message || '소셜 로그인에 실패했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, login, toast, location]);

  return <div>소셜 로그인 처리 중...</div>;
};

export default AuthCallback;
