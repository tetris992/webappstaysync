import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  Alert,
  AlertIcon,
  Button,
  useToast,
  Spinner,
  Center,
  Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
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

function AppContent() {
  const { isAuthenticated, customer, logout, isAuthLoading } = useAuth();
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const socketRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (!isAuthenticated) return;

    // Build URL inside effect to avoid missing-dependency lint
    const token = encodeURIComponent(localStorage.getItem('customerToken') || '');
    const SOCKET_URL = `${API_BASE}?customerToken=${token}`;

    socketRef.current = io(SOCKET_URL, {
      path: '/socket.io',
    transports: ['websocket'],
      withCredentials: true,
      secure: process.env.NODE_ENV === 'production',
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] connected, id=', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);
    });

    socketRef.current.on('couponIssued', (payload) => {
      toast({
        title: '새 쿠폰 발행',
        description: payload.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    socketRef.current.on('reservationCreated', (data) => {
      toast({
        title: '새 예약 생성',
        description: `예약 ${data.reservation._id}이 생성되었습니다.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    return () => socketRef.current?.disconnect();
  }, [isAuthenticated, toast, API_BASE]);

  const profileComplete =
    Boolean(customer?.name?.trim()) &&
    (customer?.isSocialLogin ||
      (Boolean(customer?.nickname?.trim()) &&
        customer.nickname !== '카카오 사용자'));

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
    } catch {
      setHotelSettings({ roomTypes: [{ roomInfo: 'Standard', price: 100000, photoLinks: ['/assets/default-room1.jpg'] }] });
    }
  }, []);

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
            <AlertIcon /> 앱을 설치하려면{' '}
            <Button size="sm" ml={2} onClick={handlePwaInstall}>설치하기</Button>
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
          <Route path="/hotels" element={isAuthenticated && customer ? <HotelList onLogout={logout} loadHotelSettings={loadHotelSettings} /> : <Navigate to="/login" replace />} />
          <Route path="/rooms/:hotelId" element={isAuthenticated && customer ? <RoomSelection hotelSettings={hotelSettings} loadHotelSettings={loadHotelSettings} /> : <Navigate to="/login" replace />} />
          <Route path="/confirm" element={isAuthenticated && customer ? <ReservationConfirmation customer={customer} hotelSettings={hotelSettings} /> : <Navigate to="/login" replace />} />
          <Route path="/history" element={isAuthenticated && customer ? <ReservationHistory customer={customer} /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
      {isAuthenticated && location.pathname !== '/login' && <BottomNavigation />}
    </Box>
  );
}

export default AppContent;