import { createRoot } from 'react-dom/client';
import { describe, test, expect, afterEach, beforeAll } from 'vitest';
import { NavermapsProvider, Container, NaverMap } from '../react-naver-maps.js';
import { loadScript } from '../load-script.js';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { Suspense } from 'react';

const NCP_KEY_ID = 'aluya4ff04';

function waitForDom(
  root: HTMLElement,
  predicate: (el: HTMLElement) => boolean,
  timeout = 10000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (predicate(root)) return resolve();
      if (Date.now() - start > timeout) {
        return reject(
          new Error(
            `Timeout: predicate not satisfied in ${timeout}ms. HTML: ${root.innerHTML.slice(0, 500)}`,
          ),
        );
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

describe('smoke', () => {
  let rootContainer: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeAll(async () => {
    await loadScript({ ncpKeyId: NCP_KEY_ID });
  });

  afterEach(() => {
    root?.unmount();
    rootContainer?.remove();
  });

  test('스크립트 로드 확인', () => {
    expect(naver.maps).toBeDefined();
    expect(naver.maps.Map).toBeDefined();
  });

  test('useNavermaps Suspense 해소', async () => {
    function TestChild() {
      const maps = useNavermaps();
      return <div data-testid="resolved">{maps ? 'ok' : 'fail'}</div>;
    }

    rootContainer = document.createElement('div');
    document.body.appendChild(rootContainer);
    root = createRoot(rootContainer);

    root.render(
      <NavermapsProvider ncpKeyId={NCP_KEY_ID}>
        <Suspense fallback={<div data-testid="fallback">loading</div>}>
          <TestChild />
        </Suspense>
      </NavermapsProvider>,
    );

    await waitForDom(
      rootContainer,
      (el) => el.querySelector('[data-testid="resolved"]') !== null,
      5000,
    );
    expect(
      rootContainer.querySelector('[data-testid="resolved"]')?.textContent,
    ).toBe('ok');
  }, 10000);

  test('NaverMap 렌더', async () => {
    rootContainer = document.createElement('div');
    document.body.appendChild(rootContainer);
    root = createRoot(rootContainer);

    root.render(
      <NavermapsProvider ncpKeyId={NCP_KEY_ID}>
        <Container style={{ width: '600px', height: '400px' }}>
          <NaverMap
            defaultCenter={{ lat: 37.5666, lng: 126.9784 }}
            defaultZoom={16}
          />
        </Container>
      </NavermapsProvider>,
    );

    // naver map이 container div 내에 자식 요소를 생성하는지 확인
    await waitForDom(
      rootContainer,
      (el) => {
        const mapContainer = el.querySelector('div[style*="100%"] > *');
        return mapContainer !== null;
      },
      10000,
    );
  }, 15000);
});
