import type { ConstantPaths } from './constants.js';
import { changedProp } from './types/overlay-events.js';

/**
 * NaverMap 의 SDK 옵션 prop 과 마운트 뒤 규칙. 공식 문서 MapOptions(3.10.5) 가운데 카메라
 * (center, zoom, bounds, centerPoint)와 기본값 짝이 있는 것(mapTypeId, size)을 뺀 나머지다.
 * 배열 순서가 생성자에 넘기는 순서이고 동기화 순서다.
 *
 * - `sync`: 바뀌면 SDK 에 맞추고, 바깥에서 바뀌면 prop 으로 되돌린다(`useControlledProps`).
 * - `static`: 생성자만 읽는다. 마운트 뒤 바꾸면 개발 모드에서 경고한다(`useStaticProps`).
 *   바꾸려면 `key` 로 지도를 다시 만든다.
 * - `create`: 생성 때만 넘기고 맞추지 않는다. logoControl 은 SDK 가 false 를 받지 않고 늘 true 로
 *   둔다(setRefinedOption, 3.10.5). 맞추려 하면 매 렌더 되돌리기만 한다.
 */
export const MAP_OPTION_PROPS = [
  ['minZoom', 'sync'],
  ['maxZoom', 'sync'],
  // 생성자는 cursor 옵션을 읽지 않는다. 마운트 때 다르면 맞춘다(SyncRules.writeOnMount).
  ['cursor', 'sync'],
  ['tilt', 'sync'],
  ['rotation', 'sync'],
  ['tileDuration', 'static'],
  ['background', 'sync'],
  ['baseTileOpacity', 'sync'],
  ['draggable', 'sync'],
  ['scrollWheel', 'sync'],
  ['pinchZoom', 'sync'],
  ['keyboardShortcuts', 'sync'],
  ['disableDoubleClickZoom', 'sync'],
  ['disableDoubleTapZoom', 'sync'],
  ['disableTwoFingerTapZoom', 'sync'],
  ['disableKineticPan', 'sync'],
  ['tileTransition', 'sync'],
  ['logoControl', 'create'],
  ['logoControlOptions', 'sync'],
  ['mapDataControl', 'sync'],
  ['mapDataControlOptions', 'sync'],
  ['mapTypeControl', 'sync'],
  ['mapTypeControlOptions', 'sync'],
  ['scaleControl', 'sync'],
  ['scaleControlOptions', 'sync'],
  ['zoomControl', 'sync'],
  ['zoomControlOptions', 'sync'],
  ['mapTypes', 'sync'],
  ['maxBounds', 'sync'],
  ['padding', 'sync'],
  ['resizeOrigin', 'sync'],
  ['overlayZoomEffect', 'sync'],
  ['tileSpare', 'sync'],
  ['zoomOrigin', 'sync'],
  // SDK 는 빈 타일 이미지를 생성자에서만 읽는다.
  ['blankTileImage', 'static'],
  ['repeatX', 'static'],
  ['gl', 'static'],
  ['customStyleId', 'static'],
  ['useStyleMap', 'static'],
] as const;

export type MapOptionProp = (typeof MAP_OPTION_PROPS)[number][0];
type Rule = (typeof MAP_OPTION_PROPS)[number][1];

function propsWith(rule: Rule): MapOptionProp[] {
  return MAP_OPTION_PROPS.filter(([, r]) => r === rule).map(([k]) => k);
}

/** 마운트 뒤 맞추는 prop. 기본값 짝이 있는 mapTypeId, size 도 맞춘다. */
export const MAP_SYNCED_PROPS = [
  'mapTypeId',
  'size',
  ...propsWith('sync'),
] as const satisfies readonly string[];
export const MAP_STATIC_PROPS = propsWith('static');

/**
 * 지도 이벤트와 prop. 이름만 쓴 것은 `on` + 이름(`click` → `onClick`), 값 변경 이벤트는
 * `<키>_changed` → `on<키>Changed`(값을 인자로 받는다). 공식 문서 Map Events(3.10.5).
 *
 * 여기 없는 것: `zoom_changed`(GL 에서 이벤트 값과 getZoom() 이 달라 getZoom() 을 넘긴다),
 * `init`·`idle`·`tilesloaded`(MAP_LIFECYCLE_EVENTS).
 */
export const MAP_EVENTS = [
  ...[
    'center',
    'bounds',
    'mapTypeId',
    'size',
    'centerPoint',
    'mapType',
    'tilt',
    'rotation',
  ].map((k) => [`${k}_changed`, changedProp(k)] as const),
  'panning',
  'zoomstart',
  'zoomend',
  'zoom',
  'zooming',
  'resize',
  ['projection_changed', changedProp('projection')] as const,
  'addLayer',
  'removeLayer',
  'click',
  'dblclick',
  'rightclick',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'mousemove',
  'dragstart',
  'drag',
  'dragend',
  'touchstart',
  'touchmove',
  'touchend',
  'pinchstart',
  'pinch',
  'pinchend',
  'tap',
  'longtap',
  'twofingertap',
  'doubletap',
  'keydown',
  'keyup',
] as const;

/**
 * 지도가 만들어지며 바로(동기 또는 짧은 비동기로) 내는 이벤트. paint 뒤에 붙이면 놓칠 수 있어
 * layout effect 에서 붙인다.
 */
export const MAP_LIFECYCLE_EVENTS = ['init', 'idle', 'tilesloaded'] as const;

/** 이름으로도 받는 SDK 상수 자리(core/constants.ts). */
export const MAP_CONSTANTS: ConstantPaths = {
  'zoomControlOptions.position': (m) => m.Position,
  'zoomControlOptions.style': (m) => m.ZoomControlStyle,
  'mapTypeControlOptions.position': (m) => m.Position,
  'mapTypeControlOptions.style': (m) => m.MapTypeControlStyle,
  'scaleControlOptions.position': (m) => m.Position,
  'logoControlOptions.position': (m) => m.Position,
  'mapDataControlOptions.position': (m) => m.Position,
};
