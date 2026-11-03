'use client';

// SDK drawing 서브모듈(naver.maps.drawing)의 DrawingManager.
// <NavermapsProvider submodules={['drawing']}> 로 불러야 한다.
import type { Ref } from 'react';
import { useEffect, useImperativeHandle } from 'react';
import { useNavermaps } from '../core/hooks/use-navermaps.js';
import { useMap } from '../core/hooks/use-map.js';
import { useControlledProps } from '../core/hooks/use-controlled-kvo.js';
import { onReadyMap, useSdkInstance } from '../core/lifetime.js';
import { omitUndefined } from '../core/utils/omit-undefined.js';
import { addMapListener, removeMapListener } from '../core/utils/sdk.js';
import type { MapListener } from '../core/utils/sdk.js';
import { requireSubmodule } from '../core/utils/submodule.js';

type Manager = naver.maps.drawing.DrawingManager;
/** 그린 도형. 모드에 따라 Rectangle, Ellipse, Polyline, Polygon, Marker 다. */
export type DrawingOverlay =
  | naver.maps.Rectangle
  | naver.maps.Ellipse
  | naver.maps.Polyline
  | naver.maps.Polygon
  | naver.maps.Marker;

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
  /** 도구 막대에 보일 모드. `navermaps.drawing.DrawingMode` 값. */
  drawingControl?: naver.maps.drawing.DrawingMode[];
  drawingControlOptions?: naver.maps.drawing.DrawingControlOptions;
  /**
   * 지금 모드. 다른 controlled prop 과 같이, 사용자가 도구 막대로 바꿔도 다시 렌더하면 이 값으로
   * 돌아간다. 받아들이려면 `onDrawingModeChanged` 로 상태를 갱신한다.
   */
  drawingMode?: naver.maps.drawing.DrawingMode;
  controlPointOptions?: Record<string, unknown>;
  rectangleOptions?: naver.maps.RectangleOptions;
  ellipseOptions?: naver.maps.EllipseOptions;
  polylineOptions?: naver.maps.PolylineOptions;
  arrowlineOptions?: naver.maps.PolylineOptions;
  polygonOptions?: naver.maps.PolygonOptions;
  markerOptions?: naver.maps.MarkerOptions;
  onDrawingStart?: (overlay: DrawingOverlay) => void;
  onDrawingAdded?: (overlay: DrawingOverlay) => void;
  onDrawingRemoved?: (overlay: DrawingOverlay) => void;
  onDrawingCanceled?: (overlay: DrawingOverlay) => void;
  onDrawingSelected?: (overlay: DrawingOverlay) => void;
  onDrawingModeChanged?: (mode: naver.maps.drawing.DrawingMode) => void;
}

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

function DrawingManagerInner({ ref, ...props }: DrawingManagerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const options = Object.fromEntries(OPTIONS.map((k) => [k, props[k]]));

  // 도구 막대는 지도 컨트롤이라 지도가 준비된 뒤 붙인다(lifetime.ts onReadyMap).
  const spec = onReadyMap<Manager>(
    map,
    () =>
      new navermaps.drawing.DrawingManager(
        omitUndefined(options) as naver.maps.drawing.DrawingOptions,
      ),
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
  useControlledProps(
    manager,
    Object.fromEntries(OPTIONS.map((k) => [k, props[k]])),
  );

  const { DrawingEvents } = navermaps.drawing;
  // SDK 이벤트 이름은 DrawingEvents 에서 읽는다(취소는 SDK 에서 `drawing_cancled` 다).
  const bindings: [string, ((overlay: DrawingOverlay) => void) | undefined][] =
    [
      [DrawingEvents.START, props.onDrawingStart],
      [DrawingEvents.ADD, props.onDrawingAdded],
      [DrawingEvents.REMOVE, props.onDrawingRemoved],
      [DrawingEvents.CANCLE, props.onDrawingCanceled],
      [DrawingEvents.SELECT, props.onDrawingSelected],
      ['drawingMode_changed', props.onDrawingModeChanged as never],
    ];
  const handlers = bindings.map(([, h]) => h);
  useEffect(() => {
    const listeners: MapListener[] = [];
    for (const [event, handler] of bindings) {
      if (handler) listeners.push(addMapListener(manager, event, handler));
    }
    return () => listeners.forEach((l) => removeMapListener(l));
    // 핸들러 목록을 펼쳐 deps 로 쓴다. 길이는 6 으로 렌더마다 같다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, ...handlers]);

  return null;
}
