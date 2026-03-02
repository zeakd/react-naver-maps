'use client';

import type { ReactNode, Ref } from 'react';
import { use, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { ContainerContext } from './contexts/container.js';
import { NaverMapContext } from './contexts/naver-map.js';
import { omitUndefined } from './utils/omit-undefined.js';

export interface NaverMapProps {
  ref?: Ref<naver.maps.Map>;
  children?: ReactNode;

  // Controlled
  center?: naver.maps.Coord | naver.maps.CoordLiteral;
  zoom?: number;

  // Uncontrolled defaults
  defaultCenter?: naver.maps.Coord | naver.maps.CoordLiteral;
  defaultZoom?: number;

  // Static options
  mapTypeId?: naver.maps.MapTypeId;
  minZoom?: number;
  maxZoom?: number;
  draggable?: boolean;
  scrollWheel?: boolean;
  pinchZoom?: boolean;
  logoControl?: boolean;

  // Events
  onInit?: () => void;
  onIdle?: () => void;
  onClick?: (e: naver.maps.PointerEvent) => void;
  onDblclick?: (e: naver.maps.PointerEvent) => void;
  onRightclick?: (e: naver.maps.PointerEvent) => void;
  onDragstart?: (e: naver.maps.PointerEvent) => void;
  onDrag?: (e: naver.maps.PointerEvent) => void;
  onDragend?: (e: naver.maps.PointerEvent) => void;
  onCenterChanged?: (center: naver.maps.Coord) => void;
  onZoomChanged?: (zoom: number) => void;
  onBoundsChanged?: (bounds: naver.maps.Bounds) => void;
}

export function NaverMap({ ref, children, ...props }: NaverMapProps) {
  const navermaps = useNavermaps();
  const container = use(ContainerContext);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);

  // Map 생성: DOM commit 후 effect에서 수행
  useEffect(() => {
    const instance = new navermaps.Map(
      container!,
      omitUndefined({
        center: props.center ?? props.defaultCenter,
        zoom: props.zoom ?? props.defaultZoom ?? 16,
        mapTypeId: props.mapTypeId,
        minZoom: props.minZoom,
        maxZoom: props.maxZoom,
        draggable: props.draggable,
        scrollWheel: props.scrollWheel,
        pinchZoom: props.pinchZoom,
        logoControl: props.logoControl,
      }),
    );
    mapRef.current = instance;
    setMap(instance);

    return () => {
      naver.maps?.Event?.clearInstanceListeners(instance);
      instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => mapRef.current!);

  if (!map) return null;

  return (
    <NaverMapContext value={map}>
      <NaverMapInner map={map} {...props}>
        {children}
      </NaverMapInner>
    </NaverMapContext>
  );
}

interface NaverMapInnerProps extends Omit<NaverMapProps, 'ref'> {
  map: naver.maps.Map;
}

function NaverMapInner({ map, children, ...props }: NaverMapInnerProps) {
  // Controlled KVO properties
  useControlledKVO(map, 'center', props.center);
  useControlledKVO(map, 'zoom', props.zoom);

  // UI events
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onInit)
      listeners.push(naver.maps.Event.addListener(map, 'init', props.onInit));
    if (props.onIdle)
      listeners.push(naver.maps.Event.addListener(map, 'idle', props.onIdle));
    if (props.onClick)
      listeners.push(naver.maps.Event.addListener(map, 'click', props.onClick));
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(map, 'dblclick', props.onDblclick),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(map, 'rightclick', props.onRightclick),
      );
    if (props.onDragstart)
      listeners.push(
        naver.maps.Event.addListener(map, 'dragstart', props.onDragstart),
      );
    if (props.onDrag)
      listeners.push(naver.maps.Event.addListener(map, 'drag', props.onDrag));
    if (props.onDragend)
      listeners.push(
        naver.maps.Event.addListener(map, 'dragend', props.onDragend),
      );
    if (props.onCenterChanged)
      listeners.push(
        naver.maps.Event.addListener(
          map,
          'center_changed',
          props.onCenterChanged,
        ),
      );
    if (props.onZoomChanged)
      listeners.push(
        naver.maps.Event.addListener(map, 'zoom_changed', props.onZoomChanged),
      );
    if (props.onBoundsChanged)
      listeners.push(
        naver.maps.Event.addListener(
          map,
          'bounds_changed',
          props.onBoundsChanged,
        ),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    map,
    props.onInit,
    props.onIdle,
    props.onClick,
    props.onDblclick,
    props.onRightclick,
    props.onDragstart,
    props.onDrag,
    props.onDragend,
    props.onCenterChanged,
    props.onZoomChanged,
    props.onBoundsChanged,
  ]);

  return <>{children}</>;
}
