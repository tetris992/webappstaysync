// src/pages/ConnectSocial.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, VStack, Text, Button, Icon, useToast, Tooltip } from '@chakra-ui/react';
import { SiKakao, SiNaver } from 'react-icons/si';
import { FaGoogle } from 'react-icons/fa';
import { connectSocialAccount } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import useSocialLoginSettings from '../hooks/useSocialLoginSettings';

const ConnectSocial = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const [isSocialLoading, setIsSocialLoading] = useState({
    kakao: false,
    naver: false,
    google: false,
  });
  const { socialLoginSettings, loading } = useSocialLoginSettings();

  useEffect(() => {
    if (!customer) {
      toast({
        title: '로그인이 필요합니다.',
        description: '소셜 계정을 연결하려면 먼저 로그인해주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    }
  }, [customer, navigate, toast]);

  useEffect(() => {
    console.log('REACT_APP_KAKAO_APP_KEY:', process.env.REACT_APP_KAKAO_APP_KEY);
    if (window.Kakao && !window.Kakao.isInitialized()) {
      if (!process.env.REACT_APP_KAKAO_APP_KEY) {
        console.error('Kakao App Key is not set in environment variables');
        toast({
          title: 'Kakao 연결 오류',
          description: 'Kakao App Key가 설정되지 않았습니다. 관리자에게 문의해주세요.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      try {
        window.Kakao.init(process.env.REACT_APP_KAKAO_APP_KEY);
        console.log('Kakao SDK initialized');
      } catch (error) {
        console.error('Kakao SDK initialization failed:', error);
        toast({
          title: 'Kakao 연결 오류',
          description: 'Kakao SDK 초기화에 실패했습니다. 관리자에게 문의해주세요.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [toast]);

  const handleSocialConnect = async (provider) => {
    if (provider === 'naver' || provider === 'google') {
      toast({
        title: '미구현 기능',
        description: '현재는 카카오 계정만 연결 가능합니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (provider === 'kakao' && socialLoginSettings?.kakao?.enabled !== true) {
      toast({
        title: 'Kakao 로그인 비활성화',
        description: '현재 Kakao 로그인은 비활성화되어 있습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsSocialLoading((prev) => ({ ...prev, [provider]: true }));
    try {
      if (provider === 'kakao') {
        await new Promise((resolve, reject) => {
          window.Kakao.Auth.login({
            success: () => resolve(),
            fail: (error) => reject(error),
          });
        });
        const userInfo = await new Promise((resolve, reject) => {
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (response) => resolve(response),
            fail: (error) => reject(error),
          });
        });
        const socialData = {
          providerId: userInfo.id.toString(),
          email: userInfo.kakao_account.email || '',
        };
        if (socialLoginSettings?.kakao?.openIdConnectEnabled) {
          const idToken = window.Kakao.Auth.getIdToken();
          if (idToken) {
            socialData.idToken = idToken;
          }
        }
        const data = await connectSocialAccount('kakao', socialData);
        if (data.redirectUrl) {
          toast({
            title: '소셜 계정 연결 성공',
            description: '카카오 계정이 성공적으로 연결되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          window.location.href = data.redirectUrl;
        } else {
          throw new Error('리다이렉트 URL이 없습니다.');
        }
      }
    } catch (error) {
      let errorMessage = '소셜 계정 연결 중 오류가 발생했습니다.';
      if (error.message.includes('popup_blocked_by_browser')) {
        errorMessage = '팝업 차단이 활성화되어 있습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
      } else if (error.message.includes('user_cancelled')) {
        errorMessage = '사용자가 계정 연결을 취소했습니다.';
      } else if (error.message.includes('network_error')) {
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('invalid_app_key')) {
        errorMessage = '앱 키가 유효하지 않습니다. 관리자에게 문의해주세요.';
      } else if (error.message.includes('invalid_scope')) {
        errorMessage = '요청된 권한이 유효하지 않습니다. 관리자에게 문의해주세요.';
      }
      console.error(`Social account connection failed for ${provider}: ${error.message}`);
      toast({
        title: '소셜 계정 연결 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSocialLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxW="container.sm" py={8} bg="white" borderRadius="lg" boxShadow="lg">
        <Text textAlign="center">소셜 로그인 설정을 불러오는 중...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={8} bg="white" borderRadius="lg" boxShadow="md">
      <VStack spacing={6} align="stretch">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" color="gray.800">
          소셜 계정 연결
        </Text>
        <Text textAlign="center" color="gray.600">
          현재는 카카오 계정만 지원됩니다.
        </Text>
        <VStack spacing={3} align="stretch">
          {socialLoginSettings?.kakao?.enabled ? (
            <Button
              onClick={() => handleSocialConnect('kakao')}
              bg="#FEE500"
              color="black"
              leftIcon={<Icon as={SiKakao} />}
              iconSpacing={3}
              _hover={{ bg: '#E4D100' }}
              w="full"
              borderRadius="md"
              justifyContent="center"
              isLoading={isSocialLoading.kakao}
              isDisabled={Object.values(isSocialLoading).some((loading) => loading)}
              loadingText="카카오 연결 중..."
              size="md"
            >
              카카오로 연결하기
            </Button>
          ) : (
            <Tooltip label="Kakao 로그인은 현재 비활성화되어 있습니다." placement="top">
              <Button
                bg="#FEE500"
                color="black"
                leftIcon={<Icon as={SiKakao} />}
                w="full"
                borderRadius="md"
                justifyContent="center"
                isDisabled
                size="md"
              >
                카카오로 연결하기
              </Button>
            </Tooltip>
          )}
          <Tooltip label="현재는 카카오 계정만 지원됩니다." placement="top">
            <Button
              bg="#03C75A"
              color="white"
              leftIcon={<Icon as={SiNaver} />}
              w="full"
              borderRadius="md"
              justifyContent="center"
              isDisabled
              size="md"
            >
              네이버로 계속하기
            </Button>
          </Tooltip>
          <Tooltip label="현재는 카카오 계정만 지원됩니다." placement="top">
            <Button
              bg="white"
              color="black"
              border="1px solid"
              borderColor="gray.300"
              leftIcon={<Icon as={FaGoogle} />}
              w="full"
              borderRadius="md"
              justifyContent="center"
              isDisabled
              size="md"
            >
              구글로 계속하기
            </Button>
          </Tooltip>
        </VStack>
        <Button variant="link" colorScheme="blue" onClick={handleSkip} w="full" mt={4}>
          나중에 연결하기
        </Button>
      </VStack>
    </Container>
  );
};

export default ConnectSocial;
