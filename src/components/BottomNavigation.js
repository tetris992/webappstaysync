import React from 'react';
import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHistory, FaHome, FaHotel, FaUser } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menus = [
    { icon: FaHome, label: '홈', path: '/' },
    { icon: FaHotel, label: '숙소', path: '/hotels' },
    { icon: FaHistory, label: '예약내역', path: '/history' },
    { icon: FaUser, label: '로그아웃', path: '/logout', action: () => {
      logout();
      navigate('/login');
    }},
  ];

  const handleMenuClick = (menu) => {
    if (menu.action) {
      menu.action();
    } else {
      navigate(menu.path);
    }
  };

  return (
    <Box 
      position="fixed" 
      bottom={0} 
      left={0} 
      right={0} 
      height="60px"
      bg="white"
      borderTop="1px solid"
      borderColor="gray.200"
      zIndex={1000}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
    >
      <Flex h="100%" justify="space-around" align="center">
        {menus.map((menu) => (
          <Flex
            key={menu.path}
            direction="column"
            align="center"
            justify="center"
            flex={1}
            py={1}
            cursor="pointer"
            onClick={() => handleMenuClick(menu)}
            transition="all 0.2s"
            color={location.pathname === menu.path ? "blue.500" : "gray.800"}
            _hover={{ color: "blue.500" }}
          >
            <Icon 
              as={menu.icon} 
              boxSize="24px" 
              mb={1}
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.1)' }}
            />
            <Text 
              fontSize="13px" 
              fontWeight="600"
              color="inherit"
            >
              {menu.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default BottomNavigation; 