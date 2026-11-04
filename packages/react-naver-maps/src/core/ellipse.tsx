'use client';

import type { Ref } from 'react';
import { defineOverlay } from './overlay-spec.js';
import type { StrokeStyle, FillStyle } from './types/shape-style.js';
import type {
  ChangeHandlerProps,
  EventHandlerProps,
  ShapeEvent,
} from './types/overlay-events.js';
import { SHAPE_EVENTS } from './types/overlay-events.js';
import { shapeClickable } from './utils/shape-clickable.js';

/** 지도 위에 타원을 그린다. bounds로 영역을 지정한다. */
export interface EllipseProps
  extends
    StrokeStyle,
    FillStyle,
    EventHandlerProps<ShapeEvent>,
    ChangeHandlerProps<{
      bounds: naver.maps.Bounds;
      clickable: boolean;
      visible: boolean;
      zIndex: number;
    }> {
  ref?: Ref<naver.maps.Ellipse>;

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

export const Ellipse = defineOverlay<EllipseProps, naver.maps.Ellipse>(
  'Ellipse',
  {
    create: (navermaps, options) =>
      new navermaps.Ellipse(options as unknown as naver.maps.EllipseOptions),
    options: [
      'bounds',
      'strokeWeight',
      'strokeOpacity',
      'strokeColor',
      'strokeStyle',
      'strokeLineCap',
      'strokeLineJoin',
      'fillColor',
      'fillOpacity',
      'visible',
      'zIndex',
    ],
    initial: (props) => ({ bounds: props.bounds ?? props.defaultBounds }),
    derived: (props) => ({ clickable: shapeClickable(props) }),
    events: SHAPE_EVENTS,
    changes: ['bounds', 'clickable', 'visible', 'zIndex'],
  },
);
