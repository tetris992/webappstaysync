import React, { useState, useEffect, useCallback } from 'react';
import { useToast, Flex, Text, Spinner } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// MapUpdater 컴포넌트 정의
const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
};

const Map = ({ address, latitude, longitude, onCoordinatesChange = () => {} }) => {
  const [position, setPosition] = useState([latitude || 37.5665, longitude || 126.978]); // 위도/경도 기본값 설정
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 여부 추적
  const toast = useToast();

  console.log('[Map] Received props:', { address, latitude, longitude });

  // 주소 정규화 함수
  const normalizeAddress = (address) => {
    if (!address) return null;
    let normalized = address.trim();

    const provinceMap = {
      창원시: '경상남도',
      부산: '부산광역시',
      서울: '서울특별시',
      대구: '대구광역시',
      인천: '인천광역시',
      광주: '광주광역시',
      대전: '대전광역시',
      울산: '울산광역시',
      세종: '세종특별자치시',
    };

    const cityMatch = Object.keys(provinceMap).find((city) =>
      normalized.includes(city)
    );
    if (cityMatch && !normalized.includes(provinceMap[cityMatch])) {
      normalized = `${provinceMap[cityMatch]} ${normalized}`;
    }

    const cityMap = {
      창원시: 'Changwon-si',
      성산구: 'Seongsan-gu',
      마디미서로: 'Madimi-seoro',
      부산광역시: 'Busan',
      서울특별시: 'Seoul',
      대구광역시: 'Daegu',
      인천광역시: 'Incheon',
      광주광역시: 'Gwangju',
      대전광역시: 'Daejeon',
      울산광역시: 'Ulsan',
      세종특별자치시: 'Sejong',
    };

    Object.keys(cityMap).forEach((key) => {
      normalized = normalized.replace(key, cityMap[key]);
    });

    normalized = normalized
      .replace(/로\s/g, ' Road ')
      .replace(/길\s/g, ' Street ');
    normalized = normalized.replace(/\s\d+번지/g, '');
    normalized = normalized.replace(/,\s*/g, ' ');

    return normalized;
  };

  // openTMap 함수 정의
  const openTMap = useCallback((latitude, longitude, name) => {
    if (!latitude || !longitude) {
      toast({
        title: '좌표 정보 없음',
        description: '호텔 좌표를 찾을 수 없습니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tmapUrl = `tmap://route?goalx=${longitude}&goaly=${latitude}&name=${encodeURIComponent(
      name || '호텔'
    )}`;
    window.location.href = tmapUrl;

    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isAndroid) {
        window.location.href =
          'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
      } else if (isIOS) {
        window.location.href =
          'https://apps.apple.com/kr/app/tmap/id431589174';
      } else {
        toast({
          title: 'T맵 설치 필요',
          description: 'T맵 앱이 설치되어 있지 않습니다. 설치 페이지로 이동합니다.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }, 2000);
  }, [toast]);

  useEffect(() => {
    const fetchCoordinates = async () => {
      console.log('[Map] Starting fetchCoordinates with:', {
        latitude,
        longitude,
        address,
      });

      // 이미 초기화되었고, 프롭스가 변경되지 않았다면 스킵
      if (
        isInitialized &&
        position[0] === latitude &&
        position[1] === longitude
      ) {
        return;
      }

      // 좌표가 제공된 경우 우선 사용
      if (latitude && longitude) {
        const newPosition = [latitude, longitude];
        console.log('[Map] Using provided coordinates:', newPosition);
        setPosition(newPosition);
        if (typeof onCoordinatesChange === 'function') {
          onCoordinatesChange({ lat: latitude, lng: longitude });
        }
        setError(null);
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      // 좌표가 없고 주소가 없는 경우
      if (!address) {
        console.log('[Map] No address provided, setting error');
        setError('주소가 제공되지 않았습니다.');
        setLoading(false);
        openTMap(latitude, longitude, address);
        setIsInitialized(true);
        return;
      }

      // 주소 기반 좌표 조회
      try {
        setLoading(true);
        const normalizedAddress = normalizeAddress(address);
        console.log('[Map] Normalized address:', normalizedAddress);

        let data = [];
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              normalizedAddress
            )}`,
            {
              headers: {
                'User-Agent': 'DanjamApp/0.1.0 (nomac74@example.com)',
              },
            }
          );
          data = await response.json();
          console.log('[Map] Nominatim API response:', data);
        } catch (error) {
          console.error('[Map] Nominatim API failed:', error);
        }

        if (data && data.length > 0) {
          const newPosition = [
            parseFloat(data[0].lat),
            parseFloat(data[0].lon),
          ];
          console.log('[Map] Using Nominatim coordinates:', newPosition);
          setPosition(newPosition);
          if (typeof onCoordinatesChange === 'function') {
            onCoordinatesChange({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
          }
          setError(null);
        } else {
          console.log('[Map] No coordinates found for address:', address);
          setError(`해당 주소의 좌표를 찾을 수 없습니다: ${address}`);
          openTMap(latitude, longitude, address);
        }
      } catch (error) {
        console.error('[Map] Failed to fetch coordinates:', error);
        setError(`좌표를 가져오는 데 실패했습니다: ${error.message}`);
        openTMap(latitude, longitude, address);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    fetchCoordinates();
  }, [address, latitude, longitude, onCoordinatesChange, openTMap, isInitialized, position]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px" w="100%">
        <Spinner size="lg" color="teal.500" />
        <Text ml={2}>지도 로딩 중...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        h="200px"
        w="100%"
      >
        <Text color="red.500">{error}</Text>
        <Text mt={2} color="gray.500">
          T맵 내비게이션이 실행되었습니다.
        </Text>
      </Flex>
    );
  }

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height: '200px', width: '100%' }}
    >
      <MapUpdater position={position} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>{address || '위치 정보 없음'}</Popup>
      </Marker>
    </MapContainer>
  );
};

// React.memo에 커스텀 비교 함수 추가
export default React.memo(Map, (prevProps, nextProps) => {
  return (
    prevProps.address === nextProps.address &&
    prevProps.latitude === nextProps.latitude &&
    prevProps.longitude === nextProps.longitude &&
    prevProps.onCoordinatesChange === nextProps.onCoordinatesChange
  );
});