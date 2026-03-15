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

/** 지도 위에 사각형을 그린다. bounds로 영역을 지정한다. */
export interface RectangleProps
  extends StrokeStyle, FillStyle, EventHandlerProps<ShapeEvent> {
  ref?: Ref<naver.maps.Rectangle>;

  // Controlled
  bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;

  // Uncontrolled
  defaultBounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;

  // Options
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Rectangle({ ref, ...props }: RectangleProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const rectangle = useOverlayLifecycle(
    () =>
      new navermaps.Rectangle(
        omitUndefined({
          map,
          bounds: (props.bounds ?? props.defaultBounds)!,
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

  if (!rectangle) return null;

  return <RectangleInner rectangle={rectangle} {...props} />;
}

interface RectangleInnerProps extends Omit<RectangleProps, 'ref'> {
  rectangle: naver.maps.Rectangle;
}

function RectangleInner({ rectangle, ...props }: RectangleInnerProps) {
  // KVO sync - geometry
  useControlledKVO(rectangle, 'bounds', props.bounds);

  // KVO sync - style
  useControlledKVO(rectangle, 'strokeWeight', props.strokeWeight);
  useControlledKVO(rectangle, 'strokeOpacity', props.strokeOpacity);
  useControlledKVO(rectangle, 'strokeColor', props.strokeColor);
  useControlledKVO(rectangle, 'strokeStyle', props.strokeStyle);
  useControlledKVO(rectangle, 'strokeLineCap', props.strokeLineCap);
  useControlledKVO(rectangle, 'strokeLineJoin', props.strokeLineJoin);
  useControlledKVO(rectangle, 'fillColor', props.fillColor);
  useControlledKVO(rectangle, 'fillOpacity', props.fillOpacity);

  // KVO sync - options
  useControlledKVO(rectangle, 'visible', props.visible);
  useControlledKVO(rectangle, 'clickable', props.clickable);
  useControlledKVO(rectangle, 'zIndex', props.zIndex);

  // UI events
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onClick)
      listeners.push(
        naver.maps.Event.addListener(rectangle, 'click', props.onClick),
      );
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(rectangle, 'dblclick', props.onDblclick),
      );
    if (props.onMousedown)
      listeners.push(
        naver.maps.Event.addListener(rectangle, 'mousedown', props.onMousedown),
      );
    if (props.onMouseup)
      listeners.push(
        naver.maps.Event.addListener(rectangle, 'mouseup', props.onMouseup),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(
          rectangle,
          'rightclick',
          props.onRightclick,
        ),
      );
    if (props.onMouseover)
      listeners.push(
        naver.maps.Event.addListener(rectangle, 'mouseover', props.onMouseover),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(rectangle, 'mouseout', props.onMouseout),
      );
    if (props.onMousemove)
      listeners.push(
        naver.maps.Event.addListener(rectangle, 'mousemove', props.onMousemove),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    rectangle,
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
