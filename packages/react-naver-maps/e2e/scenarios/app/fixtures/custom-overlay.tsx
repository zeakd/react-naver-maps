import { useEffect, useLayoutEffect, useState } from 'react';
import { Activity } from '../activity.js';
import type { CoreConfig } from '../../types.js';
import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import type { OverlayAnchor } from '../observe.js';
import { CustomOverlay } from '../target-imports.js';

export type CustomOverlayConfig = {
  /** 지도 가운데(INITIAL_CENTER)에 React 내용을 그리는 CustomOverlay 를 올린다. */
  customOverlay?: boolean;
  /** customOverlay 의 내용이 렌더마다 바뀌게 한다(렌더 횟수를 그린다). */
  customOverlayTick?: boolean;
  /**
   * 값 동기화 시점을 보는 CustomOverlay 를 올린다. 부모가 layout effect 와 effect 에서 컨테이너가 지금
   * position prop 의 자리에 그려져 있는지 calls 에 남긴다(`layout:<shift>:match|stale`, `paint:...`).
   */
  customOverlayProbe?: boolean;
  /** 1 이면 probe 의 position 을 가운데에서 동쪽으로 옮긴다. */
  customOverlayShift?: number;
  /** probe 를 마운트하는 부모의 layout effect 에서 shift 를 1 로 바꾼다. 생성과 첫 동기화 사이다. */
  customOverlayShiftDuringMount?: boolean;
  /**
   * probe 의 컨테이너 zIndex(prop 은 5)를 ref 로 바깥에서 99 로 바꾼다. 그 뒤로 컨테이너 zIndex 를
   * calls 에 남긴다(`z:<값>`).
   */
  customOverlayExternalZ?: boolean;
  /** probe 의 CustomOverlay 를 감싼 Activity 의 mode. */
  customOverlayActivity?: 'visible' | 'hidden';
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

type ProbeOverlay = naver.maps.OverlayView & {
  getContainerElement(): HTMLElement;
};

/** 컨테이너가 지금 prop 자리에 그려져 있는가. draw() 와 같은 계산(좌표의 화면 점 - anchor). */
function drawnAt(o: ProbeOverlay, shift: number): 'match' | 'stale' {
  const coord = new naver.maps.LatLng(
    INITIAL_CENTER[0],
    INITIAL_CENTER[1] + shift * 0.001,
  );
  const point = o.getProjection().fromCoordToOffset(coord);
  const el = o.getContainerElement();
  const left = parseFloat(el.style.left);
  const top = parseFloat(el.style.top);
  return Math.abs(left - (point.x - ANCHOR.x)) < 0.5 &&
    Math.abs(top - (point.y - ANCHOR.y)) < 0.5
    ? 'match'
    : 'stale';
}

function CustomOverlayProbe({
  shift: shiftProp,
  duringMount,
  activity,
  tick,
  externalZ,
  log,
}: {
  shift: number;
  duringMount: boolean;
  activity: 'visible' | 'hidden';
  /** 바뀌면 paint 기록을 다시 남긴다. 마운트 때의 기록은 trace 시작 전이라 남지 않는다. */
  tick: number;
  externalZ: boolean;
  log: (call: string) => void;
}) {
  const [mountShift, setMountShift] = useState<number | null>(null);
  const shift = mountShift ?? shiftProp;
  const [overlay, setOverlay] = useState<ProbeOverlay | null>(null);
  useLayoutEffect(() => {
    // 일부러 layout effect 에서 바꾼다. 인스턴스 생성과 첫 값 동기화 사이에 prop 이 바뀐다.
    // oxlint-disable-next-line react/set-state-in-effect
    if (duringMount) setMountShift(1);
  }, [duringMount]);
  // 자식(CustomOverlay)의 layout effect 가 끝난 뒤 돈다. 같은 렌더 안에서 새 자리인지 본다.
  useLayoutEffect(() => {
    if (overlay?.getMap()) log(`layout:${shift}:${drawnAt(overlay, shift)}`);
    // log 는 렌더마다 새 함수지만 기록만 한다. 다시 돌 이유가 아니다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay, shift]);
  useEffect(() => {
    if (overlay?.getMap()) log(`paint:${shift}:${drawnAt(overlay, shift)}`);
    // log 는 렌더마다 새 함수지만 기록만 한다. 다시 돌 이유가 아니다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay, shift, activity, tick]);
  useEffect(() => {
    if (!externalZ || !overlay?.getMap()) return;
    const el = overlay.getContainerElement();
    if (el.dataset.externalZ !== 'done') {
      el.dataset.externalZ = 'done';
      el.style.zIndex = '99';
    }
    log(`z:${el.style.zIndex}`);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay, activity, externalZ]);
  return (
    <Activity mode={activity}>
      <CustomOverlay
        ref={(o: naver.maps.OverlayView | null) =>
          setOverlay(o as ProbeOverlay | null)
        }
        position={toCoord([
          INITIAL_CENTER[0],
          INITIAL_CENTER[1] + shift * 0.001,
        ])}
        anchor={new naver.maps.Point(ANCHOR.x, ANCHOR.y)}
        zIndex={5}
      >
        <div style={{ width: SIZE, height: SIZE, background: '#f70' }} />
      </CustomOverlay>
    </Activity>
  );
}

export const customOverlay = defineFixture<CustomOverlayConfig, Probe>({
  probe: () => ({ renders: 0 }),
  render: (config, probe, core) => {
    // 앱이 렌더될 때마다 늘어 CustomOverlay 의 내용(DOM)이 바뀐다.
    probe.renders += 1;
    return (
      <>
        {config.customOverlayProbe && (
          <CustomOverlayProbe
            shift={config.customOverlayShift ?? 0}
            duringMount={config.customOverlayShiftDuringMount ?? false}
            activity={config.customOverlayActivity ?? 'visible'}
            // 픽스처는 전체 설정을 받는다. tick 은 CoreConfig 의 것이다.
            tick={(config as Pick<CoreConfig, 'tick'>).tick ?? 0}
            externalZ={config.customOverlayExternalZ ?? false}
            log={(call) => core.calls.push(call)}
          />
        )}
        {config.customOverlay && (
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
        )}
      </>
    );
  },
});
