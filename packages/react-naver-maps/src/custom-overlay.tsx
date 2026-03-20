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

/** React children을 지도 위 특정 좌표에 렌더링한다. Portal 기반. */
export interface CustomOverlayProps {
  ref?: Ref<naver.maps.OverlayView>;
  position: naver.maps.LatLng | naver.maps.LatLngLiteral;
  children: React.ReactNode;
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

  useEffect(() => {
    overlay?.setPosition(position);
  }, [overlay, position]);

  useEffect(() => {
    overlay?.setAnchor(anchor);
  }, [overlay, anchor]);

  useEffect(() => {
    overlay?.setZIndex(zIndex);
  }, [overlay, zIndex]);

  if (!overlay) return null;
  return createPortal(children, overlay.getContainerElement());
}
