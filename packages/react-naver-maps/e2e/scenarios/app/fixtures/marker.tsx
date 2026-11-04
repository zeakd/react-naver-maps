import { Activity } from 'react';
import type { LL } from '../../types.js';
import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import { observe } from '../observe.js';
import { Marker } from '../target-imports.js';

const OBSERVED_MARKER_METHODS = ['setIcon', 'setPosition', 'setAnimation'];

export type MarkerConfig = {
  /** 인라인 핸들러가 있는 Marker 를 함께 올린다. */
  marker?: boolean;
  /** Marker 의 clickable */
  markerClickable?: boolean;
  /** Marker 를 draggable 로 올린다. position 은 고정값이고 onDragend 로 상태를 갱신하지 않는다. */
  markerDraggable?: boolean;
  /** Marker icon 을 렌더마다 새로 만든 같은 값(content 문자열, anchor Point)으로 넘긴다. */
  markerInlineIcon?: boolean;
  /** Marker 를 Activity 로 감싼다. marker 가 있어야 한다. */
  markerActivity?: 'visible' | 'hidden';
  /** Marker 의 animation (naver.maps.Animation 값, null 은 끔). marker 가 있어야 한다. */
  markerAnimation?: number | null;
};

export type MarkerFrame = {
  /** 이 프레임까지 Marker 가 받은 클릭 수 */
  markerClicks: number;
  /** Marker 가 있으면 그 위치 */
  markerPosition: LL | null;
  /** Marker 가 있으면 지금 지도에 붙어 있는가 */
  markerOnMap: boolean | null;
  /** Marker 가 있으면 그 animation (SDK 값). 없으면 null */
  markerAnimation: number | null;
};

type MarkerProbe = { marker: naver.maps.Marker | null; clicks: number };

export const marker = defineFixture<MarkerConfig, MarkerProbe, MarkerFrame>({
  probe: () => ({ marker: null, clicks: 0 }),
  setup: (maps, _probe, core) =>
    observe(maps.Marker.prototype, OBSERVED_MARKER_METHODS, core.calls),
  render: (config, probe) =>
    config.marker && (
      <Activity mode={config.markerActivity ?? 'visible'}>
        <Marker
          ref={(m: naver.maps.Marker | null) => {
            // ref 가 떨어져도(Activity 로 숨김, 언마운트) 마지막 인스턴스를 계속 본다.
            if (m) probe.marker = m;
          }}
          position={toCoord(INITIAL_CENTER)}
          clickable={config.markerClickable}
          draggable={config.markerDraggable}
          {...(config.markerAnimation !== undefined
            ? {
                animation:
                  config.markerAnimation as naver.maps.Animation | null,
              }
            : {})}
          {...(config.markerInlineIcon
            ? {
                icon: {
                  content:
                    '<div style="width:20px;height:20px;background:#f00"></div>',
                  anchor: new naver.maps.Point(10, 10),
                },
              }
            : {})}
          onClick={() => {
            probe.clicks += 1;
          }}
        />
      </Activity>
    ),
  read: (map, probe) => ({
    markerClicks: probe.clicks,
    markerOnMap: probe.marker ? probe.marker.getMap() === map : null,
    markerAnimation: probe.marker
      ? ((probe.marker.getAnimation() as number | null) ?? null)
      : null,
    markerPosition: probe.marker
      ? (() => {
          const p = probe.marker.getPosition() as naver.maps.LatLng;
          return [p.lat(), p.lng()] as LL;
        })()
      : null,
  }),
});
