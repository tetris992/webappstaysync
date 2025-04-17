// src/hooks/useHotelSettings.js
import { useState, useEffect } from 'react';
import { fetchCustomerHotelSettings, fetchHotelPhotos } from '../api/api';
import { isValid as isDateValid } from 'date-fns';

/**
 * Hook to load hotel settings and associated room photos.
 * @param {string} hotelId - ID of the hotel.
 * @param {{ start: Date|string, end: Date|string }} dateRange - Check-in/out dates.
 * @returns {{ settings: object|null, photosMap: Record<string, array>, loading: boolean, error: Error|null }}
 */
export function useHotelSettings(hotelId, dateRange) {
  const [settings, setSettings] = useState(null);
  const [photosMap, setPhotosMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hotelId || !dateRange?.start || !dateRange?.end) {
      setError(new Error('필수 데이터가 누락되었습니다.'));
      return;
    }

    if (!isDateValid(new Date(dateRange.start)) || !isDateValid(new Date(dateRange.end))) {
      setError(new Error('유효하지 않은 날짜 범위입니다.'));
      return;
    }

    let cancelled = false;
    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const checkInStr = dateRange.start instanceof Date
          ? dateRange.start.toISOString().split('T')[0]
          : dateRange.start;
        const checkOutStr = dateRange.end instanceof Date
          ? dateRange.end.toISOString().split('T')[0]
          : dateRange.end;

        const cfg = await fetchCustomerHotelSettings(hotelId, {
          checkIn: checkInStr,
          checkOut: checkOutStr,
        });
        if (cancelled) return;
        setSettings(cfg);

        const map = {};
        const roomTypes = cfg.roomTypes || [];
        await Promise.all(
          roomTypes.map(async (rt) => {
            if (!rt.roomInfo) return;
            try {
              const data = await fetchHotelPhotos(hotelId, 'room', rt.roomInfo);
              map[rt.roomInfo.toLowerCase()] = data.roomPhotos || [];
            } catch {
              map[rt.roomInfo.toLowerCase()] = [];
            }
          })
        );
        if (cancelled) return;
        setPhotosMap(map);
      } catch (err) {
        if (!cancelled) {
          console.error(`[useHotelSettings] Error for hotelId: ${hotelId}`, err);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [hotelId, dateRange?.start, dateRange?.end]);

  return { settings, photosMap, loading, error };
}