import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  TrafficLayer,
  useNavermaps,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function TrafficMapContent() {
  const navermaps = useNavermaps();
  const [traffic, setTraffic] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        mapTypeControl
        mapTypeControlOptions={{
          style: navermaps.MapTypeControlStyle.DROPDOWN,
        }}
      >
        {traffic && (
          // interval은 5분(최솟값)이며 생성할 때만 적용됩니다.
          <TrafficLayer interval={300000} autoRefresh={autoRefresh} />
        )}
      </NaverMap>
      <ButtonBar>
        <ToggleButton
          on={traffic}
          onClick={() => {
            setTraffic((v) => !v);
            setAutoRefresh(true);
          }}
        >
          실시간 교통정보
        </ToggleButton>
        {traffic && (
          <div
            style={{
              border: 'solid 1px #333',
              padding: '2px',
              backgroundColor: '#fff',
              fontSize: '11px',
              display: 'inline-block',
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />{' '}
              자동 새로고침
            </label>
          </div>
        )}
      </ButtonBar>
    </>
  );
}

export default function TrafficTutorial3Example() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <TrafficMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
