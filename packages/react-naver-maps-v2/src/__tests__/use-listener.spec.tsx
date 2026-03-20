import { renderHook } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { useListener } from '../hooks/use-listener.js';
import { createMockNaverMaps, MockKVO } from './test-utils.js';

let mock: ReturnType<typeof createMockNaverMaps>;

describe('useListener', () => {
  beforeEach(() => {
    mock = createMockNaverMaps();
  });

  afterEach(() => {
    mock.cleanup();
  });

  test('target + eventName으로 addListener 호출', () => {
    const target = new MockKVO();
    const listener = vi.fn();

    renderHook(() => useListener(target as any, 'click', listener));

    target._trigger('click', { x: 1 });
    expect(listener).toHaveBeenCalledWith({ x: 1 });
  });

  test('콜백 변경 시 재구독 없이 최신 콜백 호출', () => {
    const target = new MockKVO();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    const { rerender } = renderHook(
      ({ listener }) => useListener(target as any, 'click', listener),
      { initialProps: { listener: listener1 } },
    );

    // 콜백 변경
    rerender({ listener: listener2 });

    // 이벤트 발화 → 최신 콜백(listener2) 호출
    target._trigger('click', { x: 2 });
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledWith({ x: 2 });
  });

  test('target null이면 구독 안 함', () => {
    const listener = vi.fn();

    renderHook(() => useListener(null, 'click', listener));

    // addListener 호출되지 않아야 함
    expect(listener).not.toHaveBeenCalled();
  });

  test('listener undefined이면 구독 안 함', () => {
    const target = new MockKVO();

    renderHook(() => useListener(target as any, 'click', undefined));

    target._trigger('click');
    // 에러 없이 정상 동작
  });

  test('unmount 시 removeListener 호출', () => {
    const target = new MockKVO();
    const listener = vi.fn();

    const { unmount } = renderHook(() =>
      useListener(target as any, 'click', listener),
    );

    unmount();

    // 리스너 제거 후 이벤트 발화해도 호출 안 됨
    target._trigger('click');
    expect(listener).not.toHaveBeenCalled();
  });

  test('eventName 변경 시 이전 해제 + 새 구독', () => {
    const target = new MockKVO();
    const listener = vi.fn();

    const { rerender } = renderHook(
      ({ eventName }) => useListener(target as any, eventName, listener),
      { initialProps: { eventName: 'click' } },
    );

    // eventName 변경
    rerender({ eventName: 'dblclick' });

    // 이전 이벤트는 리스닝 안 함
    target._trigger('click');
    expect(listener).not.toHaveBeenCalled();

    // 새 이벤트 리스닝
    target._trigger('dblclick', { x: 3 });
    expect(listener).toHaveBeenCalledWith({ x: 3 });
  });
});
