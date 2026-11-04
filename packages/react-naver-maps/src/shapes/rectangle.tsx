'use client';

import type { Ref } from 'react';
import { defineOverlay } from '../overlays/overlay-spec.js';
import { useEditable } from './use-editable.js';
import type { StrokeStyle, FillStyle } from './shape-style.js';
import type {
  ChangeHandlerProps,
  EventHandlerProps,
  ShapeEvent,
} from '../overlays/overlay-events.js';
import { SHAPE_EVENTS } from '../overlays/overlay-events.js';
import { shapeClickable } from './shape-clickable.js';

/** 지도 위에 사각형을 그린다. bounds로 영역을 지정한다. */
export interface RectangleProps
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
  /**
   * 꼭짓점을 끌어 고칠 수 있게 한다(drawing 서브모듈 필요). 편집은 SDK 가 path 를 제자리에서 고쳐
   * controlled 값이면 다시 렌더할 때 되돌린다. `default*` 로 두고 ref 의 getter 로 읽는다.
   */
  editable?: boolean;
}

export const Rectangle = defineOverlay<RectangleProps, naver.maps.Rectangle>(
  'Rectangle',
  {
    create: (navermaps, options) =>
      new navermaps.Rectangle(
        options as unknown as naver.maps.RectangleOptions,
      ),
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
    sync: (shape, props) => useEditable(shape, props.editable, 'Rectangle'),
    events: SHAPE_EVENTS,
    changes: ['bounds', 'clickable', 'visible', 'zIndex'],
  },
);
