'use client';

import type { Ref } from 'react';
import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { useMap } from '../hooks/use-map.js';
import { kvoEquals } from '../binding/use-controlled-kvo.js';
import { useStaticProp } from '../binding/use-static-prop.js';
import { onMap, useSdkInstance } from '../binding/lifetime.js';
import {
  createdOptionsOf,
  rememberCreatedOptions,
} from '../binding/created-options.js';

/**
 * React children을 지도 위 특정 좌표에 렌더링한다. Portal 기반.
 *
 * `pane`은 생성 시에만 적용된다. 런타임에 다른 pane으로 옮기려면 React `key`로 재마운트한다.
 */
/** CustomOverlay 위치. LatLng, Point(지도 이벤트의 coord), 리터럴({lat,lng}, {x,y}, [경도, 위도]). */
export type OverlayPosition =
  | naver.maps.LatLng
  | naver.maps.Point
  | naver.maps.LatLngLiteral;

export interface CustomOverlayProps {
  ref?: Ref<naver.maps.OverlayView>;
  position: OverlayPosition;
  children: React.ReactNode;
  /** 생성 시점에만 적용. 변경하려면 React `key`로 재마운트. */
  pane?: string;
  anchor?: naver.maps.Point;
  zIndex?: number;
}

type ReactOverlayViewInstance = InstanceType<
  ReturnType<typeof createOverlayViewClass>
>;

function createOverlayViewClass(navermaps: typeof naver.maps) {
  class ReactOverlayView extends navermaps.OverlayView {
    private _containerElement: HTMLDivElement;
    private _position: OverlayPosition;
    private _pane: string;
    private _anchor: naver.maps.Point | undefined;

    constructor(options: {
      position: OverlayPosition;
      pane?: string;
      anchor?: naver.maps.Point;
      zIndex?: number;
    }) {
      super();
      this._containerElement = document.createElement('div');
      this._containerElement.style.position = 'absolute';
      if (options.zIndex != null) {
        this._containerElement.style.zIndex = String(options.zIndex);
      }
      this._position = options.position;
      this._pane = options.pane ?? 'floatPane';
      this._anchor = options.anchor;
    }

    onAdd() {
      const panes = this.getPanes();
      const pane = panes[this._pane as keyof typeof panes] as HTMLElement;
      pane.appendChild(this._containerElement);
    }

    draw() {
      const projection = this.getProjection();
      const position = this._position;

      // 지도 이벤트의 e.coord 는 Point 일 수도 있다(Coord). 리터럴은 키로 구분한다.
      const coord =
        position instanceof navermaps.LatLng ||
        position instanceof navermaps.Point
          ? position
          : !Array.isArray(position) && 'x' in position
            ? new navermaps.Point(position.x, position.y)
            : // 0.3 과 같이 LatLng 리터럴과 [경도, 위도] 배열은 LatLng 생성자에 맡긴다.
              new navermaps.LatLng(position);

      const point = projection.fromCoordToOffset(coord);
      const anchorX = this._anchor?.x ?? 0;
      const anchorY = this._anchor?.y ?? 0;
      this._containerElement.style.left = `${point.x - anchorX}px`;
      this._containerElement.style.top = `${point.y - anchorY}px`;
    }

    onRemove() {
      this._containerElement.parentNode?.removeChild(this._containerElement);
    }

    getContainerElement() {
      return this._containerElement;
    }

    setPosition(position: OverlayPosition) {
      this._position = position;
      this.draw();
    }

    setAnchor(anchor: naver.maps.Point | undefined) {
      this._anchor = anchor;
      this.draw();
    }

    setZIndex(zIndex: number | undefined) {
      this._containerElement.style.zIndex =
        zIndex != null ? String(zIndex) : '';
    }
  }
  return ReactOverlayView;
}

export function CustomOverlay({
  ref,
  position,
  children,
  pane,
  anchor,
  zIndex,
}: CustomOverlayProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  // 생성 때만 읽는 prop. satisfies 로 이름이 CustomOverlayProps 의 키인지 컴파일 때 본다. 여러 개면
  // useStaticProps(binding/use-static-prop.ts)로 한 번에 넘긴다(NaverMap 처럼).
  useStaticProp(
    'CustomOverlay',
    'pane' satisfies keyof CustomOverlayProps,
    pane,
  );

  const overlay = useSdkInstance<ReactOverlayViewInstance>(
    onMap(map, () => {
      const OverlayViewClass = createOverlayViewClass(navermaps);
      const instance = new OverlayViewClass({ position, pane, anchor, zIndex });
      rememberCreatedOptions(instance, { position, anchor, zIndex });
      instance.setMap(map);
      return instance;
    }),
  );

  useImperativeHandle(ref, () => overlay!, [overlay]);

  // 값은 layout 단계에서 맞춘다. 같은 렌더의 부모 layout effect 가 ref 로 읽을 때 새 값으로 그려져 있고,
  // 타이머 등으로 바뀐 렌더에서도 화면이 한 프레임 늦지 않다(Marker 등 다른 오버레이와 같은 시점).
  // position, anchor 의 비교 기준은 마지막으로 넘긴 값이고, 처음에는 생성자에 넘긴 값이다. 그래서 마운트
  // 직후에 같은 값을 다시 넘겨 draw 하지 않고, 생성과 첫 동기화 사이에 바뀐 prop 은 넘긴다
  // (binding/created-options.ts). 인라인 LatLng/Point 객체로 매 렌더 새 참조가 들어와도 값이 같으면
  // 건너뛴다(setPosition, setAnchor 는 draw 를 부른다).
  const appliedRef = useRef<{
    instance: ReactOverlayViewInstance;
    values: Record<string, unknown>;
  } | null>(null);
  useLayoutEffect(() => {
    if (!overlay) return;
    const applied =
      appliedRef.current?.instance === overlay
        ? appliedRef.current.values
        : (createdOptionsOf(overlay) ?? {});
    if (!kvoEquals(applied.position, position)) overlay.setPosition(position);
    if (!kvoEquals(applied.anchor, anchor)) overlay.setAnchor(anchor);
    appliedRef.current = { instance: overlay, values: { position, anchor } };
  }, [overlay, position, anchor]);

  // zIndex 는 비교하지 않고 이 effect 가 돌 때마다 넣는다. 숨겼다 보일 때(Activity, Suspense)와 StrictMode
  // 재실행에도 돌아, 바깥에서 컨테이너 style 을 바꿨어도 prop 값으로 되돌린다. draw 를 부르지 않아 싸다.
  useLayoutEffect(() => {
    overlay?.setZIndex(zIndex);
  }, [overlay, zIndex]);

  if (!overlay) return null;
  return createPortal(children, overlay.getContainerElement());
}
