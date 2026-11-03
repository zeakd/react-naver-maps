'use client';

import type { Ref } from 'react';
import { defineOverlay } from './overlay-spec.js';
import type { StrokeStyle, FillStyle } from './types/shape-style.js';
import type { EventHandlerProps, ShapeEvent } from './types/overlay-events.js';
import { SHAPE_EVENTS } from './types/overlay-events.js';
import { shapeClickable } from './utils/shape-clickable.js';

/** 지도 위에 다각형을 그린다. paths로 꼭짓점 배열을 지정한다. */
export interface PolygonProps
  extends StrokeStyle, FillStyle, EventHandlerProps<ShapeEvent> {
  ref?: Ref<naver.maps.Polygon>;

  // Controlled
  paths?: naver.maps.ArrayOfCoords[] | naver.maps.ArrayOfCoordsLiteral[];

  // Uncontrolled
  defaultPaths?: naver.maps.ArrayOfCoords[] | naver.maps.ArrayOfCoordsLiteral[];

  /**
   * path 단순화 강도. 정수, 1 이상.
   * 값이 클수록 더 많은 점을 줄여 렌더 성능을 높이지만 모양이 거칠어진다.
   * 변경 시 즉시 redraw된다 (`_simplifyLevel_changed` 핸들러).
   */
  simplifyLevel?: number;

  // Options
  /** 생략하면 포인터 핸들러가 있을 때 켜진다. SDK 기본값은 false 다. */
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export const Polygon = defineOverlay<PolygonProps, naver.maps.Polygon>(
  'Polygon',
  {
    create: (navermaps, options) =>
      new navermaps.Polygon(options as unknown as naver.maps.PolygonOptions),
    options: [
      'paths',
      'strokeWeight',
      'strokeOpacity',
      'strokeColor',
      'strokeStyle',
      'strokeLineCap',
      'strokeLineJoin',
      'fillColor',
      'fillOpacity',
      'simplifyLevel',
      'visible',
      'zIndex',
    ],
    initial: (props) => ({ paths: props.paths ?? props.defaultPaths }),
    derived: (props) => ({ clickable: shapeClickable(props) }),
    events: SHAPE_EVENTS,
  },
);
