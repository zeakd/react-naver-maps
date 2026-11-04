'use client';

// SDK drawing 서브모듈(naver.maps.drawing)의 DrawingManager.
// <NavermapsProvider submodules={['drawing']}> 로 불러야 한다.
import type { Ref } from 'react';
import { resolveConstants } from '../core/constants.js';
import type {
  ConstantPaths,
  DrawingModeName,
  DrawingStyleName,
  PositionName,
} from '../core/constants.js';
import { useImperativeHandle } from 'react';
import { useNavermaps } from '../core/hooks/use-navermaps.js';
import { useMap } from '../core/hooks/use-map.js';
import { useControlledProps } from '../core/hooks/use-controlled-kvo.js';
import { useOverlayEvents } from '../core/overlay-spec.js';
import { pick } from '../core/utils/pick.js';
import { onReadyMap, useSdkInstance } from '../core/lifetime.js';
import { omitUndefined } from '../core/utils/omit-undefined.js';
import { requireSubmodule } from '../core/utils/submodule.js';

type Manager = naver.maps.drawing.DrawingManager;
/**
 * 그린 도형. 모드에 따라 Rectangle, Ellipse, Polyline, Polygon, Marker 이고, SDK 가 붙인 `id`, `name`
 * (그린 모드 이름)과 `setEditable` 이 있다(공식 문서 DrawingManager, global DrawingOverlay).
 */
export type DrawingOverlay = (
  | naver.maps.Rectangle
  | naver.maps.Ellipse
  | naver.maps.Polyline
  | naver.maps.Polygon
  | naver.maps.Marker
) &
  naver.maps.drawing.DrawingOverlay;

/**
 * 사용자가 지도 위에 도형을 그리게 한다. SDK 의 `naver.maps.drawing.DrawingManager` 다.
 *
 * ```tsx
 * const navermaps = useNavermaps();
 * const { DrawingMode } = navermaps.drawing;
 * <NaverMap>
 *   <DrawingManager
 *     drawingControl={[DrawingMode.POLYGON, DrawingMode.MARKER]}
 *     onDrawingAdded={(overlay) => save(overlay)}
 *   />
 * </NaverMap>
 * ```
 *
 * 그린 도형은 SDK 가 가진다. 이벤트로 받고, 전부 필요하면 ref 의 `getDrawings()`, `toGeoJson()` 을 쓴다.
 */
export interface DrawingManagerProps {
  ref?: Ref<Manager>;
  /** 도구 막대에 보일 모드. `'POLYGON'` 같은 이름이나 `navermaps.drawing.DrawingMode` 값. */
  drawingControl?: DrawingModeName[];
  /** 도구 막대 자리와 모양. `position`·`style` 도 이름으로 받는다. */
  drawingControlOptions?: Omit<
    naver.maps.drawing.DrawingControlOptions,
    'position' | 'style'
  > & { position?: PositionName; style?: DrawingStyleName };
  /**
   * 지금 모드. 다른 controlled prop 과 같이, 사용자가 도구 막대로 바꿔도 다시 렌더하면 이 값으로
   * 돌아간다. 받아들이려면 `onDrawingModeChanged` 로 상태를 갱신한다.
   */
  drawingMode?: DrawingModeName;
  /** 편집점 모양. 공식 문서 controlPointOptions: 꼭짓점(anchor)과 중간점(mid)의 원 스타일. */
  controlPointOptions?: {
    anchorPointOptions?: Partial<naver.maps.CircleOptions>;
    midPointOptions?: Partial<naver.maps.CircleOptions>;
  };
  // 그릴 도형의 스타일. 위치(bounds, path 등)는 사용자가 그려서 정하므로 일부만 준다(@types DrawingOptions 와 같다).
  rectangleOptions?: Partial<naver.maps.RectangleOptions>;
  ellipseOptions?: Partial<naver.maps.EllipseOptions>;
  polylineOptions?: Partial<naver.maps.PolylineOptions>;
  arrowlineOptions?: Partial<naver.maps.PolylineOptions>;
  polygonOptions?: Partial<naver.maps.PolygonOptions>;
  markerOptions?: Partial<naver.maps.MarkerOptions>;
  onDrawingAdded?: (overlay: DrawingOverlay) => void;
  onDrawingRemoved?: (overlay: DrawingOverlay) => void;
  onDrawingSelected?: (overlay: DrawingOverlay) => void;
  onDrawingModeChanged?: (mode: naver.maps.drawing.DrawingMode) => void;
}

/** 이름으로도 받는 SDK 상수 자리(core/constants.ts). */
const DRAWING_CONSTANTS: ConstantPaths = {
  drawingMode: 'drawing.DrawingMode',
  'drawingControl[]': 'drawing.DrawingMode',
  'drawingControlOptions.position': 'Position',
  'drawingControlOptions.style': 'drawing.DrawingStyle',
};

const OPTIONS = [
  'drawingControl',
  'drawingControlOptions',
  'drawingMode',
  'controlPointOptions',
  'rectangleOptions',
  'ellipseOptions',
  'polylineOptions',
  'arrowlineOptions',
  'polygonOptions',
  'markerOptions',
] as const;

export function DrawingManager(props: DrawingManagerProps) {
  const navermaps = useNavermaps();
  requireSubmodule(navermaps, 'drawing', 'DrawingManager');
  return <DrawingManagerInner {...props} />;
}

function DrawingManagerInner({ ref, ...given }: DrawingManagerProps) {
  const navermaps = useNavermaps();
  const props = resolveConstants(
    navermaps,
    given,
    DRAWING_CONSTANTS,
    'DrawingManager',
  );
  const map = useMap();
  const options = pick(props, OPTIONS);

  // 도구 막대는 지도 컨트롤이라 지도가 준비된 뒤 붙인다(lifetime.ts onReadyMap).
  // SDK 는 지도에서 떼면 drawingMode 를 HAND(0)로 되돌리고 다시 붙여도 그대로 둔다(3.10.5 실측).
  // 다시 붙일 때(숨겼다 보일 때, StrictMode 재실행) prop 의 drawingMode 로 맞춘다.
  // resolveConstants 를 거쳐 SDK 값이다.
  const drawingMode = props.drawingMode as
    | naver.maps.drawing.DrawingMode
    | undefined;
  const spec = onReadyMap<Manager>(
    map,
    () =>
      new navermaps.drawing.DrawingManager(
        omitUndefined(options) as naver.maps.drawing.DrawingOptions,
      ),
    (manager, host) => {
      manager.setMap(host);
      if (
        drawingMode !== undefined &&
        manager.getOptions('drawingMode') !== drawingMode
      ) {
        manager.setOptions('drawingMode', drawingMode);
      }
    },
  );
  // 버릴 때는 SDK 의 destroy 로 도구 막대, 메뉴, 리스너를 정리한다.
  const manager = useSdkInstance<Manager>({
    ...spec,
    dispose: (instance) => {
      spec.dispose(instance);
      instance.destroy();
    },
  });

  useImperativeHandle(ref, () => manager!, [manager]);

  if (!manager) return null;
  return <DrawingManagerBindings manager={manager} props={props} />;
}

function DrawingManagerBindings({
  manager,
  props,
}: {
  manager: Manager;
  props: DrawingManagerProps;
}) {
  const navermaps = useNavermaps();
  useControlledProps(manager, pick(props, OPTIONS));

  const { DrawingEvents } = navermaps.drawing;
  // SDK 이벤트 이름은 DrawingEvents 에서 읽는다. 문서의 drawing_start, drawing_cancled 는
  // 3.10.5 의 SDK 가 이름만 정의하고 내지 않아 prop 을 두지 않는다(maps-drawing 1.1.1 확인).
  useOverlayEvents(manager, props, [
    [DrawingEvents.ADD, 'onDrawingAdded'],
    [DrawingEvents.REMOVE, 'onDrawingRemoved'],
    [DrawingEvents.SELECT, 'onDrawingSelected'],
    ['drawingMode_changed', 'onDrawingModeChanged'],
  ]);

  return null;
}
