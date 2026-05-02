import { useEffect, useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';

const FALLBACK_CENTER = { lat: 37.5666805, lng: 126.9784147 };

type LocationState =
  | { status: 'pending' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'error'; lat: number; lng: number };

function GeolocationMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [location, setLocation] = useState<LocationState>({
    status: 'pending',
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ status: 'error', ...FALLBACK_CENTER });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ status: 'success', lat: latitude, lng: longitude });
        mapRef.current?.setCenter(new navermaps.LatLng(latitude, longitude));
      },
      () => {
        const center = mapRef.current?.getCenter();
        setLocation({
          status: 'error',
          lat: center?.y ?? FALLBACK_CENTER.lat,
          lng: center?.x ?? FALLBACK_CENTER.lng,
        });
      },
    );
  }, [navermaps]);

  const renderContent = () => {
    if (location.status === 'success') {
      return `<div style="padding:20px;">geolocation.getCurrentPosition() 위치</div>`;
    }
    if (location.status === 'error') {
      return (
        `<div style="padding:20px;">` +
        `<h5 style="margin-bottom:5px;color:#f00;">Geolocation failed!</h5>` +
        `latitude: ${location.lat}<br />longitude: ${location.lng}` +
        `</div>`
      );
    }
    return '';
  };

  return (
    <NaverMap
      ref={mapRef}
      defaultCenter={
        new navermaps.LatLng(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng)
      }
      defaultZoom={10}
    >
      {location.status !== 'pending' && (
        <InfoWindow
          open
          position={new navermaps.LatLng(location.lat, location.lng)}
          content={renderContent()}
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
