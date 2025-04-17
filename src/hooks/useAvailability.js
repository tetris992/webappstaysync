// src/hooks/useAvailability.js
import { useState, useEffect, useCallback } from 'react';
import { fetchHotelAvailability } from '../api/api';
import { getActiveAmenities } from '../utils/hotelUtils';
import { isValid as isDateValid } from 'date-fns';

/**
 * Hook to load room availability and enrich it with amenities and photos.
 * @param {string} hotelId - ID of the hotel.
 * @param {{ start: Date|string, end: Date|string }} dateRange - Check-in/out dates.
 * @param {object|null} hotelSettings - Settings loaded from useHotelSettings.
 * @param {Record<string, array>} photosMap - Map of roomInfo key to photo arrays.
 * @param {string[]} [applicableRoomTypes] - Optional filter of roomInfo keys.
 * @returns {{ rooms: array, loading: boolean, error: Error|null }}
 */
export function useAvailability(hotelId, dateRange, hotelSettings, photosMap, applicableRoomTypes) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAvailability = useCallback(async () => {
    if (!hotelSettings || !hotelId || !dateRange?.start || !dateRange?.end) {
      setError(new Error('필수 데이터가 누락되었습니다.'));
      return;
    }

    if (!isDateValid(new Date(dateRange.start)) || !isDateValid(new Date(dateRange.end))) {
      setError(new Error('유효하지 않은 날짜 범위입니다.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const checkInStr = dateRange.start instanceof Date
        ? dateRange.start.toISOString().split('T')[0]
        : dateRange.start;
      const checkOutStr = dateRange.end instanceof Date
        ? dateRange.end.toISOString().split('T')[0]
        : dateRange.end;

      const data = await fetchHotelAvailability(hotelId, checkInStr, checkOutStr);
      const enriched = (data.availability || []).map((room) => {
        const key = room.roomInfo?.toLowerCase() || '';
        const activeAmenities = getActiveAmenities(hotelSettings.roomTypes || [], key);
        return {
          ...room,
          activeAmenities,
          photos: photosMap[key] || [],
          dayStayPrice: room.price,
          dayUsePrice: Math.round(room.price * 0.5),
        };
      }).filter((room) =>
        !applicableRoomTypes || applicableRoomTypes.includes(room.roomInfo?.toLowerCase())
      );

      setRooms(enriched);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [hotelId, dateRange?.start, dateRange?.end, hotelSettings, photosMap, applicableRoomTypes]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  return { rooms, loading, error, reload: loadAvailability };
}