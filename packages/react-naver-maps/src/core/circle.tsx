'use client';

import type { Ref } from 'react';
import { useEffect } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { useOverlay } from './hooks/use-overlay.js';
import { omitUndefined } from './utils/omit-undefined.js';
import type { StrokeStyle, FillStyle } from './types/shape-style.js';
import type { EventHandlerProps, ShapeEvent } from './types/overlay-events.js';
import { addMapListener, removeMapListener } from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';
import { shapeClickable } from './utils/shape-clickable.js';

/** 지도 위에 원을 그린다. center와 radius로 위치/크기를 지정한다. */
export interface CircleProps
  extends StrokeStyle, FillStyle, EventHandlerProps<ShapeEvent> {
  ref?: Ref<naver.maps.Circle>;

  // Controlled
  center?: naver.maps.Coord | naver.maps.CoordLiteral;
  radius?: number;

  // Uncontrolled
  defaultCenter?: naver.maps.Coord | naver.maps.CoordLiteral;
  defaultRadius?: number;

  // Options
  /** 생략하면 포인터 핸들러가 있을 때 켜진다. SDK 기본값은 false 다. */
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Circle({ ref, ...props }: CircleProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const circle = useOverlay(
    () =>
      new navermaps.Circle(
        omitUndefined({
          map,
          center: (props.center ?? props.defaultCenter)!,
          radius: props.radius ?? props.defaultRadius,
          strokeWeight: props.strokeWeight,
          strokeOpacity: props.strokeOpacity,
          strokeColor: props.strokeColor,
          strokeStyle: props.strokeStyle,
          strokeLineCap: props.strokeLineCap,
          strokeLineJoin: props.strokeLineJoin,
          fillColor: props.fillColor,
          fillOpacity: props.fillOpacity,
          clickable: shapeClickable(props),
          visible: props.visible,
          zIndex: props.zIndex,
        }),
      ),
    ref,
  );

  if (!circle) return null;

  return <CircleInner circle={circle} {...props} />;
}

interface CircleInnerProps extends Omit<CircleProps, 'ref'> {
  circle: naver.maps.Circle;
}

function CircleInner({ circle, ...props }: CircleInnerProps) {
  // KVO sync - geometry
  useControlledKVO(circle, 'center', props.center);
  useControlledKVO(circle, 'radius', props.radius);

  // KVO sync - style
  useControlledKVO(circle, 'strokeWeight', props.strokeWeight);
  useControlledKVO(circle, 'strokeOpacity', props.strokeOpacity);
  useControlledKVO(circle, 'strokeColor', props.strokeColor);
  useControlledKVO(circle, 'strokeStyle', props.strokeStyle);
  useControlledKVO(circle, 'strokeLineCap', props.strokeLineCap);
  useControlledKVO(circle, 'strokeLineJoin', props.strokeLineJoin);
  useControlledKVO(circle, 'fillColor', props.fillColor);
  useControlledKVO(circle, 'fillOpacity', props.fillOpacity);

  // KVO sync - options
  useControlledKVO(circle, 'visible', props.visible);
  useControlledKVO(circle, 'clickable', shapeClickable(props));
  useControlledKVO(circle, 'zIndex', props.zIndex);

  // UI events
  useEffect(() => {
    const listeners: MapListener[] = [];
    if (props.onClick)
      listeners.push(addMapListener(circle, 'click', props.onClick));
    if (props.onDblclick)
      listeners.push(addMapListener(circle, 'dblclick', props.onDblclick));
    if (props.onMousedown)
      listeners.push(addMapListener(circle, 'mousedown', props.onMousedown));
    if (props.onMouseup)
      listeners.push(addMapListener(circle, 'mouseup', props.onMouseup));
    if (props.onRightclick)
      listeners.push(addMapListener(circle, 'rightclick', props.onRightclick));
    if (props.onMouseover)
      listeners.push(addMapListener(circle, 'mouseover', props.onMouseover));
    if (props.onMouseout)
      listeners.push(addMapListener(circle, 'mouseout', props.onMouseout));
    if (props.onMousemove)
      listeners.push(addMapListener(circle, 'mousemove', props.onMousemove));
    return () => {
      listeners.forEach((l) => removeMapListener(l));
    };
  }, [
    circle,
    props.onClick,
    props.onDblclick,
    props.onMousedown,
    props.onMouseup,
    props.onRightclick,
    props.onMouseover,
    props.onMouseout,
    props.onMousemove,
  ]);

  return null;
}
