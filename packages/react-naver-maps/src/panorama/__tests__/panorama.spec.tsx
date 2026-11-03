import { render } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { Panorama } from '../index.js';

let navermaps: Record<string, unknown> = {};
vi.mock('../../core/hooks/use-navermaps.js', () => ({
  useNavermaps: () => navermaps,
}));

describe('Panorama', () => {
  test('서브모듈이 없으면 불러오는 법을 담아 던진다', () => {
    navermaps = {};
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Panorama />)).toThrow(/submodules=\{\['panorama'\]\}/);
  });

  test('Container 밖에서 쓰면 알린다', () => {
    navermaps = { Panorama: class {} };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Panorama />)).toThrow(/within <Container>/);
  });
});
