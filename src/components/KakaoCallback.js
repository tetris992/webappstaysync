// webapp/src/components/KakaoCallback.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { customerLoginSocial } from '../api/api';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 code 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code) {
          throw new Error('카카오 인증 코드가 없습니다.');
        }

        // 백엔드에 code를 전달하여 access_token 및 사용자 정보를 얻음
        const response = await customerLoginSocial('kakao', { code });

        if (response.redirectUrl) {
          // 백엔드에서 생성한 절대 리다이렉트 URL을 파싱
          const redirectParams = new URLSearchParams(response.redirectUrl.split('?')[1]);
          const token = redirectParams.get('token');
          const refreshToken = redirectParams.get('refreshToken');
          const customerData = JSON.parse(decodeURIComponent(redirectParams.get('customer')));

          if (!token || !refreshToken || !customerData) {
            throw new Error('토큰 정보가 없습니다.');
          }

          // AuthContext의 login 함수 호출하여 인증 상태 업데이트
          await login(customerData, token, refreshToken);

          toast({
            title: '소셜 로그인 성공',
            description: '카카오로 로그인되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          navigate('/');
        } else {
          throw new Error('리다이렉트 URL이 없습니다.');
        }
      } catch (error) {
        toast({
          title: '소셜 로그인 실패',
          description: error.message || '소셜 로그인 중 오류가 발생했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, toast, login]);

  return <div>카카오 로그인 처리 중...</div>;
};

export default KakaoCallback;
