import { cleanup, render } from '@testing-library/react';
import { useLayoutEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  FakeMarker,
  installSdkFake,
  type SdkFake,
} from '../../__tests__/sdk-fake.js';
import { ContainerContext } from '../../map/container-context.js';
import { NaverMap } from '../../map/naver-map.js';
import { NaverMapContext } from '../../map/naver-map-context.js';
import { InfoWindow } from '../../overlays/info-window.js';
import { Marker } from '../../overlays/marker.js';
import { Circle } from '../../shapes/circle.js';

vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => naver.maps,
}));

let sdk: SdkFake;
beforeEach(() => {
  sdk = installSdkFake();
});
afterEach(() => {
  cleanup();
  sdk.uninstall();
});

/**
 * 인스턴스는 바깥 컴포넌트의 layout effect 에서 만들어지고 값 동기화는 그다음 렌더에 처음 돈다. 그 사이
 * 부모의 layout effect 가 prop 을 바꾸면 생성자가 받은 값과 첫 동기화가 보는 값이 다르다.
 */
function ChangesDuringMount({
  render: renderChild,
}: {
  render: (value: string) => ReactNode;
}) {
  const [value, setValue] = useState('red');
  // 일부러 layout effect 에서 바꾼다. 화면을 재서 prop 을 정하는 앱의 모양이다.
  // oxlint-disable-next-line react/set-state-in-effect
  useLayoutEffect(() => setValue('blue'), []);
  return <>{renderChild(value)}</>;
}

const inMap = (node: ReactNode) => {
  const host = new sdk.maps.Map(document.createElement('div'));
  return (
    <NaverMapContext value={host as unknown as naver.maps.Map}>
      {node}
    </NaverMapContext>
  );
};

const any = (c: unknown) => c as ComponentType<Record<string, unknown>>;

test('Marker: 생성 뒤 첫 동기화 전에 바뀐 prop 을 넣는다', () => {
  render(
    inMap(<ChangesDuringMount render={(value) => <Marker title={value} />} />),
  );
  const marker = sdk.last('Marker')!;
  expect(marker.options?.title).toBe('red');
  expect(marker.instance.get('title')).toBe('blue');
});

test('Circle: 스타일도 같다', () => {
  render(
    inMap(
      <ChangesDuringMount
        render={(value) => <Circle radius={1} fillColor={value} />}
      />,
    ),
  );
  expect(sdk.last('Circle')!.instance.get('fillColor')).toBe('blue');
});

test('InfoWindow: 옵션도 같다', () => {
  render(
    inMap(
      <ChangesDuringMount
        render={(value) => <InfoWindow content="x" backgroundColor={value} />}
      />,
    ),
  );
  expect(sdk.last('InfoWindow')!.instance.get('backgroundColor')).toBe('blue');
});

test('NaverMap: 옵션도 같다', () => {
  render(
    <ContainerContext value={document.createElement('div')}>
      <ChangesDuringMount render={(value) => <NaverMap background={value} />} />
    </ContainerContext>,
  );
  const map = sdk.last('Map')!.instance;
  expect(map.getOptions('background')).toBe('blue');
});

test.each([
  [
    'Marker',
    (v: string) => {
      const C = any(Marker);
      return <C rnmFuture={v} />;
    },
  ],
  [
    'InfoWindow',
    (v: string) => {
      const C = any(InfoWindow);
      return <C content="x" rnmFuture={v} />;
    },
  ],
  [
    'Circle',
    (v: string) => {
      const C = any(Circle);
      return <C radius={1} rnmFuture={v} />;
    },
  ],
] as const)('%s: 목록에 없는 옵션도 같다', (name, child) => {
  render(inMap(<ChangesDuringMount render={child} />));
  const created = sdk.last(name)!;
  expect(created.options?.rnmFuture).toBe('red');
  expect(created.instance.get('rnmFuture')).toBe('blue');
});

test('NaverMap: 목록에 없는 옵션도 같다', () => {
  const C = any(NaverMap);
  render(
    <ContainerContext value={document.createElement('div')}>
      <ChangesDuringMount render={(v) => <C rnmFuture={v} />} />
    </ContainerContext>,
  );
  expect(sdk.last('Map')!.instance.getOptions('rnmFuture')).toBe('blue');
});

test('값이 그대로면 마운트 때 setter 를 부르지 않는다', () => {
  const setTitle = vi.spyOn(FakeMarker.prototype as never, 'setTitle' as never);
  render(inMap(<Marker title="same" />));
  expect(setTitle).not.toHaveBeenCalled();
});
