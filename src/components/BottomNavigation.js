import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  useColorModeValue,
  Badge,
  Button,
} from '@chakra-ui/react';
import { FaHome, FaHistory, FaHeart, FaUser } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchCustomerCoupons } from '../api/api';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!customer) {
        console.log(
          '[BottomNavigation] Customer not available, skipping fetchCoupons'
        );
        return;
      }
      try {
        const customerCoupons = await fetchCustomerCoupons();
        console.log(
          '[BottomNavigation] Fetched customer coupons:',
          customerCoupons
        );
        setCoupons(customerCoupons || []);
      } catch (error) {
        console.error('쿠폰 데이터 가져오기 실패:', error);
      }
    };

    fetchCoupons();
  }, [customer]);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      icon: FaHome,
      label: '홈',
      onClick: () => navigate('/'),
      path: '/',
    },
    {
      icon: FaHeart,
      label: '찜 숙소',
      onClick: () => navigate('/hotels'),
      path: '/hotels',
    },
    {
      icon: FaHistory,
      label: '나의 예약',
      onClick: () => navigate('/history'),
      path: '/history',
    },
    {
      icon: FaUser,
      label: '나의 정보',
      onClick: () => navigate('/my-info'),
      path: '/my-info',
      hasBadge: true,
    },
  ];

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bg}
      borderTop="1px solid"
      borderColor={borderColor}
      px={4}
      py={2}
      zIndex={2000}
      height="calc(60px + env(safe-area-inset-bottom))"
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
    >
      <Flex justify="space-around" align="center" height="100%">
        {menuItems.map((item, index) => (
          <Button
            key={index}
            variant="unstyled"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            onClick={item.onClick}
            color={isActive(item.path) ? 'blue.500' : 'gray.500'}
            _hover={{ color: 'blue.600' }}
            _active={{ bg: 'gray.100' }}
            flex={1}
            position="relative"
            userSelect="none" // 전체 버튼에서 텍스트 선택 비활성화
          >
            <Icon
              as={item.icon}
              boxSize={5}
              mb={1}
              transition="all 0.2s"
              _hover={{ transform: 'scale(1.1)' }}
            />
            {item.hasBadge && coupons.length > 0 && (
              <Badge
                position="absolute"
                top="2px"
                right="30%"
                bg="red.500"
                w="8px"
                h="8px"
                borderRadius="full"
                p={0}
                minW="unset"
              />
            )}
            <Text
              fontSize="xs"
              fontWeight={isActive(item.path) ? 'bold' : 'normal'}
              userSelect="none" // 텍스트 선택 비활성화
              pointerEvents="none" // 텍스트에서 터치 이벤트 방지
            >
              {item.label}
            </Text>
          </Button>
        ))}
      </Flex>
    </Box>
  );
};

export default BottomNavigation;