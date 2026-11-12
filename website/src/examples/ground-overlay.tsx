import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  GroundOverlay,
} from 'react-naver-maps';

function GroundOverlayMapContent() {
  return (
    <NaverMap
      defaultCenter={{ lat: 36.634249797, lng: 127.129160067 }}
      defaultZoom={13}
      defaultMapTypeId="normal"
    >
      <GroundOverlay
        url="https://navermaps.github.io/maps.js.ncp/docs/img/example/naver-satellite.png"
        bounds={{
          south: 36.634249797,
          west: 127.129160067,
          north: 36.734249797,
          east: 127.410516004,
        }}
        opacity={1}
        clickable={false}
      />
    </NaverMap>
  );
}

export default function GroundOverlayExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <GroundOverlayMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
