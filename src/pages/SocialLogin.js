// webapp/src/components/SocialLogin.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flex, Box, VStack, Text, Button, useToast, Icon } from '@chakra-ui/react';
import { SiKakao } from 'react-icons/si';
import { useAuth } from '../contexts/AuthContext';
import useSocialLoginSettings from '../hooks/useSocialLoginSettings';

const SocialLogin = () => {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSocialLoading, setIsSocialLoading] = useState({ kakao: false });
  const [isKakaoEnabled, setIsKakaoEnabled] = useState(true);
  const { socialLoginSettings, loading } = useSocialLoginSettings();

  useEffect(() => {
    if (customer) navigate('/');
  }, [customer, navigate]);

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      if (!process.env.REACT_APP_KAKAO_APP_KEY) {
        console.error('카카오 앱 키가 환경 변수에 설정되지 않았습니다.');
        toast({
          title: '카카오 로그인 오류',
          description:
            '카카오 앱 키가 설정되지 않았습니다. 카카오 로그인은 비활성화됩니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsKakaoEnabled(false);
        return;
      }
      try {
        window.Kakao.init(process.env.REACT_APP_KAKAO_APP_KEY);
        console.log('카카오 SDK 초기화 완료');
      } catch (error) {
        console.error('카카오 SDK 초기화 실패:', error);
        toast({
          title: '카카오 로그인 오류',
          description: '카카오 SDK 초기화에 실패했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsKakaoEnabled(false);
      }
    }
  }, [toast]);

  const handleSocialLogin = async (provider) => {
    if (provider !== 'kakao') {
      toast({
        title: '미구현 기능',
        description: '현재는 카카오 로그인만 지원됩니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsSocialLoading((prev) => ({ ...prev, kakao: true }));
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const redirectUri = isProduction
        ? 'https://danjam.in/auth/kakao/callback'
        : 'http://localhost:3000/auth/kakao/callback';

      // 리다이렉트 방식으로 카카오 로그인 페이지로 이동
      window.Kakao.Auth.authorize({
        redirectUri,
        scope: 'account_email profile openid',
      });
      // 리다이렉트가 발생하므로 이후 코드는 실행되지 않습니다.
    } catch (error) {
      let errorMessage = '소셜 로그인 중 오류가 발생했습니다.';
      if (error.message.includes('popup_blocked_by_browser')) {
        errorMessage =
          '팝업 차단이 활성화되어 있습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
      } else if (error.message.includes('user_cancelled')) {
        errorMessage = '사용자가 로그인을 취소했습니다.';
      }
      toast({
        title: '소셜 로그인 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsSocialLoading((prev) => ({ ...prev, kakao: false }));
    }
  };

  if (loading || customer) {
    return <Text>소셜 로그인 설정을 불러오는 중...</Text>;
  }

  return (
    <Flex direction="column" justify="center" align="center" minH="100vh" px={{ base: 3, md: 4 }}>
      <Box w={{ base: '95%', sm: '85%', md: 'sm' }} p={{ base: 3, md: 4 }} bg="white" borderRadius="lg" boxShadow="md">
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          <Text fontSize={{ base: '2xl', md: '2xl' }} fontWeight="bold" textAlign="center" mb={{ base: 6, md: 8 }}>
            소셜 로그인
          </Text>
          <Button
            variant="kakao"
            w="full"
            leftIcon={<Icon as={SiKakao} />}
            onClick={() => handleSocialLogin('kakao')}
            isLoading={isSocialLoading.kakao}
            isDisabled={isSocialLoading.kakao || !isKakaoEnabled}
            loadingText="카카오 로그인 중..."
            size="md"
          >
            카카오로 계속하기
          </Button>
          <Text textAlign="center" fontSize="sm">
            전화번호로 로그인하려면{' '}
            <Button as={Link} to="/login" variant="link" fontSize="sm">
              여기
            </Button>{' '}
            를 클릭하세요.
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default SocialLogin;
