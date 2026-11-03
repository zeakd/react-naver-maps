import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GeoJson } from '../geo-json.js';

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
});
