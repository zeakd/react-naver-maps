import { Activity, useEffect, useState } from 'react';
import type { CoreConfig, LL } from '../../types.js';
import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import { observe, type Observed, type OverlayAnchor } from '../observe.js';
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
  /**
   * Marker 의 position 을 내려주는 방식. 기본 fixed 는 고정값이다.
   * controlled 는 onPositionChanged 값을 상태에 넣어 되돌려주고, delayed 는 AppConfig.delayMs 뒤에 넣는다.
   */
  markerPositionMode?: 'fixed' | 'controlled' | 'delayed';
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

/**
 * overlayDrift 의 Marker 기준점: 아이콘 anchor 가 가리키는 element 안의 점. icon 에 anchor(Point) 가
 * 있으면 element 왼쪽 위 + anchor, 없으면 element 아래 가운데(추정: 기본 핀 아이콘의 뾰족한 끝이
 * 좌표다). SDK 는 element 를 position - anchor 에 놓는다.
 */
function markerAnchor(m: naver.maps.Marker): OverlayAnchor {
  return {
    coord: () => (m.getMap() ? m.getPosition() : null),
    screen: () => {
      const el = m.getElement();
      if (!el || !m.getMap()) return null;
      const rect = el.getBoundingClientRect();
      const icon = m.getIcon() as
        | { anchor?: { x: number; y: number } }
        | string;
      const anchor = typeof icon === 'object' ? icon?.anchor : undefined;
      return anchor
        ? [rect.left + anchor.x, rect.top + anchor.y]
        : [rect.left + rect.width / 2, rect.bottom];
    },
  };
}

function markerElement(
  config: MarkerConfig,
  probe: MarkerProbe,
  core: Observed,
  position: naver.maps.Coord | { lat: number; lng: number },
  onPositionChanged?: (p: naver.maps.Coord) => void,
) {
  return (
    <Marker
      ref={(m: naver.maps.Marker | null) => {
        // ref 가 떨어져도(Activity 로 숨김, 언마운트) 마지막 인스턴스를 계속 본다.
        if (m) probe.marker = m;
        core.recordAnchor('marker', m && markerAnchor(m));
      }}
      position={position}
      clickable={config.markerClickable}
      draggable={config.markerDraggable}
      {...(config.markerAnimation !== undefined
        ? {
            animation: config.markerAnimation as naver.maps.Animation | null,
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
      {...(onPositionChanged ? { onPositionChanged } : {})}
    />
  );
}

/** onPositionChanged 값을 상태에 넣어 position 으로 되돌려주는 Marker. delayed 면 값마다 delayMs 뒤. */
function FeedbackMarker({
  config,
  probe,
  core,
}: {
  config: MarkerConfig & Pick<CoreConfig, 'delayMs'>;
  probe: MarkerProbe;
  core: Observed;
}) {
  const [reported, setReported] = useState<naver.maps.Coord | null>(null);
  const [timers] = useState(() => new Set<number>());
  useEffect(
    () => () => {
      for (const id of timers) window.clearTimeout(id);
    },
    [timers],
  );
  const onPositionChanged = (p: naver.maps.Coord) => {
    if (config.markerPositionMode === 'controlled') setReported(p);
    else {
      timers.add(window.setTimeout(() => setReported(p), config.delayMs ?? 50));
    }
  };
  return markerElement(
    config,
    probe,
    core,
    reported ?? toCoord(INITIAL_CENTER),
    onPositionChanged,
  );
}

export const marker = defineFixture<MarkerConfig, MarkerProbe, MarkerFrame>({
  probe: () => ({ marker: null, clicks: 0 }),
  setup: (maps, _probe, core) =>
    observe(maps.Marker.prototype, OBSERVED_MARKER_METHODS, core.calls),
  render: (config, probe, core) =>
    config.marker && (
      <Activity mode={config.markerActivity ?? 'visible'}>
        {config.markerPositionMode === 'controlled' ||
        config.markerPositionMode === 'delayed' ? (
          <FeedbackMarker config={config} probe={probe} core={core} />
        ) : (
          markerElement(config, probe, core, toCoord(INITIAL_CENTER))
        )}
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
