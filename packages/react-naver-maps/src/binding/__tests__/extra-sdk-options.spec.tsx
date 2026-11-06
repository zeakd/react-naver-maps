import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { installSdkFake, type SdkFake } from '../../__tests__/sdk-fake.js';
import { Marker } from '../../overlays/marker.js';
import { Circle } from '../../shapes/circle.js';
import { Ellipse } from '../../shapes/ellipse.js';
import { Polygon } from '../../shapes/polygon.js';
import { Polyline } from '../../shapes/polyline.js';
import { Rectangle } from '../../shapes/rectangle.js';
import { InfoWindow } from '../../overlays/info-window.js';
import { MAP_OPTION_PROPS } from '../../map/naver-map-options.js';
import type { MapOptionProp } from '../../map/naver-map-options.js';
import type { NaverMapProps } from '../../map/naver-map.js';
import type { ComponentType } from 'react';
import type { MarkerProps } from '../../overlays/marker.js';
import type { CircleProps } from '../../shapes/circle.js';
import type { EllipseProps } from '../../shapes/ellipse.js';
import type { PolygonProps } from '../../shapes/polygon.js';
import type { PolylineProps } from '../../shapes/polyline.js';
import type { RectangleProps } from '../../shapes/rectangle.js';
import { MAP_HANDLED_PROPS, NaverMap } from '../../map/naver-map.js';
import { NaverMapContext } from '../../map/naver-map-context.js';
import { ContainerContext } from '../../map/container-context.js';
import {
  extraSdkOptions,
  handledProps,
  useExtraSdkOptions,
} from '../extra-sdk-options.js';

// 소비자가 라이브러리 실행 코드를 바꾸지 않고 새 SDK 옵션의 타입만 보완한다.
declare module '../../overlays/marker.js' {
  interface MarkerProps {
    futurePaint?: { color: string };
  }
}
declare module '../../shapes/circle.js' {
  interface CircleProps {
    futurePaint?: { color: string };
  }
}
declare module '../../map/naver-map.js' {
  interface NaverMapProps {
    futurePaint?: { color: string };
  }
}

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

type Paint = { color: string } | undefined;
describe.each([
  ['Marker', (paint: Paint) => <Marker futurePaint={paint} />],
  ['Circle', (paint: Paint) => <Circle futurePaint={paint} />],
  ['Map', (paint: Paint) => <NaverMap futurePaint={paint} />],
] as const)('%s 추가 SDK 옵션', (name, component) => {
  test('타입만 보완한 옵션을 생성자와 공개 setOptions(object)에 전달한다', () => {
    const host = new sdk.maps.Map(document.createElement('div'));
    const element = document.createElement('div');
    const view = (paint?: { color: string }) => (
      <ContainerContext value={element}>
        <NaverMapContext value={host as unknown as naver.maps.Map}>
          {component(paint)}
        </NaverMapContext>
      </ContainerContext>
    );
    const red = { color: 'red' };
    const blue = { color: 'blue' };
    const { rerender } = render(view(red));
    const created = sdk.last(name)!;
    expect(created.options?.futurePaint).toEqual({ color: 'red' });
    const instance = created.instance;
    const setOptions = vi.spyOn(instance, 'setOptions');
    // 새 getter 는 없고, 우연히 같은 이름의 메서드가 있어도 라이브러리가 추측해 부르지 않는다.
    const guessedSetter = vi.fn();
    (instance as unknown as Record<string, unknown>).setFuturePaint =
      guessedSetter;
    rerender(view(red));
    expect(setOptions).not.toHaveBeenCalled();
    rerender(view(blue));
    expect(setOptions).toHaveBeenCalledExactlyOnceWith({
      futurePaint: { color: 'blue' },
    });
    expect(guessedSetter).not.toHaveBeenCalled();

    instance.set('futurePaint', { color: 'SDK changed' });
    rerender(view(blue));
    expect(setOptions).toHaveBeenCalledTimes(1);
    rerender(view(undefined));
    expect(setOptions).toHaveBeenCalledTimes(1);
    rerender(view(blue));
    expect(setOptions).toHaveBeenCalledTimes(2);
  });
});

test('React 이름·이벤트·초깃값·소유 지도·기존 처리 prop 은 추가 옵션이 아니다', () => {
  expect(
    extraSdkOptions(
      {
        ref: {},
        key: 'x',
        children: 'x',
        map: {},
        onClick: () => {},
        onFutureEvent: () => {},
        defaultPosition: {},
        clickable: true,
        futurePaint: 'red',
        ongoing: true,
        unknownCallback: () => {},
        futureAbsent: undefined,
      },
      handledProps(['clickable']),
    ),
  ).toEqual({
    futurePaint: 'red',
    ongoing: true,
    unknownCallback: expect.any(Function),
  });
});

test('새 SDK 옵션의 Date·Map·순환 객체 내부 구조를 추측하지 않는다', () => {
  const apply = vi.fn();
  const target = {};
  function Probe({ value }: { value: unknown }) {
    useExtraSdkOptions(target, { future: value }, apply);
    return null;
  }
  const { rerender } = render(<Probe value={null} />);
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  const values = [
    new Date(0),
    new Date(1),
    new Map([['a', 1]]),
    new Map([['a', 2]]),
    cyclic,
  ];
  values.forEach((value, index) => {
    rerender(<Probe value={value} />);
    expect(apply).toHaveBeenCalledTimes(index + 1);
    expect(apply.mock.lastCall?.[1].future).toBe(value);
    rerender(<Probe value={value} />);
    expect(apply).toHaveBeenCalledTimes(index + 1);
  });
});

test('타깃 교체는 새 생성자 값으로 시작하고, 나중에 추가한 옵션은 즉시 전달한다', () => {
  const apply = vi.fn();
  const first = {};
  const second = {};
  function Probe({
    target,
    options,
  }: {
    target: object;
    options: Record<string, unknown>;
  }) {
    useExtraSdkOptions(target, options, apply);
    return null;
  }
  const { rerender } = render(<Probe target={first} options={{}} />);
  rerender(<Probe target={first} options={{ future: 1 }} />);
  expect(apply).toHaveBeenLastCalledWith(first, { future: 1 });
  rerender(<Probe target={second} options={{ future: 2 }} />);
  expect(apply).toHaveBeenCalledTimes(1);
  rerender(<Probe target={second} options={{ future: 3 }} />);
  expect(apply).toHaveBeenLastCalledWith(second, { future: 3 });
  (globalThis as unknown as { naver: unknown }).naver = { maps: null };
  rerender(<Probe target={second} options={{ future: 4 }} />);
  expect(apply).toHaveBeenCalledTimes(2);
});

/** 이벤트·초깃값·ref·children 을 뺀 공개 prop. 컴포넌트에 prop 을 더하면 아래 표가 컴파일되지 않는다. */
type Plain<P> = Required<
  Pick<
    P,
    Exclude<
      keyof P,
      | `on${string}`
      | `default${string}`
      | 'ref'
      | 'children'
      | 'key'
      | 'futurePaint'
    >
  >
>;
type ExtraFree<P> = Record<keyof Plain<P>, 1>;

const STYLE = {
  strokeWeight: 1,
  strokeOpacity: 1,
  strokeColor: 1,
  strokeStyle: 1,
  strokeLineCap: 1,
  strokeLineJoin: 1,
} as const;
const FILL = { fillColor: 1, fillOpacity: 1 } as const;
const SHAPE = { clickable: 1, visible: 1, zIndex: 1 } as const;

const circleProps: ExtraFree<CircleProps> = {
  center: 1,
  radius: 1,
  ...STYLE,
  ...FILL,
  ...SHAPE,
};
const rectangleProps: ExtraFree<RectangleProps> = {
  bounds: 1,
  ...STYLE,
  ...FILL,
  ...SHAPE,
  editable: 1,
};
const ellipseProps: ExtraFree<EllipseProps> = {
  bounds: 1,
  ...STYLE,
  ...FILL,
  ...SHAPE,
  editable: 1,
};
const polygonProps: ExtraFree<PolygonProps> = {
  paths: 1,
  simplifyLevel: 1,
  ...STYLE,
  ...FILL,
  ...SHAPE,
  editable: 1,
};
const polylineProps: ExtraFree<PolylineProps> = {
  path: 1,
  simplifyLevel: 1,
  startIcon: 1,
  startIconSize: 1,
  endIcon: 1,
  endIconSize: 1,
  ...STYLE,
  ...SHAPE,
  editable: 1,
};
const markerProps: ExtraFree<MarkerProps> = {
  position: 1,
  icon: 1,
  animation: 1,
  shape: 1,
  title: 1,
  cursor: 1,
  clickable: 1,
  draggable: 1,
  visible: 1,
  zIndex: 1,
  collisionBehavior: 1,
  collisionBoxSize: 1,
};

describe.each([
  ['Marker', Marker, markerProps],
  ['Circle', Circle, circleProps],
  ['Rectangle', Rectangle, rectangleProps],
  ['Ellipse', Ellipse, ellipseProps],
  ['Polygon', Polygon, polygonProps],
  ['Polyline', Polyline, polylineProps],
] as const)('%s 의 공개 prop', (name, Overlay, all) => {
  test('자기 prop 은 추가 옵션으로 새지 않는다', () => {
    (sdk.maps as unknown as { drawing: object }).drawing = {};
    const host = new sdk.maps.Map(document.createElement('div'));
    const view = (n: number) => {
      const props = Object.fromEntries(
        Object.keys(all).map((key) => [key, key === 'animation' ? null : n]),
      );
      const Component = Overlay as unknown as ComponentType<
        Record<string, unknown>
      >;
      return (
        <NaverMapContext value={host as unknown as naver.maps.Map}>
          <Component {...props} />
        </NaverMapContext>
      );
    };
    const { rerender } = render(view(1));
    const setOptions = vi.spyOn(sdk.last(name)!.instance, 'setOptions');
    rerender(view(2));
    const objectCalls = setOptions.mock.calls.filter(
      ([arg]) => typeof arg === 'object',
    );
    expect(objectCalls).toEqual([]);
  });
});

test('InfoWindow 의 추가 옵션도 생성자와 공개 setOptions(object)에 전달한다', () => {
  const host = new sdk.maps.Map(document.createElement('div'));
  const view = (extra: Record<string, unknown>) => {
    const Window = InfoWindow as unknown as ComponentType<
      Record<string, unknown>
    >;
    return (
      <NaverMapContext value={host as unknown as naver.maps.Map}>
        <Window content="x" anchor={{ lat: 1, lng: 2 }} {...extra} />
      </NaverMapContext>
    );
  };
  const red = { color: 'red' };
  const blue = { color: 'blue' };
  const { rerender } = render(view({ futurePaint: red }));
  const created = sdk.last('InfoWindow')!;
  expect(created.options?.futurePaint).toBe(red);
  expect(created.options?.anchor).toBeUndefined();
  const setOptions = vi.spyOn(created.instance, 'setOptions');
  rerender(view({ futurePaint: blue }));
  expect(setOptions.mock.calls.filter(([a]) => typeof a === 'object')).toEqual([
    [{ futurePaint: blue }],
  ]);
});

/** 지도 prop 표(naver-map-options.ts)와 카메라 밖에 prop 이 생기면 컴파일되지 않는다. */
const mapProps: Record<
  Exclude<keyof Plain<NaverMapProps>, MapOptionProp>,
  1
> = {
  center: 1,
  zoom: 1,
  bounds: 1,
  centerPoint: 1,
  mapTypeId: 1,
  size: 1,
};

test('Map 의 공개 prop 은 추가 옵션으로 새지 않는다', () => {
  expect(
    extraSdkOptions(
      {
        ...mapProps,
        ...Object.fromEntries(MAP_OPTION_PROPS.map(([key]) => [key, 1])),
      },
      MAP_HANDLED_PROPS,
    ),
  ).toEqual({});
});
