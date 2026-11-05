import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useMapTypeProps } from '../use-map-types.js';

// 지도 유형 레지스트리. bindTo 가 있어 값이 아니라 참조로 비교된다(kvoEquals).
const registry = (...ids: string[]) =>
  ({
    ids,
    bindTo() {},
    getTypeIds: () => ids,
    getSelectedTypeId: () => ids[0],
  }) as unknown as naver.maps.MapTypeRegistry;

/**
 * 판정에 쓰는 SDK 성질만 담은 Map. 실제 SDK(3.10.5)처럼 레지스트리에 없는 ID 를 따로 넣으면 던지고,
 * setValues 는 옵션 저장(getOptions)을 바꾸지 않는다.
 */
function fakeMap(initial: naver.maps.MapTypeRegistry, id: string) {
  const state = { options: initial, actual: initial, id };
  const calls: string[] = [];
  const has = (r: unknown, i: string) =>
    (r as { ids: string[] }).ids.includes(i);
  const map = {
    getOptions: (k: string) => (k === 'mapTypes' ? state.options : undefined),
    setOptions: (k: string, v: naver.maps.MapTypeRegistry) => {
      calls.push('setOptions');
      if (!has(v, state.id))
        throw new Error('SDK: 레지스트리에 지금 ID 가 없다');
      state.options = state.actual = v;
    },
    setValues: (v: {
      mapTypes: naver.maps.MapTypeRegistry;
      mapTypeId: string;
    }) => {
      calls.push(`setValues ${v.mapTypeId}`);
      if (!has(v.mapTypes, v.mapTypeId)) throw new Error('SDK: 없는 ID');
      state.actual = v.mapTypes;
      state.id = v.mapTypeId;
    },
    getMapTypeId: () => state.id,
    setMapTypeId: (i: string) => {
      calls.push(`setMapTypeId ${i}`);
      if (!has(state.actual, i)) throw new Error('SDK: 없는 ID');
      state.id = i;
    },
  };
  return { map: map as unknown as naver.maps.Map, state, calls };
}

beforeEach(() => vi.stubGlobal('naver', { maps: {} }));
afterEach(() => vi.unstubAllGlobals());

describe('useMapTypeProps', () => {
  test('마운트 때는 생성자가 넣었으므로 부르지 않는다', () => {
    const A = registry('normal');
    const { map, calls } = fakeMap(A, 'normal');
    renderHook(() => useMapTypeProps(map, A, 'normal'));
    expect(calls).toEqual([]);
  });

  test('새 레지스트리와 거기에만 있는 ID 는 한 번에 넣고 옵션도 맞춘다', () => {
    const A = registry('normal');
    const B = registry('custom');
    const { map, state, calls } = fakeMap(A, 'normal');
    const { rerender } = renderHook(
      ({ types, id }) => useMapTypeProps(map, types, id),
      { initialProps: { types: A, id: 'normal' } },
    );
    rerender({ types: B, id: 'custom' });
    expect(calls).toEqual(['setValues custom', 'setOptions']);
    expect(state).toMatchObject({ options: B, actual: B, id: 'custom' });
  });

  test('바깥에서 레지스트리를 바꾸면 다음 렌더에 prop 으로 되돌린다', () => {
    const A = registry('normal');
    const { map, state, calls } = fakeMap(A, 'normal');
    const { rerender } = renderHook(() => useMapTypeProps(map, A, 'normal'));
    map.setOptions('mapTypes', registry('normal', 'other'));
    calls.length = 0;
    rerender();
    expect(state.options).toBe(A);
    expect(calls).toEqual(['setValues normal', 'setOptions']);
  });

  test('ID 만 바뀌면(또는 바깥에서 바뀌면) setMapTypeId 로 맞춘다', () => {
    const A = registry('normal', 'satellite');
    const { map, state, calls } = fakeMap(A, 'normal');
    const { rerender } = renderHook(({ id }) => useMapTypeProps(map, A, id), {
      initialProps: { id: 'normal' },
    });
    rerender({ id: 'satellite' });
    expect(calls).toEqual(['setMapTypeId satellite']);
    state.id = 'normal';
    rerender({ id: 'satellite' });
    expect(state.id).toBe('satellite');
  });

  test('ID prop 이 없고 지금 ID 가 새 레지스트리에 없으면 레지스트리가 고른 유형으로 간다', () => {
    const A = registry('normal');
    const B = registry('custom');
    const { map, state } = fakeMap(A, 'normal');
    const { rerender } = renderHook(
      ({ types }) => useMapTypeProps(map, types, undefined),
      { initialProps: { types: A } },
    );
    rerender({ types: B });
    expect(state.id).toBe('custom');
  });
});
