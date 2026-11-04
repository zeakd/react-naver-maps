import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

function KvoMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [zoom, setZoom] = useState(5);
  const [centerPoint, setCenterPoint] = useState('');

  return (
    <>
      <NaverMap
        ref={mapRef}
        defaultZoom={5}
        defaultCenter={{ lat: 37.3614483, lng: 127.1114883 }}
        padding={{ top: 100 }}
        zoomControl
        zoomControlOptions={{ style: navermaps.ZoomControlStyle.SMALL }}
        onInit={() =>
          setCenterPoint(String(mapRef.current?.getCenterPoint() ?? ''))
        }
        // KVO 이벤트 zoom_changed, bounds_changed 는 on*Changed prop 으로 받는다.
        onZoomChanged={setZoom}
        onBoundsChanged={(bounds) => {
          const map = mapRef.current;
          if (!map) return;
          setCenterPoint(String(map.getCenterPoint()));
          console.log(
            `Center: ${map.getCenter().toString()}, Bounds: ${bounds.toString()}`,
          );
        }}
      />
      <div
        style={{
          width: 350,
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: '#fff',
          border: 'solid 1px #333',
          padding: '0 10px',
        }}
      >
        <h3>Map States</h3>
        <p style={{ fontSize: 14 }}>
          zoom : <em>{zoom}</em>
        </p>
        <p style={{ fontSize: 14 }}>
          centerPoint : <em>{centerPoint}</em>
        </p>
      </div>
    </>
  );
}

export default function EventTutorial2KvoExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <KvoMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
