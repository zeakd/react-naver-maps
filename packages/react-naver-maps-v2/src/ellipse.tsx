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

/** 지도 위에 타원을 그린다. bounds로 영역을 지정한다. */
export interface EllipseProps
  extends StrokeStyle, FillStyle, EventHandlerProps<ShapeEvent> {
  ref?: Ref<naver.maps.Ellipse>;

  // Controlled
  bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;

  // Uncontrolled
  defaultBounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;

  // Options
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Ellipse({ ref, ...props }: EllipseProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const ellipse = useOverlayLifecycle(
    () =>
      new navermaps.Ellipse(
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

  if (!ellipse) return null;

  return <EllipseInner ellipse={ellipse} {...props} />;
}

interface EllipseInnerProps extends Omit<EllipseProps, 'ref'> {
  ellipse: naver.maps.Ellipse;
}

function EllipseInner({ ellipse, ...props }: EllipseInnerProps) {
  // KVO sync - geometry
  useControlledKVO(ellipse, 'bounds', props.bounds);

  // KVO sync - style
  useControlledKVO(ellipse, 'strokeWeight', props.strokeWeight);
  useControlledKVO(ellipse, 'strokeOpacity', props.strokeOpacity);
  useControlledKVO(ellipse, 'strokeColor', props.strokeColor);
  useControlledKVO(ellipse, 'strokeStyle', props.strokeStyle);
  useControlledKVO(ellipse, 'strokeLineCap', props.strokeLineCap);
  useControlledKVO(ellipse, 'strokeLineJoin', props.strokeLineJoin);
  useControlledKVO(ellipse, 'fillColor', props.fillColor);
  useControlledKVO(ellipse, 'fillOpacity', props.fillOpacity);

  // KVO sync - options
  useControlledKVO(ellipse, 'visible', props.visible);
  useControlledKVO(ellipse, 'clickable', props.clickable);
  useControlledKVO(ellipse, 'zIndex', props.zIndex);

  // UI events
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onClick)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'click', props.onClick),
      );
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'dblclick', props.onDblclick),
      );
    if (props.onMousedown)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'mousedown', props.onMousedown),
      );
    if (props.onMouseup)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'mouseup', props.onMouseup),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'rightclick', props.onRightclick),
      );
    if (props.onMouseover)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'mouseover', props.onMouseover),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'mouseout', props.onMouseout),
      );
    if (props.onMousemove)
      listeners.push(
        naver.maps.Event.addListener(ellipse, 'mousemove', props.onMousemove),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    ellipse,
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
