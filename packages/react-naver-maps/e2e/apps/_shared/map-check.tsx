'use client';

import { useState } from 'react';
import {
  Container,
  NaverMap,
  NavermapsProvider,
  useMap,
} from 'react-naver-maps';
import { useAutoResize } from 'react-naver-maps/addons';

const START = { lat: 37.5666, lng: 126.9784 };
const TARGET = { lat: 37.57, lng: 126.99 };

function AutoResize() {
  useAutoResize(useMap());
  return null;
}

/** 프레임워크별 앱이 공통으로 올리는 지도. verify-frameworks 가 조작하고 확인한다. */
export function MapCheck() {
  const [moved, setMoved] = useState(false);
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <button id="move" onClick={() => setMoved(true)}>
        move
      </button>
      <Container style={{ width: '600px', height: '400px' }}>
        <NaverMap
          ref={(map) => {
            if (map) Object.assign(window, { map });
          }}
          center={moved ? TARGET : START}
          zoom={15}
        >
          <AutoResize />
        </NaverMap>
      </Container>
    </NavermapsProvider>
  );
}
