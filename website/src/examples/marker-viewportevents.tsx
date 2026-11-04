import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  InfoWindow,
} from 'react-naver-maps';

const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';
const X_OFFSET = 29;
const Y_OFFSET = 50;

const spots = Array.from({ length: 27 }, (_, n) => {
  const col = n % 9;
  const row = Math.floor(n / 9);
  const rand = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  return {
    key: `${'ABCDEFGHI'[col]}${row}`,
    letter: 'ABCDEFGHI'[col],
    position: {
      lat: 37.2 + 0.32 * rand(n + 1),
      lng: 126.83 + 0.55 * rand(n + 101),
    },
    origin: { x: col * X_OFFSET, y: row * Y_OFFSET },
  };
});

type Spot = (typeof spots)[number];

// 마커 하나와 그 정보 창. 핸들러를 마커마다 따로 만들 필요 없이, 컴포넌트가 자기 상태를 가진다.
function SpotMarker({ spot }: { spot: Spot }) {
  const [marker, setMarker] = useState<naver.maps.Marker | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Marker
        ref={setMarker}
        position={spot.position}
        title={spot.key}
        zIndex={100}
        icon={{
          url: `${IMG}/sp_pins_spot_v3.png`,
          size: { width: 24, height: 37 },
          anchor: { x: 12, y: 37 },
          origin: spot.origin,
        }}
        onClick={() => setOpen((prev) => !prev)}
      />
      <InfoWindow
        anchor={marker ?? undefined}
        open={open && marker !== null}
        content={`<div style="width:150px;text-align:center;padding:10px;">The Letter is <b>"${spot.letter}"</b>.</div>`}
        // 다른 정보 창이 열리면 SDK 가 이 창을 닫는다. 상태도 맞춘다.
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function MarkerViewportEventsMapContent() {
  const mapRef = useRef<naver.maps.Map>(null);
  const [bounds, setBounds] = useState<naver.maps.LatLngBounds | null>(null);

  const visible = bounds
    ? spots.filter((spot) => bounds.hasLatLng(spot.position))
    : spots;

  return (
    <NaverMap
      ref={mapRef}
      defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
      defaultZoom={10}
      onIdle={() =>
        setBounds(mapRef.current?.getBounds() as naver.maps.LatLngBounds)
      }
    >
      {visible.map((spot) => (
        <SpotMarker key={spot.key} spot={spot} />
      ))}
    </NaverMap>
  );
}

export default function MarkerViewportEventsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerViewportEventsMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
