import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

type Menu = { x: number; y: number; coord: string; point: string };

function EventMapContent() {
  const [markers, setMarkers] = useState<naver.maps.Coord[]>([]);
  const [menu, setMenu] = useState<Menu | null>(null);

  return (
    <>
      <NaverMap
        defaultZoom={5}
        defaultCenter={{ lat: 37.3614483, lng: 127.1114883 }}
        // 클릭한 자리에 마커를 더한다.
        onClick={(e) => setMarkers((list) => [...list, e.coord])}
        // ESC 로 마커와 메뉴를 지운다. keydown 은 지도에 초점이 있을 때 온다.
        onKeydown={(e) => {
          if (e.keyboardEvent.key === 'Escape') {
            e.keyboardEvent.preventDefault();
            setMarkers([]);
            setMenu(null);
          }
        }}
        onMousedown={() => setMenu(null)}
        // 오른쪽 클릭 자리(지도 안 픽셀 offset)에 좌표 정보를 띄운다.
        onRightclick={(e) =>
          setMenu({
            x: e.offset.x,
            y: e.offset.y,
            coord: e.coord.toString(),
            point: e.point.toString(),
          })
        }
      >
        {markers.map((coord, i) => (
          <Marker key={i} position={coord} />
        ))}
      </NaverMap>
      {menu && (
        <div
          style={{
            position: 'absolute',
            left: menu.x,
            top: menu.y,
            zIndex: 10000,
            backgroundColor: '#fff',
            border: 'solid 1px #333',
            padding: '10px',
            fontSize: '14px',
          }}
        >
          Coord: {menu.coord}
          <br />
          Point: {menu.point}
          <br />
          Offset: ({menu.x}, {menu.y})
        </div>
      )}
    </>
  );
}

export default function EventTutorial1SimpleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <EventMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
