// src/hooks/useSocialLoginSettings.js
import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { fetchSocialLoginSettings } from '../api/api'; // api.js에 추가 필요

/**
 * Hook to load social login settings.
 * @returns {{ socialLoginSettings: object, loading: boolean }}
 */
const useSocialLoginSettings = () => {
  const toast = useToast();
  const [socialLoginSettings, setSocialLoginSettings] = useState({
    kakao: {
      enabled: true,
      openIdConnectEnabled: false,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      setLoading(false);
      return;
    }

    const loadSocialLoginSettings = async () => {
      try {
        const response = await fetchSocialLoginSettings();
        setSocialLoginSettings(response);
      } catch (error) {
        console.error('Failed to fetch social login settings:', error);
        if (error.status === 404) {
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

    loadSocialLoginSettings();
  }, [toast]);

  return { socialLoginSettings, loading };
};

export default useSocialLoginSettings;