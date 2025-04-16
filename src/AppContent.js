// webapp/src/AppContent.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Home from './pages/Home';
import HotelList from './pages/HotelList';
import RoomSelection from './pages/RoomSelection';
import ReservationConfirmation from './pages/ReservationConfirmation';
import ReservationHistory from './pages/ReservationHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import KakaoCallback from './components/KakaoCallback';
import PrivacyConsentPage from './pages/PrivacyConsentModal';
import BottomNavigation from './components/BottomNavigation';
import { useAuth } from './contexts/AuthContext';
import { fetchCustomerHotelSettings } from './api/api';
import Events from './pages/Events';

function AppContent() {
  const { isAuthenticated, customer, logout } = useAuth();
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/consent" element={<PrivacyConsentPage />} />
          <Route path="/events" element={<Events />} />
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
      {isAuthenticated && location.pathname !== '/login' && (
        <BottomNavigation />
      )}
    </Box>
  );
}

export default AppContent;
