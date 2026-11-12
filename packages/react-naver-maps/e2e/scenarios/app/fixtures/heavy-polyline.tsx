import { INITIAL_CENTER } from '../common.js';
import { defineFixture } from '../fixture.js';
import { Polyline } from '../target-imports.js';

export type HeavyPolylineConfig = {
  /** 꼭짓점이 이만큼인 Polyline 을 지도 가운데에 올린다(성능 측정). */
  heavyPolylinePoints?: number;
  /** path 를 렌더마다 새 배열(같은 좌표)로 넘긴다. 없으면 같은 배열을 넘긴다. */
  heavyPolylineInline?: boolean;
};

const paths = new Map<number, { lat: number; lng: number }[]>();
/**
 * n 개 꼭짓점의 완만한 곡선(GPS 궤적 같은). 같은 n 이면 같은 배열이다. 이웃 점마다 화면에서 200px 씩 오가는
 * 지그재그 1만 점으로는 지도가 init 을 끝내지 못했다(2026-11-05, SDK 그리기 비용으로 보이나 확인 못 함).
 */
function pathOf(n: number) {
  let path = paths.get(n);
  if (!path) {
    path = Array.from({ length: n }, (_, i) => ({
      lat: INITIAL_CENTER[0] + 0.002 * Math.sin((i / n) * Math.PI * 6),
      lng: INITIAL_CENTER[1] - 0.01 + (0.02 * i) / n,
    }));
    paths.set(n, path);
  }
  return path;
}

export const heavyPolyline = defineFixture<HeavyPolylineConfig>({
  // setPath 호출은 polyline 픽스처가 Polyline.prototype 을 감싸 calls 에 이미 남긴다.
  render: (config) =>
    config.heavyPolylinePoints !== undefined && (
      <Polyline
        path={
          config.heavyPolylineInline
            ? pathOf(config.heavyPolylinePoints).map((p) => ({ ...p }))
            : pathOf(config.heavyPolylinePoints)
        }
        strokeColor="#f00"
      />
    ),
});
