import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { LoadOptions } from '../load-script.js';
import {
  buildUrl,
  getKeyId,
  loadScript,
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
