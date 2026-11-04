/**
 * 단위 테스트의 가짜(`sdk-fake.ts`)가 기대는 SDK 성질. 같은 검사를 가짜와 실제 SDK 에서 돌려 둘이
 * 같게 동작하는지 본다.
 *
 * - 가짜: `sdk-contract.spec.ts`(vitest)
 * - 실제 SDK: `e2e/scenarios/sdk-contract.spec.ts`(Playwright, 시나리오 페이지에서)
 *
 * 라이브러리와 테스트가 실제로 기대는 성질만 담는다. SDK 를 다시 구현하려는 것이 아니다. 가짜에 새
 * 성질을 더하면 여기에도 더해 실제 SDK 에서 맞는지 확인한다.
 */
import { FAKE_CLASSES } from './sdk-fake.js';

type Maps = typeof naver.maps;
type Kvo = {
  get(k: string): unknown;
  set(k: string, v: unknown): void;
  setOptions(o: Record<string, unknown>): void;
  setMap(m: unknown): void;
  getMap(): unknown;
} & Record<string, unknown>;

export type ContractResult = { name: string; error: string | null };

/** 검사 이름과 위반 설명(없으면 null). `mapElement` 는 지도를 띄울 빈 element 다. */
export function sdkContract(
  maps: Maps,
  mapElement: HTMLElement,
): ContractResult[] {
  const results: ContractResult[] = [];
  const check = (name: string, fn: () => string | null) => {
    try {
      results.push({ name, error: fn() });
    } catch (e) {
      results.push({ name, error: `던짐: ${(e as Error).message}` });
    }
  };
  const map = new maps.Map(mapElement, {
    center: new maps.LatLng(37.5, 127),
    zoom: 10,
  });
  const marker = () =>
    new maps.Marker({
      position: new maps.LatLng(37.5, 127),
    }) as unknown as Kvo;

  check('set 은 값을 저장하고 `${key}_changed` 를 낸다', () => {
    const m = marker();
    let fired = 0;
    maps.Event.addListener(m, 'title_changed', () => fired++);
    m.set('title', 'a');
    if (m.get('title') !== 'a') return `get 이 ${String(m.get('title'))}`;
    return fired === 1 ? null : `title_changed ${fired}번`;
  });

  check('이름 있는 setter 는 set 을 거친다(값과 _changed 이벤트)', () => {
    const m = marker();
    let fired = 0;
    maps.Event.addListener(m, 'zIndex_changed', () => fired++);
    (m.setZIndex as (v: number) => void)(7);
    if (m.get('zIndex') !== 7)
      return `get('zIndex') 가 ${String(m.get('zIndex'))}`;
    if ((m.getZIndex as () => number)() !== 7) return 'getZIndex 가 다르다';
    return fired === 1 ? null : `zIndex_changed ${fired}번`;
  });

  check('setOptions(객체) 는 키마다 set 한다', () => {
    const m = marker();
    let fired = 0;
    maps.Event.addListener(m, 'title_changed', () => fired++);
    m.setOptions({ title: 'b' });
    if (m.get('title') !== 'b') return `get 이 ${String(m.get('title'))}`;
    return fired === 1 ? null : `title_changed ${fired}번`;
  });

  check('trigger 는 인자를 리스너에 넘긴다', () => {
    const m = marker();
    const got: unknown[] = [];
    maps.Event.addListener(m, 'click', (...a: unknown[]) => got.push(...a));
    (maps.Event.trigger as (...a: unknown[]) => void)(m, 'click', 'e1', 'e2');
    return got.join(',') === 'e1,e2'
      ? null
      : `받은 인자 ${JSON.stringify(got)}`;
  });

  check('removeListener 뒤에는 불리지 않는다', () => {
    const m = marker();
    let n = 0;
    const h = maps.Event.addListener(m, 'click', () => n++);
    maps.Event.removeListener(h);
    maps.Event.trigger(m, 'click');
    return n === 0 ? null : `${n}번 불렸다`;
  });

  check('clearInstanceListeners 뒤에는 불리지 않는다', () => {
    const m = marker();
    let n = 0;
    maps.Event.addListener(m, 'click', () => n++);
    maps.Event.clearInstanceListeners(m);
    maps.Event.trigger(m, 'click');
    return n === 0 ? null : `${n}번 불렸다`;
  });

  check('LatLng 는 lat()·lng() 메서드와 x(경도)·y(위도)를 가진다', () => {
    const p = new maps.LatLng(37.5, 127) as unknown as {
      lat: unknown;
      lng: unknown;
      x: number;
      y: number;
    };
    if (typeof p.lat !== 'function' || typeof p.lng !== 'function') {
      return 'lat·lng 가 메서드가 아니다';
    }
    if (
      (p.lat as () => number)() !== 37.5 ||
      (p.lng as () => number)() !== 127
    ) {
      return 'lat()·lng() 값이 다르다';
    }
    return p.x === 127 && p.y === 37.5 ? null : `x ${p.x}, y ${p.y}`;
  });

  check('LatLng.equals 는 같은 값의 LatLng 와 리터럴을 같다고 본다', () => {
    const p = new maps.LatLng(37.5, 127);
    if (!p.equals(new maps.LatLng(37.5, 127))) return 'LatLng 끼리 다르다';
    if (p.equals(new maps.LatLng(37.5, 127.1)))
      return '다른 LatLng 를 같다고 본다';
    const literal = { lat: 37.5, lng: 127 } as unknown as naver.maps.LatLng;
    return p.equals(literal) ? null : '리터럴을 다르다고 본다';
  });

  check('Point 는 x·y 와 equals 를 가진다', () => {
    const p = new maps.Point(1, 2);
    if (p.x !== 1 || p.y !== 2) return `x ${p.x}, y ${p.y}`;
    return p.equals(new maps.Point(1, 2)) ? null : 'equals 가 다르다';
  });

  check('KVO 객체는 bindTo 를 가지고 값 객체는 없다', () => {
    if (typeof (marker() as { bindTo?: unknown }).bindTo !== 'function') {
      return 'Marker 에 bindTo 가 없다';
    }
    const p = new maps.LatLng(37.5, 127) as unknown as { bindTo?: unknown };
    return p.bindTo === undefined ? null : 'LatLng 에 bindTo 가 있다';
  });

  check('오버레이는 setMap 한 지도를 getMap 으로 돌려준다', () => {
    const m = marker();
    m.setMap(map);
    if (m.getMap() !== map) return 'getMap 이 다르다';
    m.setMap(null);
    return m.getMap() === null
      ? null
      : `떼고 나서 getMap 이 ${String(m.getMap())}`;
  });

  check(
    "InfoWindow 는 open 이 지도에 붙이고 'open', close 가 떼고 'close' 를 낸다",
    () => {
      const w = new maps.InfoWindow({
        content: 'x',
        position: new maps.LatLng(37.5, 127),
      }) as unknown as Kvo & { open(map: unknown): void; close(): void };
      const events: string[] = [];
      maps.Event.addListener(w, 'open', () => events.push('open'));
      maps.Event.addListener(w, 'close', () => events.push('close'));
      w.open(map);
      if (w.getMap() !== map) return 'open 뒤 getMap 이 지도가 아니다';
      w.close();
      if (w.getMap()) return 'close 뒤에도 지도에 있다';
      return events.join(',') === 'open,close'
        ? null
        : `이벤트 ${events.join(',')}`;
    },
  );

  check('InfoWindow 는 position 도 anchor 도 없으면 open 에서 던진다', () => {
    const w = new maps.InfoWindow({ content: 'x' });
    try {
      w.open(map);
    } catch {
      return null;
    }
    return '던지지 않았다';
  });

  check('가짜 클래스의 setter·getter·메서드는 실제 클래스에도 있다', () => {
    const missing: string[] = [];
    for (const [name, fake] of Object.entries(FAKE_CLASSES)) {
      const real = (maps as unknown as Record<string, { prototype: object }>)[
        name
      ];
      if (!real) {
        missing.push(`${name}(클래스)`);
        continue;
      }
      const proto = real.prototype as Record<string, unknown>;
      const methods = [
        ...fake.accessors.flatMap((key) => {
          const cap = key.charAt(0).toUpperCase() + key.slice(1);
          return [`set${cap}`, `get${cap}`];
        }),
        ...fake.methods,
      ];
      for (const method of methods) {
        if (typeof proto[method] !== 'function')
          missing.push(`${name}.${method}`);
      }
    }
    return missing.length === 0 ? null : `없다: ${missing.join(', ')}`;
  });

  map.destroy();
  return results;
}
