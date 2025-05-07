// src/AppContent.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  Alert,
  AlertIcon,
  Button,
  useToast,
} from '@chakra-ui/react';
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
  const toast = useToast();

  // PWA 설치 훅
  const { canInstall, promptInstall } = usePwaInstall();

  // "설치하기" 버튼 핸들러 (반드시 사용자 클릭 제스처 안에서만 prompt 호출)
  const handlePwaInstall = async () => {
    try {
      const accepted = await promptInstall();
      if (accepted) {
        toast({
          title: '앱이 설치되었습니다.',
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: '설치를 거부하셨습니다.',
          status: 'info',
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('PWA 설치 중 오류:', err);
      toast({
        title: '설치 중 오류가 발생했습니다.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const loadHotelSettings = useCallback(async (hotelId) => {
    try {
      const settings = await fetchCustomerHotelSettings(hotelId);
      setHotelSettings(settings);
    } catch (error) {
      console.error('Failed to load hotel settings:', error);
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
    // 로딩 스피너 대체용 임시 딜레이
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
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
        {/* Android/Chrome PWA 설치 배너 */}
        {canInstall && (
          <Alert status="info" mb={4} borderRadius="md" mx={4}>
            <AlertIcon />
            앱을 설치하려면{' '}
            <Button size="sm" ml={2} onClick={handlePwaInstall}>
              설치하기
            </Button>
          </Alert>
        )}

        {/* iOS/Safari 설치 안내 */}
        {isIos() && !isInStandaloneMode() && (
          <Box
            bg="blue.50"
            color="blue.800"
            p={3}
            m={4}
            borderRadius="md"
            fontSize="sm"
          >
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
          <Route
            path="/verify-phone/:customerId"
            element={<PhoneVerification />}
          />
          <Route
            path="/hotels"
            element={
              isAuthenticated && customer ? (
                <HotelList
                  onLogout={logout}
                  loadHotelSettings={loadHotelSettings}
                />
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

      {/* 하단 내비게이션 (로그인 후, 로그인 화면이 아닐 때만 표시) */}
      {isAuthenticated && location.pathname !== '/login' && (
        <BottomNavigation />
      )}
    </Box>
  );
}

export default AppContent;
