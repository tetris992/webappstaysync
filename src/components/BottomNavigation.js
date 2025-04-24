import React from 'react';
import { Box, Flex, Text, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaHome, FaHistory, FaSignOutAlt, FaHeart } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      icon: FaHome,
      label: '홈',
      onClick: () => navigate('/'),
      path: '/',
    },
    {
      icon: FaHeart, // FaHotel -> FaHeart
      label: '찜 숙소', // 숙소 -> 찜 숙소
      onClick: () => navigate('/hotels'),
      path: '/hotels',
    },
    {
      icon: FaSignOutAlt,
      label: '로그아웃',
      onClick: handleLogout,
      path: '/logout',
    },
    {
      icon: FaHistory,
      label: '나의 예약', // 나의 내역 -> 나의 예약
      onClick: () => navigate('/history'),
      path: '/history',
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
      height="60px"
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
    >
      <Flex justify="space-around" align="center" height="100%">
        {menuItems.map((item, index) => (
          <Flex
            key={index}
            direction="column"
            align="center"
            justify="center"
            cursor="pointer"
            onClick={item.onClick}
            color={isActive(item.path) ? 'blue.500' : 'gray.500'}
            _hover={{ color: 'blue.600' }}
            role="group"
            flex={1}
          >
            <Icon
              as={item.icon}
              boxSize={5}
              mb={1}
              transition="all 0.2s"
              _groupHover={{ transform: 'scale(1.1)' }}
            />
            <Text
              fontSize="xs"
              fontWeight={isActive(item.path) ? 'bold' : 'normal'}
            >
              {item.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default BottomNavigation;