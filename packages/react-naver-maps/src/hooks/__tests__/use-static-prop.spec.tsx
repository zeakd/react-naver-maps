/**
 * useStaticProp 회귀 테스트
 *
 * static prop이 마운트 후 변경되면 dev 환경에서 console.warn으로 경고.
 * production 빌드에선 no-op.
 */
import { render } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStaticProp } from '../use-static-prop.js';

function Probe({ value }: { value: unknown }) {
  useStaticProp('TestComponent', 'foo', value);
  return null;
}

describe('useStaticProp', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('마운트 시점에는 경고하지 않음', () => {
    render(<Probe value={1} />);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('마운트 후 값 변경 시 경고', () => {
    const { rerender } = render(<Probe value={1} />);
    rerender(<Probe value={2} />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("'foo' is a static prop");
    expect(warnSpy.mock.calls[0][0]).toContain('TestComponent');
  });

  test('동일값 rerender는 경고 안 함', () => {
    const { rerender } = render(<Probe value={1} />);
    rerender(<Probe value={1} />);
    rerender(<Probe value={1} />);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('마운트 값으로 다시 돌아오면 경고 없음', () => {
    const { rerender } = render(<Probe value={1} />);
    rerender(<Probe value={2} />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    rerender(<Probe value={1} />);
    // 다시 1로 돌아왔으므로 추가 경고 없음 (initialRef와 동일)
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test('NaN/undefined 등 에지 케이스도 Object.is로 비교', () => {
    const { rerender } = render(<Probe value={1} />);
    rerender(<Probe value={1} />);
    expect(warnSpy).not.toHaveBeenCalled();

    rerender(<Probe value={null} />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  describe('undefined grace period', () => {
    test('undefined → 비-undefined: 경고 안 함 (첫 비-undefined가 mount값)', () => {
      const { rerender } = render(<Probe value={undefined} />);
      rerender(<Probe value={true} />);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('undefined → 값1 → 값2: 값2에서만 경고', () => {
      const { rerender } = render(<Probe value={undefined} />);
      rerender(<Probe value={1} />);
      expect(warnSpy).not.toHaveBeenCalled();
      rerender(<Probe value={2} />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    test('undefined → 값 → undefined: undefined도 변경으로 인식', () => {
      const { rerender } = render(<Probe value={undefined} />);
      rerender(<Probe value={1} />);
      // settled at 1
      rerender(<Probe value={undefined} />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    test('undefined로 시작 후 계속 undefined면 경고 없음', () => {
      const { rerender } = render(<Probe value={undefined} />);
      rerender(<Probe value={undefined} />);
      rerender(<Probe value={undefined} />);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('비-undefined로 시작하면 grace period 없이 즉시 settled', () => {
      const { rerender } = render(<Probe value={1} />);
      rerender(<Probe value={undefined} />);
      // 1로 시작했으므로 undefined도 변경
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
