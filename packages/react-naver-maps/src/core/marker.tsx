'use client';

import type { Ref } from 'react';
import { useEffect } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { useOverlay } from './hooks/use-overlay.js';
import { omitUndefined } from './utils/omit-undefined.js';
import type { EventHandlerProps, MarkerEvent } from './types/overlay-events.js';
import { addMapListener, removeMapListener } from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';

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

  const marker = useOverlay(() => {
    // SDK 는 지도에 붙을 때 clickable 이 true 인 Marker 에만 DOM 리스너를 단다.
    // 나중에 clickable 을 켜도 이벤트가 오도록 켠 채로 만들고 곧바로 원하는 값으로 되돌린다.
    const instance = new navermaps.Marker(
      omitUndefined({
        map,
        position: (props.position ?? props.defaultPosition)!,
        icon: props.icon,
        animation: props.animation,
        shape: props.shape,
        title: props.title,
        cursor: props.cursor,
        clickable: true,
        draggable: props.draggable,
        visible: props.visible,
        zIndex: props.zIndex,
      }),
    );
    if (props.clickable === false) instance.setClickable(false);
    return instance;
  }, ref);

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
    const listeners: MapListener[] = [];
    if (props.onClick)
      listeners.push(addMapListener(marker, 'click', props.onClick));
    if (props.onDblclick)
      listeners.push(addMapListener(marker, 'dblclick', props.onDblclick));
    if (props.onMouseover)
      listeners.push(addMapListener(marker, 'mouseover', props.onMouseover));
    if (props.onMousedown)
      listeners.push(addMapListener(marker, 'mousedown', props.onMousedown));
    if (props.onMouseup)
      listeners.push(addMapListener(marker, 'mouseup', props.onMouseup));
    if (props.onMouseout)
      listeners.push(addMapListener(marker, 'mouseout', props.onMouseout));
    if (props.onRightclick)
      listeners.push(addMapListener(marker, 'rightclick', props.onRightclick));
    if (props.onDragstart)
      listeners.push(addMapListener(marker, 'dragstart', props.onDragstart));
    if (props.onDrag)
      listeners.push(addMapListener(marker, 'drag', props.onDrag));
    if (props.onDragend)
      listeners.push(addMapListener(marker, 'dragend', props.onDragend));
    return () => {
      listeners.forEach((l) => removeMapListener(l));
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
