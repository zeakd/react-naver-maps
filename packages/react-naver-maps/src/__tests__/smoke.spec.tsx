import { createRoot } from 'react-dom/client';
import { describe, test, expect, afterEach, beforeAll } from 'vitest';
import { NavermapsProvider, Container, NaverMap } from '../react-naver-maps.js';
import { loadScript } from '../load-script.js';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { Suspense } from 'react';

// Maps 키. Web 서비스 URL 에 http://localhost:4321 이 등록되어 있다(vitest.browser.config.ts 포트).
// VITE_NCP_KEY_ID 로 바꿔 넣을 수 있다 (예: 잘못된 키로 인증 실패 감지 확인).
const NCP_KEY_ID: string =
  (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_NCP_KEY_ID || 'aluya4ff04';

/**
 * 첫 지도를 만들어 인증 결과를 기다린다.
 *
 * 네이버맵 SDK 는 페이지에서 처음 만든 지도로 한 번 인증한다(/v3/auth JSONP). 실패하면
 * 응답 처리 중 전역 navermap_authFailure 를 호출하고 타일 자리에 실패 안내를 그린다.
 * 지도 DOM·스타일 요청은 인증 결과와 무관하게 생기므로 성공 신호로 쓸 수 없다.
 * 콜백은 응답 직후가 아니라 조금 뒤에 오므로, /v3/auth 응답이 도착한 뒤
 * AUTH_GRACE_MS 동안 실패 콜백이 없으면 통과로 본다.
 * 인증 응답 전에 지도를 없애면 콜백이 오지 않으므로 판정이 끝날 때까지 지도를 유지한다.
 */
// 2026-11 실측: 잘못된 키에서 /v3/auth 응답 뒤 약 1.1초에 실패 콜백이 호출됐다.
const AUTH_GRACE_MS = 3000;

function checkAuth(timeout = 10000): Promise<'ok' | 'failed'> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('div');
    el.style.cssText = 'width:300px;height:200px';
    document.body.appendChild(el);
    let settled = false;
    const finish = (result: 'ok' | 'failed') => {
      if (settled) return;
      settled = true;
      try {
        map.destroy();
      } catch {
        // 인증 실패 직후의 지도는 정리 중 에러를 낼 수 있다. 판정에는 영향이 없다.
      }
      el.remove();
      resolve(result);
    };
    (window as unknown as Record<string, unknown>).navermap_authFailure = () =>
      finish('failed');
    const map = new naver.maps.Map(el, {
      center: new naver.maps.LatLng(37.5666, 126.9784),
      zoom: 15,
    });
    const start = Date.now();
    const poll = () => {
      if (settled) return;
      const responded = performance
        .getEntriesByType('resource')
        .some((e) => e.name.includes('oapi.map.naver.com/v3/auth'));
      if (responded) {
        setTimeout(() => finish('ok'), AUTH_GRACE_MS);
        return;
      }
      if (Date.now() - start > timeout) {
        settled = true;
        reject(new Error('Timeout: /v3/auth 응답이 없음'));
        return;
      }
      setTimeout(poll, 50);
    };
    poll();
  });
}

let authResult: 'ok' | 'failed' | undefined;

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
    authResult = await checkAuth();
  });

  afterEach(() => {
    root?.unmount();
    rootContainer?.remove();
  });

  test('인증 통과', () => {
    expect(
      authResult,
      `인증 실패: ${location.origin} 이 키 ${NCP_KEY_ID} 의 Web 서비스 URL 에 등록되어 있는지 확인`,
    ).toBe('ok');
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
