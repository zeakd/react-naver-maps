'use client';

import type { Ref } from 'react';
import { useEffect } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { useOverlayLifecycle } from './hooks/use-overlay-lifecycle.js';
import { omitUndefined } from './utils/omit-undefined.js';
import type { EventHandlerProps, MarkerEvent } from './types/overlay-events.js';

/** 지도 위에 마커를 표시한다. NaverMap 내부에서 사용. */
export interface MarkerProps extends EventHandlerProps<MarkerEvent> {
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
  animation?: naver.maps.Animation;
  shape?: naver.maps.MarkerShape;
  title?: string;
  cursor?: string;
  clickable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Marker({ ref, ...props }: MarkerProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const marker = useOverlayLifecycle(
    () =>
      new navermaps.Marker(
        omitUndefined({
          map,
          position: (props.position ?? props.defaultPosition)!,
          icon: props.icon,
          animation: props.animation,
          shape: props.shape,
          title: props.title,
          cursor: props.cursor,
          clickable: props.clickable,
          draggable: props.draggable,
          visible: props.visible,
          zIndex: props.zIndex,
        }),
      ),
    ref,
  );

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
  useControlledKVO(marker, 'animation', props.animation);
  useControlledKVO(marker, 'shape', props.shape);
  useControlledKVO(marker, 'title', props.title);
  useControlledKVO(marker, 'cursor', props.cursor);

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
    if (props.onMousedown)
      listeners.push(
        naver.maps.Event.addListener(marker, 'mousedown', props.onMousedown),
      );
    if (props.onMouseup)
      listeners.push(
        naver.maps.Event.addListener(marker, 'mouseup', props.onMouseup),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(marker, 'mouseout', props.onMouseout),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(marker, 'rightclick', props.onRightclick),
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
    props.onMousedown,
    props.onMouseup,
    props.onMouseover,
    props.onMouseout,
    props.onRightclick,
    props.onDragstart,
    props.onDrag,
    props.onDragend,
  ]);

  return null;
}
