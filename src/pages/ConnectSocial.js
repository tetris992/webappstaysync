// webapp/src/pages/ConnectSocial.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, VStack, Text, Button, Icon, useToast } from '@chakra-ui/react';
import { SiKakao, SiNaver } from 'react-icons/si';
import { FaGoogle } from 'react-icons/fa';
import { connectSocialAccount } from '../api/api';
import { useAuth } from '../contexts/AuthContext';

const ConnectSocial = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth(); // 이제 customer 사용
  const [isSocialLoading, setIsSocialLoading] = useState(false);

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
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.REACT_APP_KAKAO_APP_KEY);
      console.log('Kakao SDK initialized');
    }
  }, []);

  const handleSocialConnect = async (provider) => {
    setIsSocialLoading(true);
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
        const data = await connectSocialAccount(provider, socialData);
        if (data.redirectUrl) {
          toast({
            title: '소셜 계정 연결 성공',
            description: '소셜 계정이 성공적으로 연결되었습니다.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          window.location.href = data.redirectUrl;
        } else {
          throw new Error('리다이렉트 URL이 없습니다.');
        }
      } else {
        toast({
          title: '미구현 기능',
          description: `${provider} 계정 연결은 아직 구현되지 않았습니다.`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
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
        errorMessage = '카카오 앱 키가 유효하지 않습니다. 관리자에게 문의해주세요.';
      }
      toast({
        title: '소셜 계정 연결 실패',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <Container maxW="container.sm" py={8} bg="white" borderRadius="lg" boxShadow="lg">
      <VStack spacing={6} align="stretch">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" color="gray.800">
          소셜 계정 연결
        </Text>
        <Text textAlign="center" color="gray.600">
          소셜 계정을 연결하여 더 편리하게 로그인하세요.
        </Text>
        <VStack spacing={3} align="stretch">
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
            isLoading={isSocialLoading}
            loadingText="카카오 연결 중..."
          >
            카카오로 연결하기
          </Button>
          <Button
            onClick={() => handleSocialConnect('naver')}
            bg="#03C75A"
            color="white"
            leftIcon={<Icon as={SiNaver} />}
            iconSpacing={3}
            _hover={{ bg: '#02B050' }}
            w="full"
            borderRadius="md"
            justifyContent="center"
            isLoading={isSocialLoading}
            loadingText="네이버 연결 중..."
          >
            네이버로 연결하기
          </Button>
          <Button
            onClick={() => handleSocialConnect('google')}
            bg="white"
            color="black"
            border="1px solid"
            borderColor="gray.300"
            leftIcon={<Icon as={FaGoogle} />}
            iconSpacing={3}
            _hover={{ bg: 'gray.100' }}
            w="full"
            borderRadius="md"
            justifyContent="center"
            isLoading={isSocialLoading}
            loadingText="구글 연결 중..."
          >
            구글로 연결하기
          </Button>
        </VStack>
        <Button variant="link" colorScheme="blue" onClick={handleSkip} w="full" mt={4}>
          나중에 연결하기
        </Button>
      </VStack>
    </Container>
  );
};

export default ConnectSocial;
