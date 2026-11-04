import { useCallback, useState } from 'react';
import type { LL } from '../../types.js';
import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import { InfoWindow, Marker } from '../target-imports.js';

export type InfoWindowOnMarkerConfig = {
  /**
   * Marker 를 ref 로 받아 state 에 넣고 InfoWindow 의 anchor 로 쓴다(공식 예제의 흔한 모양).
   * Marker 는 markerKey 마다 자리가 다르다(INITIAL_CENTER 에서 위도 0.0005 씩 위).
   */
  infoWindowOnMarker?: boolean;
  /** infoWindowOnMarker 의 Marker 의 key. 바꾸면 Marker 를 다시 만든다. */
  markerKey?: number;
};

export type InfoWindowOnMarkerFrame = {
  /** infoWindowOnMarker 의 InfoWindow 가 열려 있는가(지도에 붙어 있는가). 없으면 null */
  infoWindowOpen: boolean | null;
  /** 그 InfoWindow 의 위치. 없으면 null */
  infoWindowPosition: LL | null;
  /** 그 anchor Marker 의 지금 위치. 없으면 null */
  infoWindowAnchorAt: LL | null;
};

function at(c: unknown): LL {
  const p = c as naver.maps.LatLng;
  return [p.lat(), p.lng()];
}

type Recorder = {
  marker(m: naver.maps.Marker): void;
  info(o: naver.maps.InfoWindow): void;
};

type Probe = {
  infoWindow: naver.maps.InfoWindow | null;
  marker: naver.maps.Marker | null;
  /** 컴포넌트가 마지막 인스턴스를 적는 통로(렌더마다 같은 함수) */
  record: Recorder;
};

function OnMarker({
  markerKey,
  record,
  calls,
}: {
  markerKey: number;
  record: Recorder;
  calls: string[];
}) {
  const [marker, setMarker] = useState<naver.maps.Marker | null>(null);
  // 매 렌더 새 ref 함수면 떼었다 붙이며 state 를 흔든다. 흔한 앱도 stable 한 ref 를 쓴다.
  const onMarker = useCallback(
    (m: naver.maps.Marker | null) => {
      setMarker(m);
      if (m) record.marker(m);
    },
    [record],
  );
  return (
    <>
      <Marker
        key={markerKey}
        ref={onMarker}
        position={toCoord([
          INITIAL_CENTER[0] + 0.0005 * markerKey,
          INITIAL_CENTER[1],
        ])}
      />
      {marker && (
        <InfoWindow
          ref={(o: naver.maps.InfoWindow | null) => {
            if (o) record.info(o);
          }}
          open
          content="on marker"
          anchor={marker}
          onOpen={() => calls.push('markerInfoOpen')}
          onClose={() => calls.push('markerInfoClose')}
        />
      )}
    </>
  );
}

export const infoWindowOnMarker = defineFixture<
  InfoWindowOnMarkerConfig,
  Probe,
  InfoWindowOnMarkerFrame
>({
  probe: () => {
    const probe: Probe = {
      infoWindow: null,
      marker: null,
      record: {
        marker: (m) => {
          probe.marker = m;
        },
        info: (o) => {
          probe.infoWindow = o;
        },
      },
    };
    return probe;
  },
  render: (config, probe, core) =>
    config.infoWindowOnMarker && (
      <OnMarker
        markerKey={config.markerKey ?? 0}
        record={probe.record}
        calls={core.calls}
      />
    ),
  read: (map, probe) => {
    return {
      infoWindowOpen: probe.infoWindow
        ? probe.infoWindow.getMap() === map
        : null,
      infoWindowPosition: probe.infoWindow
        ? at(probe.infoWindow.getPosition())
        : null,
      infoWindowAnchorAt: probe.marker ? at(probe.marker.getPosition()) : null,
    };
  },
});
