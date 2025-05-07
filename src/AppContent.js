import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Alert, AlertIcon, Button } from '@chakra-ui/react';

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
import BottomNavigation from './components/BottomNavigation';
import MyInfo from './pages/MyInfo';
import Events from './pages/Events';

import { useAuth } from './contexts/AuthContext';
import { fetchCustomerHotelSettings } from './api/api';
import { usePwaInstall } from './hooks/usePwaInstall';
import { isIos, isInStandaloneMode } from './utils/pwaUtils';

function AppContent() {
  const { isAuthenticated, customer, logout } = useAuth();
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // PWA 설치 훅
  const { canInstall, promptInstall } = usePwaInstall();

  const loadHotelSettings = useCallback(async (hotelId) => {
    try {
      const settings = await fetchCustomerHotelSettings(hotelId);
      setHotelSettings(settings);
    } catch (error) {
      console.error('Failed to load hotel settings:', error);
      // 대체 기본값
      setHotelSettings({
        roomTypes: [
          {
            roomInfo: 'Standard',
            price: 100000,
            photoLinks: ['/assets/default-room1.jpg'],
          },
        ],
      });
    }
  }, []);

  useEffect(() => {
    // 로딩 대기 (예시)
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="white"
      >
        Loading...
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      maxW="100vw"
      bg="white"
      position="relative"
      overflow="hidden"
    >
      <Box
        pb="60px"
        minH="100vh"
        maxW="100%"
        overflowY="auto"
        overflowX="hidden"
        sx={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {/* Android용 PWA 설치 배너 */}
        {canInstall && (
          <Alert status="info" mb={4} borderRadius="md" mx={4}>
            <AlertIcon />
            앱을 설치하려면{' '}
            <Button size="sm" ml={2} onClick={promptInstall}>
              여기를 탭
            </Button>
          </Alert>
        )}

        {/* iOS Safari 설치 안내 */}
        {isIos() && !isInStandaloneMode() && (
          <Alert status="info" mb={4} borderRadius="md" mx={4}>
            <AlertIcon />
            Safari의 ‘공유’ 버튼 → ‘홈 화면에 추가’로 설치할 수 있어요.
          </Alert>
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
                <RoomSelection
                  hotelSettings={hotelSettings}
                  loadHotelSettings={loadHotelSettings}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/confirm"
            element={
              isAuthenticated && customer ? (
                <ReservationConfirmation
                  customer={customer}
                  hotelSettings={hotelSettings}
                />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* 로그인 후, 로그인 페이지가 아닐 때만 하단 내비게이션 */}
      {isAuthenticated && location.pathname !== '/login' && (
        <BottomNavigation />
      )}
    </Box>
  );
}

export default AppContent;
