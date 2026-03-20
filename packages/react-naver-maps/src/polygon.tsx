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

/** 지도 위에 다각형을 그린다. paths로 꼭짓점 배열을 지정한다. */
export interface PolygonProps
  extends StrokeStyle, FillStyle, EventHandlerProps<ShapeEvent> {
  ref?: Ref<naver.maps.Polygon>;

  // Controlled
  paths?: naver.maps.ArrayOfCoords[] | naver.maps.ArrayOfCoordsLiteral[];

  // Uncontrolled
  defaultPaths?: naver.maps.ArrayOfCoords[] | naver.maps.ArrayOfCoordsLiteral[];

  // Options
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Polygon({ ref, ...props }: PolygonProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const polygon = useOverlay(
    () =>
      new navermaps.Polygon(
        omitUndefined({
          map,
          paths: (props.paths ?? props.defaultPaths)!,
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

  if (!polygon) return null;

  return <PolygonInner polygon={polygon} {...props} />;
}

interface PolygonInnerProps extends Omit<PolygonProps, 'ref'> {
  polygon: naver.maps.Polygon;
}

function PolygonInner({ polygon, ...props }: PolygonInnerProps) {
  // KVO sync — paths uses setPaths setter
  useControlledKVO(polygon, 'paths', props.paths);
  useControlledKVO(polygon, 'strokeWeight', props.strokeWeight);
  useControlledKVO(polygon, 'strokeOpacity', props.strokeOpacity);
  useControlledKVO(polygon, 'strokeColor', props.strokeColor);
  useControlledKVO(polygon, 'strokeStyle', props.strokeStyle);
  useControlledKVO(polygon, 'strokeLineCap', props.strokeLineCap);
  useControlledKVO(polygon, 'strokeLineJoin', props.strokeLineJoin);
  useControlledKVO(polygon, 'fillColor', props.fillColor);
  useControlledKVO(polygon, 'fillOpacity', props.fillOpacity);
  useControlledKVO(polygon, 'clickable', props.clickable);
  useControlledKVO(polygon, 'visible', props.visible);
  useControlledKVO(polygon, 'zIndex', props.zIndex);

  // UI events
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onClick)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'click', props.onClick),
      );
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'dblclick', props.onDblclick),
      );
    if (props.onMousedown)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'mousedown', props.onMousedown),
      );
    if (props.onMouseup)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'mouseup', props.onMouseup),
      );
    if (props.onMouseover)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'mouseover', props.onMouseover),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'mouseout', props.onMouseout),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'rightclick', props.onRightclick),
      );
    if (props.onMousemove)
      listeners.push(
        naver.maps.Event.addListener(polygon, 'mousemove', props.onMousemove),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    polygon,
    props.onClick,
    props.onDblclick,
    props.onMousedown,
    props.onMouseup,
    props.onMouseover,
    props.onMouseout,
    props.onRightclick,
    props.onMousemove,
  ]);

  return null;
}
