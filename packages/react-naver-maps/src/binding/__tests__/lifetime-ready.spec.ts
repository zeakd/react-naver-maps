import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  FakeKVO,
  installSdkFake,
  type SdkFake,
} from '../../__tests__/sdk-fake.js';
import { onReadyMap } from '../lifetime.js';

let mock: SdkFake;
beforeEach(() => {
  mock = installSdkFake();
});
afterEach(() => mock.uninstall());

/** 준비 전 지도. init 을 쏘면 준비된 것으로 본다. */
function unreadyHost() {
  const host = new FakeKVO() as FakeKVO & { isReady?: boolean };
  host.isReady = false;
  return host as unknown as naver.maps.Map & FakeKVO;
}

test('준비 전에 만든 인스턴스는 init 에 붙고, 붙은 뒤 init 리스너를 남기지 않는다', () => {
  const host = unreadyHost();
  const instance = new FakeKVO();
  const spec = onReadyMap(host, () => instance);
  spec.create();
  expect(instance.getMap()).toBeNull();
  expect(mock.listenerCount(host, 'init')).toBe(1);

  mock.fire(host, 'init');
  expect(instance.getMap()).toBe(host);
  // 붙인 뒤에도 남으면 지도가 사는 동안 버린 인스턴스를 붙잡는다.
  expect(mock.listenerCount(host, 'init')).toBe(0);

  spec.dispose(instance);
  expect(instance.getMap()).toBeNull();
  expect(mock.listenerCount(host, 'init')).toBe(0);
});

test('init 전에 버리면 init 리스너를 떼고 붙이지 않는다', () => {
  const host = unreadyHost();
  const instance = new FakeKVO();
  const spec = onReadyMap(host, () => instance);
  spec.create();
  spec.dispose(instance);
  expect(mock.listenerCount(host, 'init')).toBe(0);
  mock.fire(host, 'init');
  expect(instance.getMap()).toBeNull();
});
