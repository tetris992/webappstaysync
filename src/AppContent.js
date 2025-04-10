// webapp/src/AppContent.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import HotelList from './pages/HotelList';
import RoomSelection from './pages/RoomSelection';
import ReservationConfirmation from './pages/ReservationConfirmation';
import ReservationHistory from './pages/ReservationHistory';
import TraditionalLogin from './pages/TraditionalLogin';
import Register from './pages/Register';
import KakaoCallback from './components/KakaoCallback';
import PrivacyConsentPage from './pages/PrivacyConsentModal';
import { useAuth } from './contexts/AuthContext';
import { fetchCustomerHotelSettings } from './api/api';

function AppContent() {
  const { isAuthenticated, customer, logout } = useAuth();
  const [hotelSettings, setHotelSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    setTimeout(() => setIsLoading(false), 0);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<TraditionalLogin />} />
        <Route path="/register" element={<Register />} />
        {/* 카카오 로그인 후 리다이렉트 처리 라우트 */}
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        <Route path="/consent" element={<PrivacyConsentPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default AppContent;