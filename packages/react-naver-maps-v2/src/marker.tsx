'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { omitUndefined } from './utils/omit-undefined.js';

export interface MarkerProps {
  ref?: Ref<naver.maps.Marker>;

  // Controlled
  position?: naver.maps.Coord | naver.maps.CoordLiteral;

  // Uncontrolled default
  defaultPosition?: naver.maps.Coord | naver.maps.CoordLiteral;

  // Options
  icon?:
    | string
    | naver.maps.ImageIcon
    | naver.maps.SymbolIcon
    | naver.maps.HtmlIcon;
  title?: string;
  clickable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;

  // Events
  onClick?: (e: naver.maps.PointerEvent) => void;
  onDblclick?: (e: naver.maps.PointerEvent) => void;
  onMouseover?: (e: naver.maps.PointerEvent) => void;
  onMouseout?: (e: naver.maps.PointerEvent) => void;
  onDragstart?: (e: naver.maps.PointerEvent) => void;
  onDrag?: (e: naver.maps.PointerEvent) => void;
  onDragend?: (e: naver.maps.PointerEvent) => void;
}

export function Marker({ ref, ...props }: MarkerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const [marker, setMarker] = useState<naver.maps.Marker | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);

  useEffect(() => {
    const instance = new navermaps.Marker(
      omitUndefined({
        map,
        position: (props.position ?? props.defaultPosition)!,
        icon: props.icon,
        title: props.title,
        clickable: props.clickable,
        draggable: props.draggable,
        visible: props.visible,
        zIndex: props.zIndex,
      }) as naver.maps.MarkerOptions,
    );
    markerRef.current = instance;
    setMarker(instance);

    return () => {
      naver.maps?.Event?.clearInstanceListeners(instance);
      instance.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => markerRef.current!);

  if (!marker) return null;

  return <MarkerInner marker={marker} {...props} />;
}

interface MarkerInnerProps extends Omit<MarkerProps, 'ref'> {
  marker: naver.maps.Marker;
}

function MarkerInner({ marker, ...props }: MarkerInnerProps) {
  // KVO sync
  useControlledKVO(marker, 'position', props.position);
  useControlledKVO(marker, 'visible', props.visible);
  useControlledKVO(marker, 'clickable', props.clickable);
  useControlledKVO(marker, 'draggable', props.draggable);
  useControlledKVO(marker, 'zIndex', props.zIndex);
  useControlledKVO(marker, 'icon', props.icon);
  useControlledKVO(marker, 'title', props.title);

  // UI events
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onClick)
      listeners.push(
        naver.maps.Event.addListener(marker, 'click', props.onClick),
      );
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(marker, 'dblclick', props.onDblclick),
      );
    if (props.onMouseover)
      listeners.push(
        naver.maps.Event.addListener(marker, 'mouseover', props.onMouseover),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(marker, 'mouseout', props.onMouseout),
      );
    if (props.onDragstart)
      listeners.push(
        naver.maps.Event.addListener(marker, 'dragstart', props.onDragstart),
      );
    if (props.onDrag)
      listeners.push(
        naver.maps.Event.addListener(marker, 'drag', props.onDrag),
      );
    if (props.onDragend)
      listeners.push(
        naver.maps.Event.addListener(marker, 'dragend', props.onDragend),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    marker,
    props.onClick,
    props.onDblclick,
    props.onMouseover,
    props.onMouseout,
    props.onDragstart,
    props.onDrag,
    props.onDragend,
  ]);

  return null;
}
