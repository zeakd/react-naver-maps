'use client';

import type { Ref } from 'react';
import { useEffect } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { useOverlay } from './hooks/use-overlay.js';
import { omitUndefined } from './utils/omit-undefined.js';
import type { StrokeStyle } from './types/shape-style.js';
import type { EventHandlerProps, ShapeEvent } from './types/overlay-events.js';

/** 지도 위에 선을 그린다. path로 경로 좌표를 지정한다. */
export interface PolylineProps
  extends StrokeStyle, EventHandlerProps<ShapeEvent> {
  ref?: Ref<naver.maps.Polyline>;

  // Controlled
  path?: naver.maps.ArrayOfCoords | naver.maps.ArrayOfCoordsLiteral;

  // Uncontrolled
  defaultPath?: naver.maps.ArrayOfCoords | naver.maps.ArrayOfCoordsLiteral;

  // Polyline-specific
  startIcon?: naver.maps.PointingIcon;
  startIconSize?: number;
  endIcon?: naver.maps.PointingIcon;
  endIconSize?: number;

  // Options
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export function Polyline({ ref, ...props }: PolylineProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const polyline = useOverlay(
    () =>
      new navermaps.Polyline(
        omitUndefined({
          map,
          path: (props.path ?? props.defaultPath)!,
          strokeWeight: props.strokeWeight,
          strokeOpacity: props.strokeOpacity,
          strokeColor: props.strokeColor,
          strokeStyle: props.strokeStyle,
          strokeLineCap: props.strokeLineCap,
          strokeLineJoin: props.strokeLineJoin,
          startIcon: props.startIcon,
          startIconSize: props.startIconSize,
          endIcon: props.endIcon,
          endIconSize: props.endIconSize,
          clickable: props.clickable,
          visible: props.visible,
          zIndex: props.zIndex,
        }),
      ),
    ref,
  );

  if (!polyline) return null;

  return <PolylineInner polyline={polyline} {...props} />;
}

interface PolylineInnerProps extends Omit<PolylineProps, 'ref'> {
  polyline: naver.maps.Polyline;
}

function PolylineInner({ polyline, ...props }: PolylineInnerProps) {
  // KVO sync — path uses setPath setter
  useControlledKVO(polyline, 'path', props.path);
  useControlledKVO(polyline, 'strokeWeight', props.strokeWeight);
  useControlledKVO(polyline, 'strokeOpacity', props.strokeOpacity);
  useControlledKVO(polyline, 'strokeColor', props.strokeColor);
  useControlledKVO(polyline, 'strokeStyle', props.strokeStyle);
  useControlledKVO(polyline, 'strokeLineCap', props.strokeLineCap);
  useControlledKVO(polyline, 'strokeLineJoin', props.strokeLineJoin);
  useControlledKVO(polyline, 'startIcon', props.startIcon);
  useControlledKVO(polyline, 'startIconSize', props.startIconSize);
  useControlledKVO(polyline, 'endIcon', props.endIcon);
  useControlledKVO(polyline, 'endIconSize', props.endIconSize);
  useControlledKVO(polyline, 'clickable', props.clickable);
  useControlledKVO(polyline, 'visible', props.visible);
  useControlledKVO(polyline, 'zIndex', props.zIndex);

  // UI events
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onClick)
      listeners.push(
        naver.maps.Event.addListener(polyline, 'click', props.onClick),
      );
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(polyline, 'dblclick', props.onDblclick),
      );
    if (props.onMousedown)
      listeners.push(
        naver.maps.Event.addListener(polyline, 'mousedown', props.onMousedown),
      );
    if (props.onMouseup)
      listeners.push(
        naver.maps.Event.addListener(polyline, 'mouseup', props.onMouseup),
      );
    if (props.onMouseover)
      listeners.push(
        naver.maps.Event.addListener(polyline, 'mouseover', props.onMouseover),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(polyline, 'mouseout', props.onMouseout),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(
          polyline,
          'rightclick',
          props.onRightclick,
        ),
      );
    if (props.onMousemove)
      listeners.push(
        naver.maps.Event.addListener(polyline, 'mousemove', props.onMousemove),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    polyline,
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
