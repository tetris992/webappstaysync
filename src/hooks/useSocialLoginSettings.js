import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';

const useSocialLoginSettings = () => {
  const toast = useToast();
  const [socialLoginSettings, setSocialLoginSettings] = useState({
    kakao: {
      enabled: true, // 기본값 설정
      openIdConnectEnabled: false,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      // 로그인 토큰이 없으면 기본값으로 설정 후 로딩 종료
      setSocialLoginSettings({
        kakao: {
          enabled: true,
          openIdConnectEnabled: false,
        },
      });
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
        // API 응답을 받아도 kakao.enabled를 강제로 true로 설정
        setSocialLoginSettings({
          ...response.data,
          kakao: {
            ...response.data.kakao,
            enabled: true,
          },
        });
      } catch (error) {
        console.error('Failed to fetch social login settings:', error);
        if (error.response?.status === 404) {
          setSocialLoginSettings({
            kakao: {
              enabled: true,
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
