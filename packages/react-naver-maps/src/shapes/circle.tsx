'use client';

import type { Ref } from 'react';
import { defineOverlay } from '../overlays/overlay-spec.js';
import type { StrokeStyle, FillStyle } from './shape-style.js';
import type {
  ChangeHandlerProps,
  EventHandlerProps,
  ShapeEvent,
} from '../overlays/overlay-events.js';
import { SHAPE_EVENTS } from '../overlays/overlay-events.js';
import { shapeClickable } from './shape-clickable.js';

/** 지도 위에 원을 그린다. center와 radius로 위치/크기를 지정한다. */
export interface CircleProps
  extends
    StrokeStyle,
    FillStyle,
    EventHandlerProps<ShapeEvent>,
    ChangeHandlerProps<{
      center: naver.maps.Coord;
      radius: number;
      clickable: boolean;
      visible: boolean;
      zIndex: number;
    }> {
  ref?: Ref<naver.maps.Circle>;

  // Controlled
  /** 원의 중심. 주면 이 값으로 붙잡아 둔다. 처음 값만 주려면 `defaultCenter`. */
  center?: naver.maps.Coord | naver.maps.CoordLiteral;
  /** 반지름(m). 주면 이 값으로 붙잡아 둔다. 처음 값만 주려면 `defaultRadius`. */
  radius?: number;

  // Uncontrolled
  /** 처음 중심. 그 뒤로는 SDK 가 관리한다. */
  defaultCenter?: naver.maps.Coord | naver.maps.CoordLiteral;
  /** 처음 반지름(m). 그 뒤로는 SDK 가 관리한다. */
  defaultRadius?: number;

  // Options
  /** 생략하면 포인터 핸들러가 있을 때 켜진다. SDK 기본값은 false 다. */
  clickable?: boolean;
  /** 보일지 여부. */
  visible?: boolean;
  /** 겹쳤을 때의 쌓임 순서. 클수록 위에 그린다. */
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
  extraOptions: {},
  events: SHAPE_EVENTS,
  changes: ['center', 'clickable', 'radius', 'visible', 'zIndex'],
});
