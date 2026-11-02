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

/** 지도 위에 사각형을 그린다. bounds로 영역을 지정한다. */
export interface RectangleProps
  extends StrokeStyle, FillStyle, EventHandlerProps<ShapeEvent> {
  ref?: Ref<naver.maps.Rectangle>;

  // Controlled
  bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;

  // Uncontrolled
  defaultBounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;

  // Options
  /** 생략하면 포인터 핸들러가 있을 때 켜진다. SDK 기본값은 false 다. */
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Rectangle({ ref, ...props }: RectangleProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const rectangle = useOverlay(
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
          clickable: shapeClickable(props),
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
  useControlledKVO(rectangle, 'clickable', shapeClickable(props));
  useControlledKVO(rectangle, 'zIndex', props.zIndex);

  // UI events
  useEffect(() => {
    const listeners: MapListener[] = [];
    if (props.onClick)
      listeners.push(addMapListener(rectangle, 'click', props.onClick));
    if (props.onDblclick)
      listeners.push(addMapListener(rectangle, 'dblclick', props.onDblclick));
    if (props.onMousedown)
      listeners.push(addMapListener(rectangle, 'mousedown', props.onMousedown));
    if (props.onMouseup)
      listeners.push(addMapListener(rectangle, 'mouseup', props.onMouseup));
    if (props.onRightclick)
      listeners.push(
        addMapListener(rectangle, 'rightclick', props.onRightclick),
      );
    if (props.onMouseover)
      listeners.push(addMapListener(rectangle, 'mouseover', props.onMouseover));
    if (props.onMouseout)
      listeners.push(addMapListener(rectangle, 'mouseout', props.onMouseout));
    if (props.onMousemove)
      listeners.push(addMapListener(rectangle, 'mousemove', props.onMousemove));
    return () => {
      listeners.forEach((l) => removeMapListener(l));
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
