'use client';

import type { Ref } from 'react';
import { useEffect } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { useOverlayLifecycle } from './hooks/use-overlay-lifecycle.js';
import { omitUndefined } from './utils/omit-undefined.js';
import type { StrokeStyle, FillStyle } from './types/shape-style.js';
import type { EventHandlerProps, ShapeEvent } from './types/overlay-events.js';

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
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Circle({ ref, ...props }: CircleProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const circle = useOverlayLifecycle(
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
          clickable: props.clickable,
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
  useControlledKVO(circle, 'clickable', props.clickable);
  useControlledKVO(circle, 'zIndex', props.zIndex);

  // UI events
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onClick)
      listeners.push(
        naver.maps.Event.addListener(circle, 'click', props.onClick),
      );
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(circle, 'dblclick', props.onDblclick),
      );
    if (props.onMousedown)
      listeners.push(
        naver.maps.Event.addListener(circle, 'mousedown', props.onMousedown),
      );
    if (props.onMouseup)
      listeners.push(
        naver.maps.Event.addListener(circle, 'mouseup', props.onMouseup),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(circle, 'rightclick', props.onRightclick),
      );
    if (props.onMouseover)
      listeners.push(
        naver.maps.Event.addListener(circle, 'mouseover', props.onMouseover),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(circle, 'mouseout', props.onMouseout),
      );
    if (props.onMousemove)
      listeners.push(
        naver.maps.Event.addListener(circle, 'mousemove', props.onMousemove),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
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
