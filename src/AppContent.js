// src/AppContent.js

// src/AppContent.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Alert, AlertIcon, Button, useToast, Spinner, Center, Text } from '@chakra-ui/react';
import Home from './pages/Home';
import HotelList from './pages/HotelList';
import RoomSelection from './pages/RoomSelection';
import ReservationConfirmation from './pages/ReservationConfirmation';
import ReservationHistory from './pages/ReservationHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import KakaoCallback from './components/KakaoCallback';
import PrivacyConsentPage from './pages/PrivacyConsentModal';
import PhoneVerification from './pages/PhoneVerification';
import CompleteProfile from './pages/CompleteProfile';
import BottomNavigation from './components/BottomNavigation';
import MyInfo from './pages/MyInfo';
import Events from './pages/Events';
import { useAuth } from './contexts/AuthContext';
import { fetchCustomerHotelSettings } from './api/api';
import { usePwaInstall } from './hooks/usePwaInstall';
import { isIos, isInStandaloneMode } from './utils/pwaUtils';
import useSocket from './hooks/useSocket';

export default function AppContent() {
  const { isAuthenticated, customer, logout, isAuthLoading } = useAuth();
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // WebSocket 훅 사용
  const { socket, isConnected } = useSocket();

  // 프로필 완성 여부 체크
  const profileComplete =
    Boolean(customer?.name?.trim()) &&
    Boolean(customer?.nickname?.trim()) &&
    customer?.nickname !== '카카오 사용자';

  // 전역 가드: 로그인 및 프로필 완료 여부에 따라 리다이렉트
  useEffect(() => {
    if (isAuthLoading) return;
    if (
      !isAuthenticated &&
      !['/login', '/auth/kakao/callback'].includes(location.pathname) &&
      !location.pathname.includes('/verify-phone')
    ) {
      navigate('/login', { replace: true });
      return;
    }
    if (
      isAuthenticated &&
      !profileComplete &&
      location.pathname !== '/complete-profile' &&
      !location.pathname.includes('/verify-phone')
    ) {
      navigate('/complete-profile', { replace: true });
      return;
    }
  }, [isAuthenticated, profileComplete, location.pathname, navigate, isAuthLoading]);

  // PWA 설치 알림
  const { canInstall, promptInstall } = usePwaInstall();
  const handlePwaInstall = async () => {
    try {
      const accepted = await promptInstall();
      toast({
        title: accepted ? '앱이 설치되었습니다.' : '설치를 거부하셨습니다.',
        status: accepted ? 'success' : 'info',
        duration: 3000,
      });
    } catch {
      toast({ title: '설치 중 오류가 발생했습니다.', status: 'error', duration: 3000 });
    }
  };

  // 호텔 설정 조회
  const loadHotelSettings = useCallback(
    async (hotelId) => {
      try {
        const settings = await fetchCustomerHotelSettings(hotelId);
        setHotelSettings(settings);
      } catch {
        setHotelSettings({
          roomTypes: [
            { roomInfo: 'Standard', price: 100000, photoLinks: ['/assets/default-room1.jpg'] },
          ],
        });
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (isLoading || isAuthLoading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" color="blue.500" />
        <Text ml={4}>로딩 중...</Text>
      </Center>
    );
  }

  return (
    <Box minH="100vh" maxW="100vw" bg="white" position="relative" overflow="hidden">
      <Box pb="60px" minH="100vh" overflowY="auto" sx={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
        {canInstall && (
          <Alert status="info" mb={4} borderRadius="md" mx={4}>
            <AlertIcon />앱을 설치하려면{' '}
            <Button size="sm" ml={2} onClick={handlePwaInstall}>
              설치하기
            </Button>
          </Alert>
        )}
        {isIos() && !isInStandaloneMode() && (
          <Box bg="blue.50" color="blue.800" p={3} m={4} borderRadius="md" fontSize="sm">
            Safari 공유 버튼 → <strong>홈 화면에 추가</strong> 로 설치하세요.
          </Box>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/consent" element={<PrivacyConsentPage />} />
          <Route path="/events" element={<Events />} />
          <Route path="/my-info" element={<MyInfo />} />
          <Route path="/verify-phone/:customerId" element={<PhoneVerification />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route
            path="/hotels"
            element={
              isAuthenticated && customer ? (
                <HotelList onLogout={logout} loadHotelSettings={loadHotelSettings} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/rooms/:hotelId"
            element={
              isAuthenticated && customer ? (
                <RoomSelection hotelSettings={hotelSettings} loadHotelSettings={loadHotelSettings} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/confirm"
            element={
              isAuthenticated && customer ? (
                <ReservationConfirmation customer={customer} hotelSettings={hotelSettings} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/history"
            element={
              isAuthenticated && customer ? (
                <ReservationHistory customer={customer} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        {socket && !isConnected && <Alert status="error" mt={4}><AlertIcon />WebSocket 연결 끊김</Alert>}
      </Box>
      {isAuthenticated && location.pathname !== '/login' && <BottomNavigation />}
    </Box>
  );
}
