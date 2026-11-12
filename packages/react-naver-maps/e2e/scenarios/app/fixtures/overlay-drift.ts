import type { OverlayAnchor } from '../observe.js';
import { defineFixture } from '../fixture.js';

export type OverlayDriftFrame = {
  /**
   * 올린 오버레이(core.anchors 에 등록한 것, 이름은 marker·customOverlay·infoWindow)마다, 오버레이
   * element 의 기준점과 지도가 그 좌표를 그리는 화면 점의 거리(px). 둘 다 지도 element 기준이다.
   * 지도가 그리는 점은 map.getProjection().fromCoordToOffset(좌표). 기준점은 오버레이마다 다르고
   * 각 픽스처 파일에 근거를 적었다. 지도에 없는 오버레이는 null.
   * approximate 인 오버레이(InfoWindow)는 첫 측정의 차이를 뺀 값이라 "움직임에서 생긴 차이"다.
   */
  overlayDrift: Record<string, number | null>;
  /**
   * overlayDrift 와 같되 지도 점을 바로 앞 프레임에 읽은 값으로 쓴다. SDK 가 오버레이를 한 프레임
   * 늦게 그린다면(추정) 이 값이 더 작다. 첫 프레임은 null.
   */
  overlayDriftPrev: Record<string, number | null>;
  /**
   * 오버레이 기준점 - Marker 기준점(화면 px, 둘 다 element 에서 잰다). 래스터는 타일과 오버레이를 한
   * pane 에 넣고 끄는 동안 pane 을 통째로 옮겨, fromCoordToOffset 기준의 overlayDrift 는 끈 거리만큼
   * 커진다(측정 기준의 차이, 2026-11-05 실행). Marker 는 SDK 가 그리므로 이 차이가 처음과 같으면
   * 오버레이가 지도와 함께 움직인 것이다. marker 가 없으면 빈 객체.
   */
  overlayOffsetFromMarker: Record<string, [number, number] | null>;
};

type Probe = {
  /** 이름 → 바로 앞 읽기의 지도 점(지도 element 기준) */
  prev: Record<string, [number, number]>;
  /** approximate 오버레이의 첫 측정 편차 */
  bias: Record<string, [number, number]>;
};

export const overlayDrift = defineFixture<object, Probe, OverlayDriftFrame>({
  probe: () => ({ prev: {}, bias: {} }),
  // 그리지 않는다. 다른 픽스처가 등록한 anchors 를 읽기만 한다.
  render: () => null,
  fields: {
    // 오버레이 화면 자리(px). 래스터 pane 이동·기준점 근사에 따라 달라지는 측정값이고 판정은 시나리오의
    // expect 가 한다(cases/overlay-motion.ts).
    overlayDrift: 'measured',
    overlayDriftPrev: 'measured',
    overlayOffsetFromMarker: 'measured',
  },
  read: (map, probe, core) => {
    const mapRect = map.getElement().getBoundingClientRect();
    const projection = map.getProjection();
    const drift: Record<string, number | null> = {};
    const offsets: Record<string, [number, number] | null> = {};
    const markerScreen =
      (core.anchors as Record<string, OverlayAnchor>).marker?.screen() ?? null;
    const driftPrev: Record<string, number | null> = {};
    for (const [name, anchor] of Object.entries(core.anchors) as [
      string,
      OverlayAnchor,
    ][]) {
      const coord = anchor.coord();
      const screen = anchor.screen();
      if (!coord || !screen) {
        drift[name] = driftPrev[name] = null;
        continue;
      }
      if (markerScreen && name !== 'marker') {
        offsets[name] = [
          screen[0] - markerScreen[0],
          screen[1] - markerScreen[1],
        ];
      }
      const p = projection.fromCoordToOffset(coord) as naver.maps.Point;
      const mapPoint: [number, number] = [p.x, p.y];
      let at: [number, number] = [
        screen[0] - mapRect.left,
        screen[1] - mapRect.top,
      ];
      if (anchor.approximate) {
        probe.bias[name] ??= [at[0] - mapPoint[0], at[1] - mapPoint[1]];
        at = [at[0] - probe.bias[name][0], at[1] - probe.bias[name][1]];
      }
      drift[name] = Math.hypot(at[0] - mapPoint[0], at[1] - mapPoint[1]);
      const before = probe.prev[name];
      driftPrev[name] = before
        ? Math.hypot(at[0] - before[0], at[1] - before[1])
        : null;
      probe.prev[name] = mapPoint;
    }
    return {
      overlayDrift: drift,
      overlayDriftPrev: driftPrev,
      overlayOffsetFromMarker: offsets,
    };
  },
});
