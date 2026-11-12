import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { LoadOptions } from '../load-script.js';
import {
  buildUrl,
  getKeyId,
  loadScript,
  subscribeAuthFailure,
  waitForExistingSdk,
  waitForJsContentLoaded,
} from '../load-script.js';

describe('getKeyId', () => {
  test('ncpKeyId 를 반환', () => {
    expect(getKeyId({ ncpKeyId: 'test-key' })).toBe('test-key');
  });

  test.each(['ncpClientId', 'govClientId', 'finClientId'])(
    '제거된 %s 만 전달하면 제거 안내 에러',
    (name) => {
      // JS 사용자나 타입을 우회한 호출이 0.2 방식으로 키를 넘기는 경우
      const options = { [name]: 'legacy-key' } as unknown as LoadOptions;
      expect(() => getKeyId(options)).toThrow(`${name} 는 0.3.0 에서 제거`);
    },
  );

  test('키 없으면 에러', () => {
    expect(() => getKeyId({} as LoadOptions)).toThrow('ncpKeyId 가 필요합니다');
  });
});

describe('buildUrl', () => {
  test('submodules 전달 시 raw `,` 가 URL 에 보존됨 (URL-encoded `%2C` 아님)', () => {
    const url = buildUrl({
      ncpKeyId: 'test-key',
      submodules: ['geocoder', 'drawing'],
    });
    expect(url).toContain('submodules=geocoder,drawing');
    expect(url).not.toContain('%2C');
  });

  test('submodules 미전달 시 submodules 쿼리 자체가 추가되지 않음', () => {
    const url = buildUrl({ ncpKeyId: 'test-key' });
    expect(url).not.toContain('submodules');
  });

  test('인증 키 파라미터는 URLSearchParams 통과 (특수문자 안전)', () => {
    const url = buildUrl({ ncpKeyId: 'a b+c' });
    expect(url).toContain('ncpKeyId=a+b%2Bc');
  });
});

describe('language', () => {
  test('language 를 주면 URL 에 붙는다', () => {
    expect(buildUrl({ ncpKeyId: 'k', language: 'en' })).toContain(
      '&language=en',
    );
    expect(buildUrl({ ncpKeyId: 'k' })).not.toContain('language');
  });

  test('언어가 다르면 다른 로드로 본다(캐시 키)', () => {
    const a = loadScript({ ncpKeyId: 'lang-k', language: 'en' });
    const b = loadScript({ ncpKeyId: 'lang-k', language: 'ja' });
    expect(a).not.toBe(b);
    // 테스트 환경은 스크립트를 실제로 불러오지 않는다.
    a.catch(() => {});
    b.catch(() => {});
    document.head
      .querySelectorAll('script[src*="lang-k"]')
      .forEach((el) => el.remove());
  });
});

describe('subscribeAuthFailure', () => {
  test('SDK 가 전역 navermap_authFailure 를 부르면 구독자와 페이지가 먼저 둔 함수를 모두 부른다', () => {
    const w = window as unknown as { navermap_authFailure?: () => void };
    // 이 파일 안에서 훅이 이미 설치되었을 수 있어 감싼 함수를 직접 부른다.
    const handler = vi.fn();
    const off = subscribeAuthFailure(handler);
    w.navermap_authFailure!();
    expect(handler).toHaveBeenCalledTimes(1);
    off();
    w.navermap_authFailure!();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('이미 실패한 뒤 구독하면 곧바로 한 번 부른다', () => {
    const late = vi.fn();
    const off = subscribeAuthFailure(late);
    expect(late).toHaveBeenCalledTimes(1);
    off();
  });
});

describe('waitForJsContentLoaded', () => {
  test('jsContentLoaded=true 이면 즉시 resolve', async () => {
    const maps = { jsContentLoaded: true } as unknown as typeof naver.maps;
    await expect(waitForJsContentLoaded(maps)).resolves.toBe(maps);
  });

  test('jsContentLoaded=false 면 onJSContentLoaded 콜백 발화까지 대기', async () => {
    const maps = {
      jsContentLoaded: false,
      onJSContentLoaded: undefined as undefined | (() => void),
    } as unknown as typeof naver.maps & {
      onJSContentLoaded: undefined | (() => void);
    };

    const promise = waitForJsContentLoaded(maps);

    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    // 콜백 발화 전: promise 가 아직 pending 이어야 함
    await Promise.resolve();
    expect(resolved).toBe(false);

    // 콜백 발화
    maps.onJSContentLoaded?.();
    await expect(promise).resolves.toBe(maps);
  });

  test('기존 onJSContentLoaded 핸들러가 있으면 chain 보호 (prev 호출 후 resolve)', async () => {
    let prevCalled = false;
    const maps = {
      jsContentLoaded: false,
      onJSContentLoaded: () => {
        prevCalled = true;
      },
    } as unknown as typeof naver.maps;

    const promise = waitForJsContentLoaded(maps);

    // waitForJsContentLoaded 가 새로 등록한 콜백 발화
    (maps as any).onJSContentLoaded();
    await promise;

    expect(prevCalled).toBe(true);
  });

  test('기존 onJSContentLoaded 핸들러가 throw 해도 waitForJsContentLoaded 의 Promise resolve 는 진행됨', async () => {
    const maps = {
      jsContentLoaded: false,
      onJSContentLoaded: () => {
        throw new Error('prev throws');
      },
    } as unknown as typeof naver.maps;

    const promise = waitForJsContentLoaded(maps);
    (maps as any).onJSContentLoaded();
    await expect(promise).resolves.toBe(maps);
  });
});

// loadScript 진입점부터의 통합 경로. 단위 테스트(waitForJsContentLoaded)와 달리
// loadScript 가 실제로 submodule attach 를 기다리도록 와이어링됐는지 검증한다.
// 이미 naver.maps 가 로드된 경로만 다룬다(script 태그 append/네트워크 경로는 E2E 영역).
describe('loadScript (통합)', () => {
  const original = (globalThis as any).naver;
  afterEach(() => {
    (globalThis as any).naver = original;
  });

  test('이미 로드됨 + jsContentLoaded=true 면 즉시 resolve', async () => {
    const maps = { jsContentLoaded: true } as unknown as typeof naver.maps;
    (globalThis as any).naver = { maps };
    // cache 격리를 위해 테스트마다 고유 키 사용
    await expect(
      loadScript({ ncpKeyId: 'loadScript-loaded-true' }),
    ).resolves.toBe(maps);
  });

  test('이미 로드됨 + jsContentLoaded=false 면 onJSContentLoaded 발화까지 대기 후 resolve', async () => {
    const maps = {
      jsContentLoaded: false,
      onJSContentLoaded: undefined as undefined | (() => void),
    } as unknown as typeof naver.maps & {
      onJSContentLoaded: undefined | (() => void);
    };
    (globalThis as any).naver = { maps };

    let resolved = false;
    const promise = loadScript({ ncpKeyId: 'loadScript-loaded-false' }).then(
      (r) => {
        resolved = true;
        return r;
      },
    );

    await Promise.resolve();
    // 회귀(직접 resolve)였다면 여기서 이미 resolved=true 였을 것
    expect(resolved).toBe(false);

    maps.onJSContentLoaded!(); // submodule attach 완료 신호
    await expect(promise).resolves.toBe(maps);
    expect(resolved).toBe(true);
  });

  test('같은 options 재호출 시 동일 Promise 반환 (cache)', () => {
    const maps = { jsContentLoaded: true } as unknown as typeof naver.maps;
    (globalThis as any).naver = { maps };
    const a = loadScript({ ncpKeyId: 'loadScript-cache' });
    const b = loadScript({ ncpKeyId: 'loadScript-cache' });
    expect(a).toBe(b);
  });
});

describe('waitForExistingSdk', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('load 가 지났고 콜백이 오지 않으면 유예 뒤 resolve', async () => {
    const maps = { jsContentLoaded: false } as unknown as typeof naver.maps;
    const promise = waitForExistingSdk(maps);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toBe(maps);
  });

  test('유예 안에 콜백이 오면 바로 resolve', async () => {
    const maps = { jsContentLoaded: false } as unknown as typeof naver.maps;
    const promise = waitForExistingSdk(maps);
    maps.onJSContentLoaded();
    await expect(promise).resolves.toBe(maps);
  });
});

describe('loadScript 의 스크립트 하나', () => {
  type Loader = typeof import('../load-script.js');
  let fresh: Loader;
  let scripts: HTMLScriptElement[];

  beforeEach(async () => {
    vi.stubGlobal('naver', undefined);
    vi.resetModules();
    fresh = await import('../load-script.js');
    scripts = [];
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      scripts.push(node as HTMLScriptElement);
      return node;
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const finish = () => {
    const maps = { jsContentLoaded: true } as typeof naver.maps;
    vi.stubGlobal('naver', { maps });
    scripts.at(-1)!.dispatchEvent(new Event('load'));
    return maps;
  };

  test('로딩 중에 다른 옵션으로 부르면 스크립트를 더 넣지 않고 함께 끝난다', async () => {
    const first = fresh.loadScript({ ncpKeyId: 'k', language: 'ko' });
    const second = fresh.loadScript({ ncpKeyId: 'k', language: 'en' });
    expect(second).not.toBe(first);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.src).toContain('language=ko');
    const maps = finish();
    await expect(first).resolves.toBe(maps);
    await expect(second).resolves.toBe(maps);
  });

  test('로드 뒤 naver.maps 가 없으면 실패를 캐시에 남기지 않고 다시 넣는다', async () => {
    const options = { ncpKeyId: 'k' };
    const first = fresh.loadScript(options);
    scripts[0]!.dispatchEvent(new Event('load'));
    await expect(first).rejects.toThrow('naver.maps not available');
    const second = fresh.loadScript(options);
    expect(second).not.toBe(first);
    expect(scripts).toHaveLength(2);
    const maps = finish();
    await expect(second).resolves.toBe(maps);
  });

  test('스크립트 오류면 합류한 요청도 함께 실패하고 둘 다 다시 시도할 수 있다', async () => {
    const a = { ncpKeyId: 'k', language: 'ko' } as const;
    const b = { ncpKeyId: 'k', language: 'en' } as const;
    const first = fresh.loadScript(a);
    const second = fresh.loadScript(b);
    scripts[0]!.dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow('Failed to load');
    await expect(second).rejects.toThrow('Failed to load');
    expect(fresh.loadScript(a)).not.toBe(first);
    expect(fresh.loadScript(b)).not.toBe(second);
    expect(scripts).toHaveLength(2);
  });

  test('전역이 생겼어도 로딩 중이면 그 스크립트가 끝나기를 기다린다', async () => {
    const first = fresh.loadScript({ ncpKeyId: 'k', language: 'ko' });
    const maps = {
      jsContentLoaded: false,
    } as unknown as typeof naver.maps;
    vi.stubGlobal('naver', { maps });
    const second = fresh.loadScript({ ncpKeyId: 'k', language: 'en' });
    let settled = false;
    void second.then(() => {
      settled = true;
    });
    scripts[0]!.dispatchEvent(new Event('load'));
    await new Promise((r) => setTimeout(r, 0));
    expect(settled).toBe(false);
    maps.onJSContentLoaded?.();
    await expect(first).resolves.toBe(maps);
    await expect(second).resolves.toBe(maps);
  });

  test('같은 옵션을 다시 부르면 같은 Promise 다', () => {
    const options = { ncpKeyId: 'k' };
    expect(fresh.loadScript(options)).toBe(fresh.loadScript(options));
    expect(scripts).toHaveLength(1);
  });
});
