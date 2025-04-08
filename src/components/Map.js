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

const Map = ({ address, onCoordinatesChange }) => {
  const [position, setPosition] = useState([37.5665, 126.978]); // Default: Seoul
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!address) {
        setError('주소가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
          {
            headers: {
              'User-Agent': 'DanjamApp/0.1.0 (nomac74@example.com)',
            },
          }
        );
        const data = await response.json();
        console.log('Nominatim API response:', data);
        if (data && data.length > 0) {
          const newPosition = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          setPosition(newPosition);
          onCoordinatesChange({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }); // 좌표를 부모로 전달
          setError(null);
        } else {
          setError(`해당 주소의 좌표를 찾을 수 없습니다: ${address}`);
        }
      } catch (error) {
        console.error('Failed to fetch coordinates:', error);
        setError(`좌표를 가져오는 데 실패했습니다: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCoordinates();
  }, [address, onCoordinatesChange]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px" w="100%">
        <Spinner size="lg" color="teal.500" />
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
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;