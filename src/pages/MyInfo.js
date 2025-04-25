import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  VStack,
  Text,
  Button,
  Box,
  Flex,
  Heading,
  useToast,
  SlideFade,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { fetchCustomerCoupons } from '../api/api';
import BottomNavigation from '../components/BottomNavigation';

const MyInfo = () => {
  const navigate = useNavigate();
  const { customer, logout } = useAuth();
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCouponPanelOpen, setIsCouponPanelOpen] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!customer) {
        console.log('[MyInfo] Customer not available, skipping fetchCoupons');
        setLoading(false);
        return;
      }
      try {
        setError(null);
        const customerCoupons = await fetchCustomerCoupons();
        console.log('[MyInfo] Fetched customer coupons:', customerCoupons);
        setCoupons(customerCoupons || []);
      } catch (error) {
        console.error('쿠폰 데이터 가져오기 실패:', error);
        setError(error.message || '쿠폰을 불러오지 못했습니다.');
        toast({
          title: '쿠폰 로드 실패',
          description: error.message || '쿠폰을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [customer, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: '로그아웃 성공',
        description: '성공적으로 로그아웃되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('로그아웃 실패:', error);
      toast({
        title: '로그아웃 실패',
        description: '로그아웃 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!customer) {
    return (
      <Box
        minH="100vh"
        bg="gray.100"
        display="flex"
        flexDirection="column"
        w="100vw"
        maxW="100%"
        overflow="hidden"
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pt="env(safe-area-inset-top)"
        pb="env(safe-area-inset-bottom)"
      >
        <VStack spacing={4} align="stretch" px={4} pt="70px" pb="80px">
          <Text textAlign="center" color="red.500">
            로그인 정보가 없습니다.
          </Text>
          <Button mt={4} w="full" onClick={() => navigate('/login')}>
            로그인 페이지로 이동
          </Button>
        </VStack>
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          zIndex={100}
          pb="env(safe-area-inset-bottom)"
        >
          <BottomNavigation />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="gray.100"
      display="flex"
      flexDirection="column"
      w="100vw"
      maxW="100%"
      overflow="hidden"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      pt="env(safe-area-inset-top)"
      pb="env(safe-area-inset-bottom)"
    >
{/* 상단바 - 고정 위치 */}
<Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        width="100%"
        pt={5} // 상단 여백 (Safe Area와 별개로 타이틀 위 여백 확보)
        pb={3}
        position="fixed"
        top={0}
        zIndex={100}
        boxShadow="sm"
      >
        <Flex align="center" justify="center" position="relative" px={4}>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            나의 정보
          </Text>
        </Flex>
      </Box>

      {/* 본문 - 상하 스크롤 가능 */}
      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        pt="70px" // 상단바 높이 고려
        pb="160px" // 하단 네비게이션 바 높이 + 여유분
        css={{
          '-webkit-overflow-scrolling': 'touch', // iOS 부드러운 스크롤
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#D1D5DB',
            borderRadius: '24px',
          },
        }}
      >
        <VStack spacing={6} align="stretch" px={4}>
          {/* 사용자 정보 */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <Heading size="md" mb={4}>
              사용자 정보
            </Heading>
            <Text fontSize="md" color="gray.600">
              이름: {customer.name || '정보 없음'}
            </Text>
            <Text fontSize="md" color="gray.600">
              이메일: {customer.email || '정보 없음'}
            </Text>
            <Text fontSize="md" color="gray.600">
              전화번호: {customer.phoneNumber || '정보 없음'}
            </Text>
          </Box>

          {/* 나의 쿠폰 */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <Flex align="center" justify="space-between" mb={4}>
              <Heading size="md">나의 쿠폰</Heading>
              <Box position="relative">
                <IconButton
                  icon={<BellIcon />}
                  variant="ghost"
                  size="lg"
                  onClick={() => setIsCouponPanelOpen(true)}
                  aria-label="쿠폰 보관함 열기"
                  color="gray.600"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.1)', color: 'blue.600' }}
                  _active={{ transform: 'scale(0.95)' }}
                />
                {coupons.length > 0 && (
                  <Badge
                    position="absolute"
                    top="0"
                    right="0"
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                  >
                    {coupons.length}
                  </Badge>
                )}
              </Box>
            </Flex>
            <Button
              w="100%"
              colorScheme="blue"
              size="sm"
              onClick={() => setIsCouponPanelOpen(true)}
              borderRadius="lg"
              bg="blue.600"
              _hover={{ bg: 'blue.700' }}
            >
              쿠폰 보관함 열기
            </Button>
          </Box>

          {/* 예약 요약 */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <Heading size="md" mb={4}>
              예약 요약
            </Heading>
            <Text fontSize="md" color="gray.600">
              최근 예약 건수: 0건 (상세 데이터는 나의 예약에서 확인)
            </Text>
            <Button
              mt={2}
              w="100%"
              colorScheme="green"
              size="sm"
              onClick={() => navigate('/history')}
              borderRadius="lg"
              bg="blue.600"
              _hover={{ bg: 'blue.700' }}
            >
              예약 내역 보기
            </Button>
          </Box>

          {/* 약관 및 정책 */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <Heading size="md" mb={4}>
              약관 및 정책
            </Heading>
            <Button
              as={Link}
              to="/consent"
              w="100%"
              colorScheme="gray"
              size="sm"
              variant="outline"
              borderRadius="lg"
              mb={2}
            >
              개인정보처리방침 및 서비스 이용약관
            </Button>
          </Box>

          {/* 고객센터 */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <Heading size="md" mb={4}>
              고객센터
            </Heading>
            <Text fontSize="md" color="gray.600">
              문의: help@danjam.com
            </Text>
            <Text fontSize="md" color="gray.600">
              전화: 123-456-7890 (평일 09:00 - 18:00)
            </Text>
          </Box>

          {/* 로그아웃 버튼 */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <Button
              w="100%"
              colorScheme="red"
              size="md"
              onClick={handleLogout}
              borderRadius="lg"
            >
              로그아웃
            </Button>
          </Box>
        </VStack>
      </Box>

      {/* 쿠폰 보관함 드랍다운 패널 */}
      {isCouponPanelOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={98}
          onClick={() => setIsCouponPanelOpen(false)}
          backdropFilter="blur(4px)"
        />
      )}
      <SlideFade in={isCouponPanelOpen} offsetY="-20px">
        <Box
          position="fixed"
          top="60px"
          left={0}
          right={0}
          bg="white"
          zIndex={99}
          boxShadow="md"
          maxH="50vh"
          overflowY="auto"
          borderBottomRadius="xl"
          p={4}
          mx={4}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold">
              쿠폰 보관함
            </Text>
            <Button
              size="sm"
              onClick={() => setIsCouponPanelOpen(false)}
              variant="ghost"
            >
              닫기
            </Button>
          </Flex>
          {loading ? (
            <Text textAlign="center" color="gray.500">
              쿠폰을 불러오는 중입니다...
            </Text>
          ) : error ? (
            <Text textAlign="center" color="red.500">
              {error}
            </Text>
          ) : coupons.length === 0 ? (
            <Text color="gray.500" textAlign="center">
              보유한 쿠폰이 없습니다.
            </Text>
          ) : (
            <VStack spacing={3}>
              {coupons.map((coupon) => (
                <Box
                  key={coupon.couponUuid}
                  bg="gray.50"
                  p={3}
                  rounded="lg"
                  w="100%"
                  borderTop="1px dashed"
                  borderColor="gray.300"
                >
                  <Text fontWeight="bold" color="gray.800">
                    {coupon.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    코드: {coupon.code}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    할인:{' '}
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : `${coupon.discountValue.toLocaleString()}원`}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    유효 기간: {coupon.startDate} ~ {coupon.endDate}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={coupon.used ? 'red.500' : 'green.500'}
                  >
                    상태: {coupon.used ? '사용됨' : '사용 가능'}
                  </Text>
                </Box>
              ))}
              <Button
                w="100%"
                colorScheme="blue"
                size="sm"
                onClick={() => navigate('/coupon-wallet')}
                borderRadius="lg"
                bg="blue.600"
                _hover={{ bg: 'blue.700' }}
              >
                쿠폰 보관함으로 이동
              </Button>
            </VStack>
          )}
        </Box>
      </SlideFade>

      {/* 하단 네비게이션 바 - 고정 위치 */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={100}
        pb="env(safe-area-inset-bottom)"
      >
        <BottomNavigation />
      </Box>
    </Box>
  );
};

export default MyInfo;
