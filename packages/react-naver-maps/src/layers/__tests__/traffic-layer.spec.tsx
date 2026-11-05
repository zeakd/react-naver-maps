import { act, cleanup, render } from '@testing-library/react';
import { Suspense, use } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  FakeTrafficLayer,
  installSdkFake,
  type SdkFake,
} from '../../__tests__/sdk-fake.js';

vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));
const mockMap = { id: 'mock-map' };
vi.mock('../../hooks/use-map.js', () => ({
  useMap: () => mockMap,
}));

import { TrafficLayer } from '../traffic-layer.js';

let mock: SdkFake;
/** 레이어에 부른 SDK 메서드 순서. setMap 은 붙였는지(map)·뗐는지(null)로 적는다. */
let calls: string[];

beforeEach(() => {
  mock = installSdkFake();
  calls = [];
  const proto = FakeTrafficLayer.prototype;
  vi.spyOn(proto, 'startAutoRefresh').mockImplementation(() => {
    calls.push('start');
  });
  vi.spyOn(proto, 'endAutoRefresh').mockImplementation(() => {
    calls.push('end');
  });
  const setMap = proto.setMap;
  vi.spyOn(proto, 'setMap').mockImplementation(function (
    this: FakeTrafficLayer,
    m: unknown,
  ) {
    calls.push(m ? 'attach' : 'detach');
    setMap.call(this, m);
  });
});
afterEach(() => {
  // 앞 검사의 레이어가 남으면 그 재시도 타이머가 다음 검사에 끼어든다.
  cleanup();
  vi.restoreAllMocks();
  mock.uninstall();
});

const layer = () => mock.last('TrafficLayer')!.instance;

describe('TrafficLayer', () => {
  test('마운트하면 만들어 지도에 붙인다', () => {
    render(<TrafficLayer />);
    expect(layer().getMap()).toBe(mockMap);
  });

  test('interval 은 생성자에 넘긴다', () => {
    render(<TrafficLayer interval={5000} />);
    expect(mock.last('TrafficLayer')!.options).toMatchObject({
      interval: 5000,
    });
  });

  test('autoRefresh 를 붙인 뒤 맞추고, 바뀌면 다시 맞춘다', () => {
    const { rerender } = render(<TrafficLayer autoRefresh />);
    expect(calls.slice(calls.lastIndexOf('attach'))).toEqual([
      'attach',
      'start',
      'start',
    ]);
    calls.length = 0;
    rerender(<TrafficLayer autoRefresh={false} />);
    expect(calls).toEqual(['end']);
  });

  // SDK 는 지도에 붙일 때 자동 갱신을 다시 켠다. transition 밖에서 형제가 suspend 하면 React 는 이 트리를
  // 숨겼다(layout cleanup) 다시 보이며 layout effect 만 다시 돌린다. 그때 붙이면서 autoRefresh 를 맞춰야 한다.
  test('Suspense 로 숨겼다 다시 보이면 다시 붙인 뒤 autoRefresh 를 prop 으로 맞춘다', async () => {
    let wake!: () => void;
    const pending = new Promise<void>((r) => (wake = r));
    let suspend = false;
    function Gate() {
      if (suspend) use(pending);
      return null;
    }
    const tree = () => (
      <Suspense fallback={null}>
        <TrafficLayer autoRefresh={false} />
        <Gate />
      </Suspense>
    );
    const { rerender } = render(tree());
    suspend = true;
    await act(async () => {
      rerender(tree());
    });
    expect(layer().getMap()).toBeNull();
    calls.length = 0;
    await act(async () => {
      suspend = false;
      wake();
      await pending;
      // React 는 다시 보이는 것을 잠시(약 300ms) 모아서 한다.
      await new Promise((r) => setTimeout(r, 600));
    });
    expect(layer().getMap()).toBe(mockMap);
    // 첫 재시도(100ms)까지 기다린다.
    await new Promise((r) => setTimeout(r, 200));
    // 붙이며 끄고, SDK 가 늦게 다시 켜는 것을 막으려고 잠시 뒤 또 끈다(traffic-layer.tsx HOLD_OFF_MS).
    expect(calls.slice(0, 2)).toEqual(['attach', 'end']);
    expect(calls.slice(2).every((c) => c === 'end')).toBe(true);
    expect(calls.length).toBeGreaterThan(2);
  });

  // 인증 실패로 SDK 가 죽으면(naver.maps = null) 수명 처리가 떼기·버리기를 건너뛴다. 그래도 다시 끄는
  // 타이머는 남지 않아야 한다(2026-11-05 반영 확인 리뷰).
  test('SDK 가 죽은 뒤 언마운트해도 다시 끄는 타이머가 남지 않는다', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(<TrafficLayer autoRefresh={false} />);
      (globalThis as Record<string, any>).naver.maps = null;
      unmount();
      calls.length = 0;
      vi.advanceTimersByTime(20000);
      expect(calls).toEqual([]);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  test('언마운트하면 지도에서 뗀다', () => {
    const { unmount } = render(<TrafficLayer autoRefresh />);
    const instance = layer();
    unmount();
    expect(instance.getMap()).toBeNull();
  });

  test('autoRefresh 를 주지 않으면 SDK 기본값에 맡기고 부르지 않는다', () => {
    const { rerender } = render(<TrafficLayer />);
    rerender(<TrafficLayer />);
    expect(calls.filter((c) => c === 'start' || c === 'end')).toEqual([]);
  });
});
