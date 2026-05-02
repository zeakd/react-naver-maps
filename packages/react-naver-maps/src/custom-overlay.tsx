'use client';

import type { Ref } from 'react';
import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { kvoEquals } from './hooks/use-controlled-kvo.js';
import { useStaticProp } from './hooks/use-static-prop.js';

/**
 * React children을 지도 위 특정 좌표에 렌더링한다. Portal 기반.
 *
 * `pane`은 생성 시에만 적용된다. 런타임에 다른 pane으로 옮기려면 React `key`로 재마운트한다.
 */
export interface CustomOverlayProps {
  ref?: Ref<naver.maps.OverlayView>;
  position: naver.maps.LatLng | naver.maps.LatLngLiteral;
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
    private _position: naver.maps.LatLng | naver.maps.LatLngLiteral;
    private _pane: string;
    private _anchor: naver.maps.Point | undefined;

    constructor(options: {
      position: naver.maps.LatLng | naver.maps.LatLngLiteral;
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

      const coord =
        position instanceof navermaps.LatLng
          ? position
          : new navermaps.LatLng(position as naver.maps.LatLngLiteral);

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

    setPosition(position: naver.maps.LatLng | naver.maps.LatLngLiteral) {
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
  const [overlay, setOverlay] = useState<ReactOverlayViewInstance | null>(null);
  const overlayRef = useRef<ReactOverlayViewInstance | null>(null);

  // satisfies로 propName이 keyof CustomOverlayProps에 속함을 컴파일 시점에 강제
  useStaticProp(
    'CustomOverlay',
    'pane' satisfies keyof CustomOverlayProps,
    pane,
  );

  useLayoutEffect(() => {
    const OverlayViewClass = createOverlayViewClass(navermaps);
    const instance = new OverlayViewClass({ position, pane, anchor, zIndex });
    instance.setMap(map);
    overlayRef.current = instance;
    setOverlay(instance);

    return () => {
      naver.maps?.Event?.clearInstanceListeners(instance);
      instance.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => overlayRef.current!);

  // 인라인 LatLng/Point 객체로 매 렌더 새 참조가 들어와도 LatLng.equals/Point.equals로
  // 실제 값이 같으면 setter를 건너뛴다. setPosition/setAnchor는 draw()를 호출하므로
  // 빈 호출은 좌표 변환 + DOM 갱신 비용이 든다.
  const prevPositionRef = useRef<typeof position | null>(null);
  useEffect(() => {
    if (!overlay) return;
    if (kvoEquals(prevPositionRef.current, position)) return;
    prevPositionRef.current = position;
    overlay.setPosition(position);
  }, [overlay, position]);

  const prevAnchorRef = useRef<typeof anchor | null>(null);
  useEffect(() => {
    if (!overlay) return;
    if (kvoEquals(prevAnchorRef.current, anchor)) return;
    prevAnchorRef.current = anchor;
    overlay.setAnchor(anchor);
  }, [overlay, anchor]);

  useEffect(() => {
    overlay?.setZIndex(zIndex);
  }, [overlay, zIndex]);

  if (!overlay) return null;
  return createPortal(children, overlay.getContainerElement());
}
