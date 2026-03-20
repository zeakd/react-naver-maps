import { useEffect, useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';

function GeolocationMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    loaded: boolean;
    error: boolean;
  }>({
    lat: 37.5666805,
    lng: 126.9784147,
    loaded: false,
    error: false,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          loaded: true,
          error: false,
        });

        if (mapRef.current) {
          mapRef.current.setCenter(new navermaps.LatLng(latitude, longitude));
          mapRef.current.setZoom(10);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocation((prev) => ({ ...prev, loaded: true, error: true }));
      },
    );
  }, [navermaps]);

  return (
    <NaverMap
      ref={mapRef}
      defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
      defaultZoom={10}
    >
      {location.loaded && (
        <InfoWindow
          position={new navermaps.LatLng(location.lat, location.lng)}
          content={location.error ? '위치를 가져올 수 없습니다' : '현재 위치'}
        />
      )}
    </NaverMap>
  );
}

function GeolocationMap() {
  return (
    <MapDiv style={{ width: '100%', height: '600px' }}>
      <GeolocationMapContent />
    </MapDiv>
  );
}

export default function MapGeolocationExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <GeolocationMap />
    </NavermapsProvider>
  );
}
