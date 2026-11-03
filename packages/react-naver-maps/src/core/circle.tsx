'use client';

import type { Ref } from 'react';
import { defineOverlay } from './overlay-spec.js';
import type { StrokeStyle, FillStyle } from './types/shape-style.js';
import type { EventHandlerProps, ShapeEvent } from './types/overlay-events.js';
import { SHAPE_EVENTS } from './types/overlay-events.js';
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

const STYLE_OPTIONS = [
  'strokeWeight',
  'strokeOpacity',
  'strokeColor',
  'strokeStyle',
  'strokeLineCap',
  'strokeLineJoin',
  'fillColor',
  'fillOpacity',
] as const;

export const Circle = defineOverlay<CircleProps, naver.maps.Circle>('Circle', {
  create: (navermaps, options) =>
    new navermaps.Circle(options as unknown as naver.maps.CircleOptions),
  options: ['center', 'radius', ...STYLE_OPTIONS, 'visible', 'zIndex'],
  initial: (props) => ({
    center: props.center ?? props.defaultCenter,
    radius: props.radius ?? props.defaultRadius,
  }),
  derived: (props) => ({ clickable: shapeClickable(props) }),
  events: SHAPE_EVENTS,
});
