import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

const normalBtnStyle = {
  backgroundColor: '#fff',
  border: 'solid 1px #333',
  outline: '0 none',
  borderRadius: '5px',
  boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',
  fontSize: '16px',
  lineHeight: '1.15',
  padding: '1px 6px',
  margin: '0 5px 5px 0',
  cursor: 'pointer' as const,
};
const selectedBtnStyle = {
  ...normalBtnStyle,
  backgroundColor: '#2780E3',
  color: 'white',
};

function MapOptionsMap() {
  const navermaps = useNavermaps();
  const [interaction, setInteraction] = useState(true);
  const [kineticPan, setKineticPan] = useState(false);
  const [tileTransition, setTileTransition] = useState(true);
  const [controls, setControls] = useState(true);
  const [minZoom, setMinZoom] = useState(7);

  return (
    <MapDiv style={{ width: '100%', height: '600px' }}>
      <NaverMap
        defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}
        defaultZoom={13}
        draggable={interaction}
        pinchZoom={interaction}
        scrollWheel={interaction}
        keyboardShortcuts={interaction}
        disableDoubleTapZoom={!interaction}
        disableDoubleClickZoom={!interaction}
        disableTwoFingerTapZoom={!interaction}
        disableKineticPan={!kineticPan}
        tileTransition={tileTransition}
        scaleControl={controls}
        logoControl={controls}
        mapDataControl={controls}
        zoomControl={true}
        zoomControlOptions={{ position: navermaps.Position.TOP_RIGHT }}
        mapTypeControl={controls}
        minZoom={minZoom}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1000,
          padding: '5px',
        }}
      >
        <button
          style={interaction ? selectedBtnStyle : normalBtnStyle}
          onClick={() => setInteraction((v) => !v)}
        >
          지도 인터렉션
        </button>
        <button
          style={kineticPan ? selectedBtnStyle : normalBtnStyle}
          onClick={() => setKineticPan((v) => !v)}
        >
          관성 드래깅
        </button>
        <button
          style={tileTransition ? selectedBtnStyle : normalBtnStyle}
          onClick={() => setTileTransition((v) => !v)}
        >
          타일 fadeIn 효과
        </button>
        <button
          style={controls ? selectedBtnStyle : normalBtnStyle}
          onClick={() => setControls((v) => !v)}
        >
          모든 지도 컨트롤
        </button>
        <button
          style={normalBtnStyle}
          onClick={() => setMinZoom((v) => (v === 7 ? 10 : 7))}
        >
          최소/최대 줌 레벨: {minZoom} ~ 21
        </button>
      </div>
    </MapDiv>
  );
}

export default function MapOptionsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapOptionsMap />
    </NavermapsProvider>
  );
}
