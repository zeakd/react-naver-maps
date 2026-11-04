import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  CustomControl,
  useNavermaps,
} from 'react-naver-maps';

// 큰 지도의 유형에 짝지은 미니 맵 유형(공식 예제와 같다).
const MINIMAP_TYPES: Record<string, string> = {
  normal: 'hybrid',
  terrain: 'satellite',
  satellite: 'terrain',
  hybrid: 'normal',
};

function MinimapMap({
  minimapRef,
  mainMapTypeId,
  onDrag,
}: {
  minimapRef: React.RefObject<naver.maps.Map | null>;
  mainMapTypeId: string;
  onDrag: () => void;
}) {
  return (
    // 미니 맵도 Container 와 NaverMap 한 벌이다. 큰 지도의 CustomControl 안에 둔다.
    <MapDiv
      style={{
        width: 200,
        height: 200,
        margin: '0 5px 20px 0',
        border: 'solid 1px #333',
      }}
    >
      <NaverMap
        ref={minimapRef}
        defaultCenter={{ lat: 37.5666805, lng: 126.9784147 }}
        defaultZoom={12}
        mapTypeId={MINIMAP_TYPES[mainMapTypeId] ?? 'normal'}
        scrollWheel={false}
        scaleControl={false}
        mapDataControl={false}
        logoControl={false}
        onDrag={onDrag}
      />
    </MapDiv>
  );
}

function FullsizeMinimapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const minimapRef = useRef<naver.maps.Map>(null);
  const [mapTypeId, setMapTypeId] = useState<string>(
    navermaps.MapTypeId.HYBRID,
  );
  // 미니 맵을 끌어 큰 지도를 옮기는 동안은 큰 지도 쪽 변화가 미니 맵을 다시 맞추지 않는다.
  const draggingMinimapRef = useRef(false);

  return (
    <NaverMap
      ref={mapRef}
      defaultCenter={{ lat: 37.5666805, lng: 126.9784147 }}
      defaultZoom={13}
      minZoom={6}
      mapTypeId={mapTypeId}
      onMapTypeIdChanged={setMapTypeId}
      zoomControl
      zoomControlOptions={{ position: navermaps.Position.TOP_RIGHT }}
      mapDataControl={false}
      mapTypeControl
      logoControlOptions={{ position: navermaps.Position.LEFT_BOTTOM }}
      disableKineticPan={false}
      onBoundsChanged={(bounds) => {
        if (draggingMinimapRef.current) return;
        minimapRef.current?.fitBounds(bounds);
      }}
      onIdle={() => {
        draggingMinimapRef.current = false;
      }}
    >
      <CustomControl position={navermaps.Position.BOTTOM_RIGHT}>
        <MinimapMap
          minimapRef={minimapRef}
          mainMapTypeId={mapTypeId}
          onDrag={() => {
            const center = minimapRef.current?.getCenter();
            if (!center) return;
            draggingMinimapRef.current = true;
            mapRef.current?.panTo(center);
          }}
        />
      </CustomControl>
    </NaverMap>
  );
}

export default function MapTutorial7FullsizeMinimapExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <FullsizeMinimapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
