// src/hooks/useSocialLoginSettings.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';

const useSocialLoginSettings = () => {
  const toast = useToast();
  const [socialLoginSettings, setSocialLoginSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      console.warn('고객 토큰이 존재하지 않습니다.');
      // 토큰이 없으면 로그인 상태가 아니므로 API 호출을 건너뜁니다.
      setLoading(false);
      return;
    }

    const fetchSocialLoginSettings = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/customer/social-login-settings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSocialLoginSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch social login settings:', error);
        if (error.response?.status === 404) {
          setSocialLoginSettings({
            kakao: {
              enabled: false,
              openIdConnectEnabled: false,
            },
          });
          toast({
            title: '설정 로드 실패',
            description: '소셜 로그인 설정이 없습니다. 기본값으로 설정되었습니다.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
        } else {
          toast({
            title: '설정 로드 실패',
            description: '소셜 로그인 설정을 불러오지 못했습니다.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSocialLoginSettings();
  }, [toast]);

  return { socialLoginSettings, loading };
};

export default useSocialLoginSettings;
