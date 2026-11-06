import { describe, test, expect, vi } from 'vitest';
import { geocode, reverseGeocode, GeocoderError } from '../index.js';

class LatLng {
  constructor(
    public y: number,
    public x: number,
  ) {}
}

function maps(status: number, response: unknown) {
  return {
    LatLng,
    Point: class {
      constructor(
        public x = 0,
        public y = 0,
      ) {}
    },
    Service: {
      Status: { OK: 200, ERROR: 500 },
      geocode: vi.fn((_o, cb) => cb(status, response)),
      reverseGeocode: vi.fn((_o, cb) => cb(status, response)),
    },
  } as unknown as typeof naver.maps;
}

describe('geocoder', () => {
  test('OK 면 v2 를 돌려준다', async () => {
    const v2 = { addresses: [{ roadAddress: '불정로 6' }] };
    await expect(
      geocode(maps(200, { v2 }), { query: '불정로 6' }),
    ).resolves.toBe(v2);
    await expect(
      reverseGeocode(maps(200, { v2 }), { coords: { lat: 37, lng: 127 } }),
    ).resolves.toBe(v2);
  });

  test('reverseGeocode 의 리터럴 coords 는 LatLng 로 바꿔 넘긴다', async () => {
    const m = maps(200, { v2: {} });
    await reverseGeocode(m, { coords: { lat: 37.5, lng: 127 } });
    const passed = (m.Service.reverseGeocode as any).mock.calls[0][0].coords;
    expect(passed).toBeInstanceOf(LatLng);
    expect([passed.y, passed.x]).toEqual([37.5, 127]);
  });

  test('reverseGeocode 의 { x, y } coords 는 Point 로 바꿔 넘긴다', async () => {
    const m = maps(200, { v2: {} });
    await reverseGeocode(m, { coords: { x: 127, y: 37.5 } });
    const passed = (m.Service.reverseGeocode as any).mock.calls[0][0].coords;
    expect(passed).toBeInstanceOf(m.Point);
    expect([passed.x, passed.y]).toEqual([127, 37.5]);
  });

  test('OK 가 아니면 상태와 응답을 담아 reject 한다', async () => {
    const error = await geocode(maps(500, { v2: {} }), { query: 'x' }).catch(
      (e) => e,
    );
    expect(error).toBeInstanceOf(GeocoderError);
    expect(error.status).toBe(500);
  });

  test('서브모듈이 없으면 불러오는 법을 알려 준다', () => {
    expect(() => geocode({} as typeof naver.maps, { query: 'x' })).toThrow(
      /submodules=\{\['geocoder'\]\}/,
    );
  });
});
