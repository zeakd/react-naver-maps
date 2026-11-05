'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle } from 'react';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { useMap } from '../hooks/use-map.js';
import { useStyleMapLayerWarning } from './use-style-map-layer-warning.js';
import { useStaticProp } from '../binding/use-static-prop.js';
import { omitUndefined } from '../binding/omit-undefined.js';
import { onMap, useSdkInstance } from '../binding/lifetime.js';
import { useLatest } from '../binding/use-latest.js';
import { sdkAlive } from '../sdk/listeners.js';

/** 실시간 교통 레이어를 지도 위에 표시한다. */
export interface TrafficLayerProps {
  ref?: Ref<naver.maps.TrafficLayer>;
  /** autoRefresh 주기 (ms). 생성자 옵션으로만 전달된다. */
  interval?: number;
  /**
   * true이면 교통 정보를 주기적으로 자동 갱신한다.
   * 주의: `undefined`는 "SDK 기본값에 위임"을 의미하며 명시적 정지가 아니다.
   * 한 번 `true`로 켠 뒤 `undefined`로 바꿔도 자동 갱신은 멈추지 않는다.
   * 정지하려면 명시적으로 `false`를 전달한다.
   * SDK 는 지도에 붙일 때마다(숨겼다 다시 보일 때 포함) 교통 정보 버전을 받은 뒤 자동 갱신을 다시 켠다.
   * `false` 면 붙어 있는 동안 곧바로 몇 번, 그 뒤로 5초마다 다시 끈다. 응답이 늦어도 켜진 자동 갱신은 늦어도
   * 5초 안에 꺼진다.
   */
  autoRefresh?: boolean;
}

/**
 * SDK 는 지도에 붙일 때마다 교통 정보 버전을 받아 온 뒤 자동 갱신을 켠다. 그 응답 전에 부른 endAutoRefresh 는
 * 소용이 없고, 응답을 알리는 공개 이벤트가 없다(3.10.5 실측: 붙인 뒤 5~43ms 에 켜짐, 생성자 옵션·붙이기 전
 * endAutoRefresh·tilesloaded 뒤 끄기 모두 실패). 그래서 autoRefresh={false} 로 붙어 있는 동안은 곧바로 몇 번,
 * 그 뒤로는 HOLD_OFF_EVERY_MS 마다 끈다. endAutoRefresh 는 이미 꺼져 있으면 아무것도 하지 않는다. 응답이 늦어도
 * 켜진 자동 갱신은 늦어도 HOLD_OFF_EVERY_MS 안에 꺼진다. 처음 몇 번은 응답이 보통 빨라서(위 실측) 둔다.
 */
const HOLD_OFF_SOON_MS = [100, 1000];
const HOLD_OFF_EVERY_MS = 5000;
const holdOffTimers = new WeakMap<object, ReturnType<typeof setTimeout>[]>();

function holdOff(
  layer: naver.maps.TrafficLayer,
  latest: { readonly current: boolean | undefined },
) {
  cancelHoldOff(layer);
  const end = () => {
    // SDK 가 죽으면(인증 실패) 더 할 일이 없다. 그때는 수명 처리가 떼기를 건너뛰므로 여기서 멈춘다.
    if (!sdkAlive()) {
      cancelHoldOff(layer);
      return;
    }
    if (latest.current === false) layer.endAutoRefresh();
  };
  holdOffTimers.set(layer, [
    ...HOLD_OFF_SOON_MS.map((ms) => setTimeout(end, ms)),
    setInterval(end, HOLD_OFF_EVERY_MS),
  ]);
}

function cancelHoldOff(layer: naver.maps.TrafficLayer) {
  // clearTimeout 은 setInterval 의 것도 지운다(같은 번호 공간).
  holdOffTimers.get(layer)?.forEach(clearTimeout);
  holdOffTimers.delete(layer);
}

/** prop 미지정(undefined)이면 SDK 기본값에 맡기고 부르지 않는다. */
function applyAutoRefresh(
  layer: naver.maps.TrafficLayer,
  autoRefresh: boolean | undefined,
) {
  if (autoRefresh === undefined) return;
  if (autoRefresh) layer.startAutoRefresh();
  else layer.endAutoRefresh();
}

export function TrafficLayer({
  ref,
  interval,
  autoRefresh,
}: TrafficLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  useStyleMapLayerWarning(map, 'TrafficLayer');

  useStaticProp(
    'TrafficLayer',
    'interval' satisfies keyof TrafficLayerProps,
    interval,
  );

  // interval 은 생성자 옵션으로만 전달된다. 바꾸려면 React key 로 다시 만든다.
  const latestAutoRefresh = useLatest(autoRefresh);
  const spec = onMap(
    map,
    () => new navermaps.TrafficLayer(omitUndefined({ interval })),
    (instance, host) => {
      instance.setMap(host);
      applyAutoRefresh(instance, latestAutoRefresh.current);
      if (latestAutoRefresh.current === false)
        holdOff(instance, latestAutoRefresh);
    },
  );
  const layer = useSdkInstance(
    {
      ...spec,
      detach: (instance) => {
        cancelHoldOff(instance);
        spec.detach(instance);
      },
      dispose: (instance) => {
        cancelHoldOff(instance);
        spec.dispose(instance);
      },
    },
    [map],
  );

  // 언마운트하면 다시 끄는 타이머를 멈춘다. SDK 가 죽어 있으면 수명 처리(dispose)가 돌지 않아서 따로 둔다.
  useEffect(() => {
    if (!layer) return;
    return () => cancelHoldOff(layer);
  }, [layer]);

  // prop 이 바뀌면 맞춘다.
  useEffect(() => {
    if (!layer || !sdkAlive()) return;
    cancelHoldOff(layer);
    applyAutoRefresh(layer, autoRefresh);
    if (autoRefresh === false) holdOff(layer, latestAutoRefresh);
  }, [layer, autoRefresh, latestAutoRefresh]);

  useImperativeHandle(ref, () => layer!, [layer]);

  return null;
}
