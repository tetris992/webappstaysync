import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Text, Spinner, Flex } from '@chakra-ui/react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
};

const Map = ({ address, latitude, longitude, onCoordinatesChange }) => {
  const [position, setPosition] = useState([37.5665, 126.978]); // Default: Seoul
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

    const cityMatch = Object.keys(provinceMap).find((city) => normalized.includes(city));
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

    normalized = normalized.replace(/로\s/g, ' Road ').replace(/길\s/g, ' Street ');
    normalized = normalized.replace(/\s\d+번지/g, '');
    normalized = normalized.replace(/,\s*/g, ' ');

    return normalized;
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      console.log('[Map] Starting fetchCoordinates with:', { latitude, longitude, address });

      // 좌표가 제공된 경우 우선 사용
      if (latitude && longitude) {
        const newPosition = [latitude, longitude];
        console.log('[Map] Using provided coordinates:', newPosition);
        setPosition(newPosition);
        onCoordinatesChange({ lat: latitude, lng: longitude });
        setError(null);
        setLoading(false);
        return;
      }

      // 좌표가 없고 주소가 없는 경우
      if (!address) {
        console.log('[Map] No address provided, setting error');
        setError('주소가 제공되지 않았습니다.');
        setLoading(false);
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
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedAddress)}`,
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
          const newPosition = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          console.log('[Map] Using Nominatim coordinates:', newPosition);
          setPosition(newPosition);
          onCoordinatesChange({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          setError(null);
          setLoading(false);
          return;
        }

        console.log('[Map] Falling back to Kakao Maps API...');
        const kakaoApiKey = 'YOUR_KAKAO_API_KEY'; // Kakao API 키를 여기에 입력
        const kakaoResponse = await fetch(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
          {
            headers: {
              Authorization: `KakaoAK ${kakaoApiKey}`,
            },
          }
        );
        const kakaoData = await kakaoResponse.json();
        console.log('[Map] Kakao Maps API response:', kakaoData);

        if (kakaoData.documents && kakaoData.documents.length > 0) {
          const newPosition = [
            parseFloat(kakaoData.documents[0].y),
            parseFloat(kakaoData.documents[0].x),
          ];
          console.log('[Map] Using Kakao coordinates:', newPosition);
          setPosition(newPosition);
          onCoordinatesChange({
            lat: parseFloat(kakaoData.documents[0].y),
            lng: parseFloat(kakaoData.documents[0].x),
          });
          setError(null);
        } else {
          console.log('[Map] No coordinates found for address:', address);
          setError(`해당 주소의 좌표를 찾을 수 없습니다: ${address}`);
        }
      } catch (error) {
        console.error('[Map] Failed to fetch coordinates:', error);
        setError(`좌표를 가져오는 데 실패했습니다: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCoordinates();
  }, [address, latitude, longitude, onCoordinatesChange]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px" w="100%">
        <Spinner size="lg" color="teal.500" />
        <Text ml={2}>지도 로딩 중...</Text>
      </Flex>
    );
  }

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  return (
    <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
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

export default Map;