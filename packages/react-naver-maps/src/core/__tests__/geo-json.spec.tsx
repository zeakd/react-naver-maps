import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GeoJson } from '../geo-json.js';
import { Kml } from '../kml.js';
import { Gpx } from '../gpx.js';

type Listener = { event: string; cb: (e: unknown) => void };

class MockFeature {
  style: unknown = null;
  constructor(public raw: { properties: { id: string } }) {}
  getProperty(k: string) {
    return (this.raw.properties as Record<string, string>)[k];
  }
  setStyle(s: unknown) {
    this.style = s;
  }
}

class MockData {
  features: MockFeature[] = [];
  styleFn: ((f: MockFeature) => unknown) | null = null;
  listeners: Listener[] = [];
  setStyleCalls = 0;
  addKml(doc: { id: string }) {
    return this.addDoc(doc);
  }
  addGpx(doc: { id: string }) {
    return this.addDoc(doc);
  }
  addDoc(doc: { id: string }) {
    const added = [new MockFeature({ properties: { id: doc.id } })];
    added.forEach((f) => this.addFeature(f));
    return added;
  }
  addGeoJson(geojson: { features: { properties: { id: string } }[] }) {
    const added = geojson.features.map((f) => new MockFeature(f));
    added.forEach((f) => this.addFeature(f));
    return added;
  }
  addFeature(f: MockFeature) {
    this.features.push(f);
    if (this.styleFn) {
      const s = this.styleFn(f);
      if (s) f.setStyle(s);
    }
  }
  removeFeature(f: MockFeature) {
    this.features = this.features.filter((x) => x !== f);
  }
  setStyle(fn: (f: MockFeature) => unknown) {
    this.setStyleCalls++;
    this.styleFn = fn;
    for (const f of this.features) {
      const s = fn(f);
      if (s) f.setStyle(s);
    }
  }
  fire(event: string, feature: MockFeature) {
    for (const l of this.listeners) if (l.event === event) l.cb({ feature });
  }
}

let data: MockData;

vi.mock('../hooks/use-map.js', () => ({ useMap: () => ({ data }) }));

const fc = (id: string) => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: { id }, geometry: null }],
});

describe('GeoJson', () => {
  beforeEach(() => {
    data = new MockData();
    (globalThis as any).naver = {
      maps: {
        Event: {
          addListener: (
            _t: unknown,
            event: string,
            cb: (e: unknown) => void,
          ) => {
            const l = { event, cb };
            data.listeners.push(l);
            return l;
          },
          removeListener: (l: Listener) => {
            data.listeners = data.listeners.filter((x) => x !== l);
          },
          clearInstanceListeners: vi.fn(),
        },
      },
    };
  });

  test('둘을 올리면 각자 자기 style 로 칠하고 자기 feature 의 클릭만 받는다', () => {
    const onA = vi.fn();
    const onB = vi.fn();
    render(
      <>
        <GeoJson
          data={fc('a') as any}
          style={{ fillColor: 'red' }}
          onClick={onA}
        />
        <GeoJson
          data={fc('b') as any}
          style={(f) => ({ fillColor: f.getProperty('id') })}
          onClick={onB}
        />
      </>,
    );
    const [a, b] = data.features;
    expect(a!.style).toEqual({ fillColor: 'red' });
    expect(b!.style).toEqual({ fillColor: 'b' });
    data.fire('click', a!);
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).not.toHaveBeenCalled();
  });

  test('style 이 없으면 feature 스타일을 건드리지 않는다', () => {
    render(
      <>
        <GeoJson data={fc('a') as any} />
        <GeoJson data={fc('b') as any} style={{ fillColor: 'blue' }} />
      </>,
    );
    const [a, b] = data.features;
    expect(a!.style).toBe(null);
    expect(b!.style).toEqual({ fillColor: 'blue' });
  });

  test('같은 값의 새 data 로는 다시 올리지 않고 언마운트하면 뺀다', () => {
    const { rerender, unmount } = render(<GeoJson data={fc('a') as any} />);
    const first = data.features[0];
    rerender(<GeoJson data={fc('a') as any} />);
    expect(data.features).toEqual([first]);
    unmount();
    expect(data.features).toEqual([]);
  });

  test('onPropertyChanged 는 자기 feature 의 것만 받는다', () => {
    const onA = vi.fn();
    const onB = vi.fn();
    render(
      <>
        <GeoJson data={fc('a') as any} onPropertyChanged={onA} />
        <GeoJson data={fc('b') as any} onPropertyChanged={onB} />
      </>,
    );
    const [a] = data.features;
    data.fire('property_changed', a!);
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onA.mock.calls[0]![0].feature).toBe(a);
    expect(onB).not.toHaveBeenCalled();
  });

  test('style 함수 참조가 렌더마다 바뀌면 렌더마다 전체를 다시 스타일하고, 같으면 하지 않는다', () => {
    const stable = () => ({ fillColor: 'red' });
    const { rerender } = render(
      <GeoJson data={fc('a') as any} style={stable} />,
    );
    const afterMount = data.setStyleCalls;
    rerender(<GeoJson data={fc('a') as any} style={stable} />);
    expect(data.setStyleCalls).toBe(afterMount);
    rerender(<GeoJson data={fc('a') as any} style={() => ({})} />);
    rerender(<GeoJson data={fc('a') as any} style={() => ({})} />);
    expect(data.setStyleCalls).toBe(afterMount + 2);
  });
});

const doc = (id: string) => ({ id }) as unknown as Document;

describe.each([
  ['Kml', Kml],
  ['Gpx', Gpx],
] as const)('%s', (_name, Component) => {
  beforeEach(() => {
    data = new MockData();
    (globalThis as any).naver = {
      maps: {
        Event: {
          addListener: (
            _t: unknown,
            event: string,
            cb: (e: unknown) => void,
          ) => {
            const l = { event, cb };
            data.listeners.push(l);
            return l;
          },
          removeListener: (l: Listener) => {
            data.listeners = data.listeners.filter((x) => x !== l);
          },
          clearInstanceListeners: vi.fn(),
        },
      },
    };
  });

  test('문서를 올리고 style·이벤트는 자기 feature 에만 적용한다', () => {
    const onClick = vi.fn();
    const onOther = vi.fn();
    render(
      <>
        <Component
          data={doc('a')}
          style={(f) => ({ fillColor: f.getProperty('id') })}
          onClick={onClick}
        />
        <GeoJson data={fc('b') as any} onClick={onOther} />
      </>,
    );
    const [a, b] = data.features;
    expect(a!.style).toEqual({ fillColor: 'a' });
    expect(b!.style).toBe(null);
    data.fire('click', a!);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOther).not.toHaveBeenCalled();
  });

  test('ref 로 올린 feature 를 준다', () => {
    const ref = { current: null as unknown };
    render(<Component data={doc('a')} ref={ref as any} />);
    expect(ref.current).toEqual(data.features);
  });

  test('같은 문서면 다시 올리지 않고 다른 문서면 바꿔 올리며 언마운트하면 뺀다', () => {
    const first = doc('a');
    const { rerender, unmount } = render(<Component data={first} />);
    const [f1] = data.features;
    rerender(<Component data={first} />);
    expect(data.features).toEqual([f1]);
    rerender(<Component data={doc('b')} />);
    expect(data.features).toHaveLength(1);
    expect(data.features[0]).not.toBe(f1);
    expect(data.features[0]!.getProperty('id')).toBe('b');
    unmount();
    expect(data.features).toEqual([]);
  });

  test('onPropertyChanged', () => {
    const on = vi.fn();
    render(<Component data={doc('a')} onPropertyChanged={on} />);
    data.fire('property_changed', data.features[0]!);
    expect(on).toHaveBeenCalledTimes(1);
  });
});
