// src/pages/CouponWallet.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Box,
  Flex,
  Button,
  IconButton,
  Spinner,
  Select,
  Badge,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { fetchCustomerCoupons } from '../api/api';
import { useToast } from '@chakra-ui/react';
import io from 'socket.io-client';

const SOCKET_URL = `${
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3004'
}/socket.io/`.replace(/^http/, 'ws'); // wss://staysync.org/socket.io/ in production

const CouponWallet = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { customer } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortOption, setSortOption] = useState('expiryDate');

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[CouponWallet] Connected to WebSocket');
    });

    socket.on('couponIssued', ({ coupon, message }) => {
      setCoupons((prev) => [...prev, coupon]);
      toast({
        title: '새 쿠폰 발행',
        description: message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      console.log('[CouponWallet] New coupon received:', coupon);
    });

    socket.on('error', (error) => {
      console.error('[CouponWallet] WebSocket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('[CouponWallet] WebSocket connection error:', error);
    });

    return () => {
      socket.disconnect();
      console.log('[CouponWallet] WebSocket disconnected');
    };
  }, [toast]);

  useEffect(() => {
    const loadCoupons = async () => {
      if (!customer?._id) {
        toast({
          title: '인증 오류',
          description: '로그인이 필요합니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        const customerCoupons = await fetchCustomerCoupons(customer._id);
        setCoupons(customerCoupons);
        console.log('[CouponWallet] Loaded coupons:', customerCoupons);
      } catch (error) {
        toast({
          title: '쿠폰 로드 실패',
          description: error.message || '쿠폰을 불러오지 못했습니다.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        console.error('[CouponWallet] Error loading coupons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCoupons();
  }, [customer?._id, navigate, toast]); // 의존성 최적화

  const filteredCoupons = coupons
    .filter((coupon) => {
      const isExpired = new Date(coupon.expiryDate) < new Date();
      if (filterStatus === 'active') return !isExpired && coupon.isActive && !coupon.used;
      if (filterStatus === 'expired') return isExpired || coupon.used;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'expiryDate') {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      }
      if (sortOption === 'discount') {
        return b.discountValue - a.discountValue;
      }
      return 0;
    });

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      flexDirection="column"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflow="hidden"
    >
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bg="white"
        borderBottom="1px"
        borderColor="gray.200"
        py={4}
        zIndex={1000}
      >
        <Container maxW="container.sm">
          <Flex align="center" justify="center" position="relative">
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              position="absolute"
              left={0}
              onClick={() => navigate('/')}
              aria-label="홈으로"
            />
            <Text fontSize="xl" fontWeight="bold">
              쿠폰 보관함
            </Text>
          </Flex>
        </Container>
      </Box>

      <Box
        pt="64px"
        pb="80px"
        flex="1"
        maxH="calc(100vh - 124px)"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.200',
            borderRadius: '24px',
          },
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Container maxW="container.sm" py={4}>
          <Flex mb={4} justify="space-between">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              w="45%"
            >
              <option value="all">모두</option>
              <option value="active">활성화</option>
              <option value="expired">만료/사용됨</option>
            </Select>
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              w="45%"
            >
              <option value="expiryDate">유효기간순</option>
              <option value="discount">할인율순</option>
            </Select>
          </Flex>

          {isLoading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="lg" color="teal.500" />
            </Flex>
          ) : filteredCoupons.length === 0 ? (
            <Text textAlign="center" color="gray.500">
              보유한 쿠폰이 없습니다.
            </Text>
          ) : (
            <VStack spacing={4}>
              {filteredCoupons.map((coupon) => (
                <Box
                  key={coupon.couponUuid}
                  bg="white"
                  p={4}
                  rounded="lg"
                  shadow="sm"
                  w="100%"
                >
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold">{coupon.name}</Text>
                    {coupon.code.startsWith('LOYALTY-V') && (
                      <Badge colorScheme="teal">로열티</Badge>
                    )}
                  </Flex>
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
                    유효 기간: {coupon.startDate} ~ {coupon.expiryDate}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={coupon.isActive && !coupon.used ? 'green.500' : 'red.500'}
                  >
                    상태:{' '}
                    {coupon.isActive && !coupon.used
                      ? '활성화'
                      : coupon.used
                      ? '사용됨'
                      : '만료됨'}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}
        </Container>
      </Box>

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px"
        borderColor="gray.200"
        py={2}
        zIndex={1000}
        height="60px"
      >
        <Container maxW="container.sm">
          <Flex justify="space-around">
            <Button variant="ghost" onClick={() => navigate('/')}>
              홈
            </Button>
            <Button variant="ghost" onClick={() => navigate('/hotels')}>
              숙소
            </Button>
            <Button variant="ghost" onClick={() => navigate('/logout')}>
              로그아웃
            </Button>
            <Button variant="ghost" onClick={() => navigate('/history')}>
              나의 내역
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default CouponWallet;