import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// useNavermaps mock — Suspense 내부에서 동기적으로 mock 반환
const mockNavermaps = { mocked: true };
vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => mockNavermaps,
}));

import { Container } from '../container.js';

describe('Container', () => {
  test('ReactNode children 렌더링', () => {
    render(
      <Container style={{ width: '100%', height: '400px' }}>
        <div data-testid="child">test</div>
      </Container>,
    );

    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByTestId('child').textContent).toBe('test');
  });

  test('render function children 호출', () => {
    render(
      <Container style={{ width: '100%', height: '400px' }}>
        {(navermaps) => <div data-testid="render-fn">{typeof navermaps}</div>}
      </Container>,
    );

    // RenderPropBridge가 useNavermaps()를 호출하고 children에 전달
    expect(screen.getByTestId('render-fn')).toBeDefined();
    expect(screen.getByTestId('render-fn').textContent).toBe('object');
  });
});
