import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import type { OverlayAnchor } from '../observe.js';
import { CustomOverlay } from '../target-imports.js';

export type CustomOverlayConfig = {
  /** 지도 가운데(INITIAL_CENTER)에 React 내용을 그리는 CustomOverlay 를 올린다. */
  customOverlay?: boolean;
  /** customOverlay 의 내용이 렌더마다 바뀌게 한다(렌더 횟수를 그린다). */
  customOverlayTick?: boolean;
};

/** 내용 박스의 크기와 anchor. anchor 는 박스 가운데이므로 박스 가운데가 좌표에 놓인다. */
const SIZE = 20;
const ANCHOR = { x: SIZE / 2, y: SIZE / 2 };

type OverlayViewWithContainer = naver.maps.OverlayView & {
  getContainerElement?: () => HTMLElement;
};

/**
 * overlayDrift 의 CustomOverlay 기준점: 컨테이너 element 의 왼쪽 위 + anchor.
 * src/overlays/custom-overlay.tsx 의 draw() 가 컨테이너를 (좌표의 화면 점 - anchor) 에 놓는다.
 */
function customOverlayAnchor(o: OverlayViewWithContainer): OverlayAnchor {
  return {
    coord: () => (o.getMap() ? new naver.maps.LatLng(...INITIAL_CENTER) : null),
    screen: () => {
      const el = o.getContainerElement?.();
      if (!el || !o.getMap()) return null;
      const rect = el.getBoundingClientRect();
      return [rect.left + ANCHOR.x, rect.top + ANCHOR.y];
    },
  };
}

type Probe = { renders: number };

export const customOverlay = defineFixture<CustomOverlayConfig, Probe>({
  probe: () => ({ renders: 0 }),
  render: (config, probe, core) => {
    // 앱이 렌더될 때마다 늘어 CustomOverlay 의 내용(DOM)이 바뀐다.
    probe.renders += 1;
    return (
      config.customOverlay && (
        <CustomOverlay
          ref={(o: naver.maps.OverlayView | null) =>
            core.recordAnchor('customOverlay', o && customOverlayAnchor(o))
          }
          position={toCoord(INITIAL_CENTER)}
          anchor={new naver.maps.Point(ANCHOR.x, ANCHOR.y)}
        >
          <div
            style={{
              width: SIZE,
              height: SIZE,
              background: '#07f',
              color: '#fff',
              font: '10px/20px monospace',
              textAlign: 'center',
            }}
          >
            {config.customOverlayTick && probe.renders}
          </div>
        </CustomOverlay>
      )
    );
  },
});
