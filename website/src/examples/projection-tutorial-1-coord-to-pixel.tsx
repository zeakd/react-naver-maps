import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  Rectangle,
  useNavermaps,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function ProjectionMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [bounds, setBounds] = useState<naver.maps.LatLngBounds | null>(null);
  const [last, setLast] = useState<'reduce' | 'expand' | null>(null);

  // 경계의 두 모서리를 픽셀(offset)로 옮겨 x, y 만큼 안쪽(reduce)이나 바깥쪽(expand)으로 민 뒤 다시 좌표로 되돌린다.
  function resize(sign: 1 | -1) {
    const projection = mapRef.current?.getProjection();
    if (!projection || !bounds) return;
    const sw = projection.fromCoordToOffset(bounds.getSW());
    const ne = projection.fromCoordToOffset(bounds.getNE());
    sw.x += 50 * sign;
    sw.y -= 50 * sign;
    ne.x -= 50 * sign;
    ne.y += 50 * sign;
    setBounds(
      new navermaps.LatLngBounds(
        projection.fromOffsetToCoord(sw) as naver.maps.LatLng,
        projection.fromOffsetToCoord(ne) as naver.maps.LatLng,
      ),
    );
    setLast(sign === 1 ? 'reduce' : 'expand');
  }

  return (
    <>
      <NaverMap
        ref={mapRef}
        defaultZoom={16}
        defaultCenter={{ lat: 37.56558, lng: 126.978008 }}
        // 처음 경계는 지도가 계산한 현재 영역이다(init 뒤에 읽을 수 있다).
        onInit={() =>
          setBounds(mapRef.current?.getBounds() as naver.maps.LatLngBounds)
        }
      >
        {bounds && (
          <>
            <Rectangle
              bounds={bounds}
              fillOpacity={0.2}
              strokeOpacity={0.2}
              strokeColor="#00ff00"
              fillColor="#00ff00"
            />
            <Marker position={bounds.getSW()} />
            <Marker position={bounds.getNE()} />
          </>
        )}
      </NaverMap>
      <ButtonBar>
        <ToggleButton on={last === 'reduce'} onClick={() => resize(1)}>
          reduce
        </ToggleButton>
        <ToggleButton on={last === 'expand'} onClick={() => resize(-1)}>
          expand
        </ToggleButton>
      </ButtonBar>
    </>
  );
}

export default function ProjectionTutorial1CoordToPixelExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <ProjectionMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
