import { cleanup, render } from '@testing-library/react';
import { Component, StrictMode } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useSdkInstance } from '../lifetime.js';
import type { SdkInstanceSpec } from '../lifetime.js';

type Instance = { createdBy: string };

beforeEach(() => vi.stubGlobal('naver', { maps: {} }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const killSdk = () => vi.stubGlobal('naver', { maps: null });

function logSpec(owner: string, log: string[]): SdkInstanceSpec<Instance> {
  return {
    create: () => {
      log.push(`create:${owner}`);
      return { createdBy: owner };
    },
    attach: (i) => log.push(`attach:${i.createdBy}:by:${owner}`),
    detach: (i) => log.push(`detach:${i.createdBy}:by:${owner}`),
    dispose: (i) => log.push(`dispose:${i.createdBy}:by:${owner}`),
    release: (i) => log.push(`release:${i.createdBy}:by:${owner}`),
  };
}

function Probe({
  owner,
  log,
  keyValue = 0,
}: {
  owner: string;
  log: string[];
  keyValue?: number;
}) {
  useSdkInstance(logSpec(owner, log), [keyValue]);
  return null;
}

test('교체하면 옛 인스턴스는 그것을 만든 렌더의 spec 으로 떼고 버린다', () => {
  const log: string[] = [];
  const view = render(<Probe owner="A" log={log} keyValue={1} />);
  view.rerender(<Probe owner="B" log={log} keyValue={1} />);
  view.rerender(<Probe owner="C" log={log} keyValue={2} />);
  expect(log).toEqual([
    'create:A',
    'detach:A:by:A',
    'dispose:A:by:A',
    'release:A:by:A',
    'create:C',
  ]);
});

test('언마운트하면 버리고 자체 자원을 치운 뒤 뗀다(insertion effect 정리가 먼저 돈다)', () => {
  const log: string[] = [];
  render(<Probe owner="A" log={log} />).unmount();
  expect(log).toEqual([
    'create:A',
    'dispose:A:by:A',
    'release:A:by:A',
    'detach:A:by:A',
  ]);
});

test('StrictMode 재실행에서는 떼었다 붙이기만 한다. 붙이기는 최신 spec 이다', () => {
  const log: string[] = [];
  render(
    <StrictMode>
      <Probe owner="A" log={log} />
    </StrictMode>,
  );
  expect(log).toEqual(['create:A', 'detach:A:by:A', 'attach:A:by:A']);
});

test('SDK 가 죽으면 SDK 를 부르는 정리는 건너뛰고 자체 자원만 치운다', () => {
  const log: string[] = [];
  const view = render(<Probe owner="A" log={log} />);
  log.length = 0;
  killSdk();
  view.unmount();
  expect(log).toEqual(['release:A:by:A']);
});

test('교체 중 create 가 던져도 옛 인스턴스를 두 번 버리지 않는다', () => {
  class Boundary extends Component<{ children: ReactNode }> {
    state = { failed: false };
    static getDerivedStateFromError() {
      return { failed: true };
    }
    render() {
      return this.state.failed ? null : this.props.children;
    }
  }
  const log: string[] = [];
  function Throwing({ keyValue }: { keyValue: number }) {
    useSdkInstance(
      {
        ...logSpec('A', log),
        create: () => {
          if (keyValue === 2) throw new Error('create 실패');
          return { createdBy: 'A' };
        },
      },
      [keyValue],
    );
    return null;
  }
  const silent = vi.spyOn(console, 'error').mockImplementation(() => {});
  const view = render(
    <Boundary>
      <Throwing keyValue={1} />
    </Boundary>,
  );
  view.rerender(
    <Boundary>
      <Throwing keyValue={2} />
    </Boundary>,
  );
  silent.mockRestore();
  expect(log.filter((l) => l.startsWith('dispose'))).toEqual([
    'dispose:A:by:A',
  ]);
  expect(log.filter((l) => l.startsWith('release'))).toEqual([
    'release:A:by:A',
  ]);
});

function throwingDispose(
  owner: string,
  log: string[],
): SdkInstanceSpec<Instance> {
  return {
    ...logSpec(owner, log),
    dispose: (i) => {
      log.push(`dispose:${i.createdBy}:by:${owner}`);
      throw new Error('dispose 실패');
    },
  };
}

class Catch extends Component<{ children: ReactNode; caught: unknown[] }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.caught.push(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

test('교체 중 dispose 가 던져도 자체 자원은 치우고 예외는 경계로 간다', () => {
  const log: string[] = [];
  const caught: unknown[] = [];
  function Owner({ keyValue }: { keyValue: number }) {
    useSdkInstance(throwingDispose('A', log), [keyValue]);
    return null;
  }
  const silent = vi.spyOn(console, 'error').mockImplementation(() => {});
  const view = render(
    <Catch caught={caught}>
      <Owner keyValue={1} />
    </Catch>,
  );
  view.rerender(
    <Catch caught={caught}>
      <Owner keyValue={2} />
    </Catch>,
  );
  silent.mockRestore();
  expect(log).toEqual([
    'create:A',
    'detach:A:by:A',
    'dispose:A:by:A',
    'release:A:by:A',
  ]);
  expect(caught.map((e) => (e as Error).message)).toEqual(['dispose 실패']);
});

test('언마운트에서 dispose 가 던져도 자체 자원은 치우고 예외는 경계로 간다', () => {
  const log: string[] = [];
  const caught: unknown[] = [];
  function Owner() {
    useSdkInstance(throwingDispose('A', log));
    return null;
  }
  const silent = vi.spyOn(console, 'error').mockImplementation(() => {});
  const view = render(
    <Catch caught={caught}>
      <Owner />
    </Catch>,
  );
  view.rerender(<Catch caught={caught}>{null}</Catch>);
  silent.mockRestore();
  expect(log.filter((l) => !l.startsWith('detach'))).toEqual([
    'create:A',
    'dispose:A:by:A',
    'release:A:by:A',
  ]);
  expect(caught.map((e) => (e as Error).message)).toEqual(['dispose 실패']);
});
