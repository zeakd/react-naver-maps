'use client';

import type { Ref } from 'react';
import { defineOverlay } from '../overlays/overlay-spec.js';
import { useEditable } from './use-editable.js';
import type { StrokeStyle } from './shape-style.js';
import type {
  ChangeHandlerProps,
  EventHandlerProps,
  ShapeEvent,
} from '../overlays/overlay-events.js';
import { SHAPE_EVENTS } from '../overlays/overlay-events.js';
import { shapeClickable } from './shape-clickable.js';

/** 지도 위에 선을 그린다. path로 경로 좌표를 지정한다. */
export interface PolylineProps
  extends
    StrokeStyle,
    EventHandlerProps<ShapeEvent>,
    ChangeHandlerProps<{
      clickable: boolean;
      visible: boolean;
      zIndex: number;
    }> {
  ref?: Ref<naver.maps.Polyline>;

  // Controlled
  /** 꼭짓점 배열. 주면 이 값으로 붙잡아 둔다. 처음 값만 주려면 `defaultPath`. */
  path?:
    | naver.maps.ArrayOfCoords
    | naver.maps.KVOArrayOfCoords
    | naver.maps.ArrayOfCoordsLiteral;

  // Uncontrolled
  /** 처음 꼭짓점. 그 뒤로는 SDK 가 관리한다(편집으로 바뀐 값을 되돌리지 않는다). */
  defaultPath?:
    | naver.maps.ArrayOfCoords
    | naver.maps.KVOArrayOfCoords
    | naver.maps.ArrayOfCoordsLiteral;

  // Polyline-specific
  /** 시작점에 그릴 모양(SDK 의 `PointingIcon` 값). */
  startIcon?: naver.maps.PointingIcon;
  /** 시작점 모양 크기(px). */
  startIconSize?: number;
  /** 끝점에 그릴 모양(SDK 의 `PointingIcon` 값). 화살표 선을 그릴 때 쓴다. */
  endIcon?: naver.maps.PointingIcon;
  /** 끝점 모양 크기(px). */
  endIconSize?: number;

  /**
   * path 단순화 강도. 정수, 1 이상.
   * 값이 클수록 더 많은 점을 줄여 렌더 성능을 높이지만 모양이 거칠어진다.
   * 변경 시 즉시 redraw된다 (`_simplifyLevel_changed` 핸들러).
   */
  simplifyLevel?: number;

  // Options
  /** 생략하면 포인터 핸들러가 있을 때 켜진다. SDK 기본값은 false 다. */
  clickable?: boolean;
  /** 보일지 여부. */
  visible?: boolean;
  /** 겹쳤을 때의 쌓임 순서. 클수록 위에 그린다. */
  zIndex?: number;
  /**
   * 꼭짓점을 끌어 고칠 수 있게 한다(drawing 서브모듈 필요). 편집은 SDK 가 path 를 제자리에서 고쳐
   * controlled 값이면 다시 렌더할 때 되돌린다. `default*` 로 두고 ref 의 getter 로 읽는다.
   */
  editable?: boolean;
}

export const Polyline = defineOverlay<PolylineProps, naver.maps.Polyline>(
  'Polyline',
  {
    create: (navermaps, options) =>
      new navermaps.Polyline(options as unknown as naver.maps.PolylineOptions),
    options: [
      'path',
      'strokeWeight',
      'strokeOpacity',
      'strokeColor',
      'strokeStyle',
      'strokeLineCap',
      'strokeLineJoin',
      'startIcon',
      'startIconSize',
      'endIcon',
      'endIconSize',
      'simplifyLevel',
      'visible',
      'zIndex',
    ],
    initial: (props) => ({ path: props.path ?? props.defaultPath }),
    derived: (props) => ({ clickable: shapeClickable(props) }),
    sync: (shape, props) =>
      useEditable(
        shape,
        props.editable,
        'Polyline',
        props.path === undefined ? undefined : 'path',
      ),
    extraOptions: { ownProps: ['editable'] },
    events: SHAPE_EVENTS,
    changes: ['clickable', 'visible', 'zIndex'],
  },
);
