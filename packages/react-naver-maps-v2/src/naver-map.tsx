'use client';

import type { ReactNode, Ref } from 'react';
import {
  use,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useControlledKVO, kvoEquals } from './hooks/use-controlled-kvo.js';
import { ContainerContext } from './contexts/container.js';
import { NaverMapContext } from './contexts/naver-map.js';
import { omitUndefined } from './utils/omit-undefined.js';

/** 네이버 지도를 렌더링한다. Container 내부에서 사용해야 한다. */
export interface NaverMapProps {
  ref?: Ref<naver.maps.Map>;
  children?: ReactNode;

  // Controlled KVO
  center?: naver.maps.Coord | naver.maps.CoordLiteral;
  zoom?: number;
  bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;
  mapTypeId?: naver.maps.MapTypeId;
  size?: naver.maps.Size | naver.maps.SizeLiteral;
  centerPoint?: naver.maps.Point | naver.maps.PointLiteral;

  // Uncontrolled defaults
  defaultCenter?: naver.maps.Coord | naver.maps.CoordLiteral;
  defaultZoom?: number;
  defaultBounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;
  defaultMapTypeId?: naver.maps.MapTypeId;
  defaultSize?: naver.maps.Size | naver.maps.SizeLiteral;
  defaultCenterPoint?: naver.maps.Point | naver.maps.PointLiteral;

  // Static options (생성 시에만 적용)
  minZoom?: number;
  maxZoom?: number;
  logoControl?: boolean;

  // Controlled options (런타임 변경 가능)
  background?: string;
  baseTileOpacity?: number;
  draggable?: boolean;
  scrollWheel?: boolean;
  pinchZoom?: boolean;
  keyboardShortcuts?: boolean;
  disableDoubleClickZoom?: boolean;
  disableDoubleTapZoom?: boolean;
  disableTwoFingerTapZoom?: boolean;
  disableKineticPan?: boolean;
  tileTransition?: boolean;
  logoControlOptions?: naver.maps.LogoControlOptions;
  mapDataControl?: boolean;
  mapDataControlOptions?: naver.maps.MapDataControlOptions;
  mapTypeControl?: boolean;
  mapTypeControlOptions?: naver.maps.MapTypeControlOptions;
  scaleControl?: boolean;
  scaleControlOptions?: naver.maps.ScaleControlOptions;
  zoomControl?: boolean;
  zoomControlOptions?: naver.maps.ZoomControlOptions;
  mapTypes?: naver.maps.MapTypeRegistry;
  maxBounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;
  padding?: naver.maps.padding;
  resizeOrigin?: naver.maps.Position;
  overlayZoomEffect?: string | null;
  tileSpare?: number;
  zoomOrigin?: naver.maps.Coord | naver.maps.CoordLiteral;
  blankTileImage?: string | null;

  // KVO changed 이벤트
  onCenterChanged?: (center: naver.maps.Coord) => void;
  onZoomChanged?: (zoom: number) => void;
  onBoundsChanged?: (bounds: naver.maps.Bounds) => void;
  onMapTypeIdChanged?: (mapTypeId: naver.maps.MapTypeId) => void;
  onSizeChanged?: (value: naver.maps.Size) => void;
  onCenterPointChanged?: (value: naver.maps.Point) => void;
  onMapTypeChanged?: (value: naver.maps.MapType) => void;

  // 맵 라이프사이클 이벤트
  onInit?: () => void;
  onIdle?: () => void;
  onPanning?: () => void;
  onZooming?: () => void;
  onTilesloaded?: () => void;
  onResize?: () => void;
  onProjectionChanged?: () => void;
  onAddLayer?: () => void;
  onRemoveLayer?: () => void;

  // 마우스 이벤트
  onClick?: (e: naver.maps.PointerEvent) => void;
  onDblclick?: (e: naver.maps.PointerEvent) => void;
  onRightclick?: (e: naver.maps.PointerEvent) => void;
  onMousedown?: (e: naver.maps.PointerEvent) => void;
  onMouseup?: (e: naver.maps.PointerEvent) => void;
  onMouseover?: (e: naver.maps.PointerEvent) => void;
  onMouseout?: (e: naver.maps.PointerEvent) => void;
  onMousemove?: (e: naver.maps.PointerEvent) => void;

  // 드래그 이벤트
  onDragstart?: (e: naver.maps.PointerEvent) => void;
  onDrag?: (e: naver.maps.PointerEvent) => void;
  onDragend?: (e: naver.maps.PointerEvent) => void;

  // 터치 이벤트
  onTouchstart?: (e: naver.maps.PointerEvent) => void;
  onTouchmove?: (e: naver.maps.PointerEvent) => void;
  onTouchend?: (e: naver.maps.PointerEvent) => void;

  // 핀치 이벤트
  onPinchstart?: (e: naver.maps.PointerEvent) => void;
  onPinch?: (e: naver.maps.PointerEvent) => void;
  onPinchend?: (e: naver.maps.PointerEvent) => void;

  // 모바일 탭 이벤트
  onTap?: (e: naver.maps.PointerEvent) => void;
  onLongtap?: (e: naver.maps.PointerEvent) => void;
  onTwofingertap?: (e: naver.maps.PointerEvent) => void;
  onDoubletap?: (e: naver.maps.PointerEvent) => void;

  // 키보드 이벤트
  onKeydown?: (e: naver.maps.PointerEvent) => void;
  onKeyup?: (e: naver.maps.PointerEvent) => void;
}

export function NaverMap({ ref, children, ...props }: NaverMapProps) {
  const navermaps = useNavermaps();
  const container = use(ContainerContext);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);

  // Map 생성: DOM commit 후 layout effect에서 수행 (paint 전)
  useLayoutEffect(() => {
    if (!container) {
      throw new Error('NaverMap must be used within <Container>');
    }

    // bounds가 있으면 center/zoom 대신 bounds로 초기화
    const initialBounds = props.bounds ?? props.defaultBounds;

    const instance = new navermaps.Map(
      container,
      omitUndefined({
        center: initialBounds
          ? undefined
          : (props.center ?? props.defaultCenter),
        zoom: initialBounds
          ? undefined
          : (props.zoom ?? props.defaultZoom ?? 16),
        bounds: initialBounds,
        mapTypeId: props.mapTypeId ?? props.defaultMapTypeId,
        size: props.size ?? props.defaultSize,
        minZoom: props.minZoom,
        maxZoom: props.maxZoom,
        background: props.background,
        baseTileOpacity: props.baseTileOpacity,
        draggable: props.draggable,
        scrollWheel: props.scrollWheel,
        pinchZoom: props.pinchZoom,
        keyboardShortcuts: props.keyboardShortcuts,
        disableDoubleClickZoom: props.disableDoubleClickZoom,
        disableDoubleTapZoom: props.disableDoubleTapZoom,
        disableTwoFingerTapZoom: props.disableTwoFingerTapZoom,
        disableKineticPan: props.disableKineticPan,
        tileTransition: props.tileTransition,
        logoControl: props.logoControl,
        logoControlOptions: props.logoControlOptions,
        mapDataControl: props.mapDataControl,
        mapDataControlOptions: props.mapDataControlOptions,
        mapTypeControl: props.mapTypeControl,
        mapTypeControlOptions: props.mapTypeControlOptions,
        scaleControl: props.scaleControl,
        scaleControlOptions: props.scaleControlOptions,
        zoomControl: props.zoomControl,
        zoomControlOptions: props.zoomControlOptions,
        mapTypes: props.mapTypes,
        maxBounds: props.maxBounds,
        padding: props.padding,
        resizeOrigin: props.resizeOrigin,
        overlayZoomEffect: props.overlayZoomEffect,
        tileSpare: props.tileSpare,
        zoomOrigin: props.zoomOrigin,
        blankTileImage: props.blankTileImage,
      }),
    );
    // centerPoint는 MapOptions에 정의되지 않으므로 생성 후 직접 설정
    const initialCenterPoint = props.centerPoint ?? props.defaultCenterPoint;
    if (initialCenterPoint) {
      instance.setCenterPoint(initialCenterPoint);
    }

    mapRef.current = instance;
    setMap(instance);

    return () => {
      naver.maps?.Event?.clearInstanceListeners(instance);
      instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => mapRef.current!);

  if (!map) return null;

  return (
    <NaverMapContext value={map}>
      <NaverMapInner map={map} {...props}>
        {children}
      </NaverMapInner>
    </NaverMapContext>
  );
}

interface NaverMapInnerProps extends Omit<NaverMapProps, 'ref'> {
  map: naver.maps.Map;
}

function NaverMapInner({ map, children, ...props }: NaverMapInnerProps) {
  // =========================================================================
  // 고주기 KVO: center/zoom/bounds 전용 dirty diff
  //
  // useControlledKVO를 쓰지 않는 이유:
  // 1. center+zoom 동시 변경 시 개별 setter로 처리하면 지도가 튕김.
  //    네이버맵 내부에서 setCenter() + setZoom() 개별 호출 시 각각
  //    _stopTransition() + KVO 이벤트 발화 → 중간 상태 렌더.
  //    morph(center, zoom)로 원자적 처리 필요.
  //
  // 2. setCenter()는 진행 중인 관성 패닝/panTo 애니메이션을 강제 중단한다.
  //    panTo(coord, {duration: 0})를 대신 사용.
  //
  // 3. bounds → center+zoom → center → zoom 우선순위가 있어서
  //    단일 useLayoutEffect에서 통합 처리해야 함.
  //    (v1 패턴: tmp/react-naver-maps/src/naver-map.tsx L346-377)
  //
  // dirty diff 전략 (v1 getDirtyKVOs 패턴):
  // - prevRef: 이전 렌더의 prop 참조를 저장
  // - prop === prev (참조 동일) → 사용자가 prop을 안 바꿈 → skip (빠른 경로)
  //   이것은 controlled center + onCenterChanged 시 중요:
  //   사용자 드래그 → center_changed → onCenterChanged(coord) → setState(coord)
  //   → 같은 참조가 다시 내려옴 → prevRef === prop → skip → 불필요한 panTo 방지
  // - kvoEquals(map.getX(), prop) → 값이 같으면 skip (느린 경로)
  // =========================================================================
  const isFirstRef = useRef(true);
  const prevRef = useRef({
    center: props.center,
    zoom: props.zoom,
    bounds: props.bounds,
    centerPoint: props.centerPoint,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }

    const prev = prevRef.current;
    const dirties: {
      center?: naver.maps.Coord | naver.maps.CoordLiteral;
      zoom?: number;
      bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;
      centerPoint?: naver.maps.Point | naver.maps.PointLiteral;
    } = {};

    if (props.center !== undefined && props.center !== prev.center) {
      if (!kvoEquals(map.getCenter(), props.center))
        dirties.center = props.center;
    }
    if (props.zoom !== undefined && props.zoom !== prev.zoom) {
      if (map.getZoom() !== props.zoom) dirties.zoom = props.zoom;
    }
    if (props.bounds !== undefined && props.bounds !== prev.bounds) {
      if (!kvoEquals(map.getBounds(), props.bounds))
        dirties.bounds = props.bounds;
    }
    if (
      props.centerPoint !== undefined &&
      props.centerPoint !== prev.centerPoint
    ) {
      if (!kvoEquals(map.getCenterPoint(), props.centerPoint))
        dirties.centerPoint = props.centerPoint;
    }

    // 우선순위 기반 setter — 순서가 중요함
    // bounds > center+zoom(morph) > centerPoint(setCenterPoint) > center(panTo) > zoom(setZoom)
    if (dirties.bounds) {
      map.fitBounds(dirties.bounds);
    } else if (dirties.center && dirties.zoom) {
      // morph: center+zoom을 원자적으로 변경. CSS transform으로 시각적 줌 처리 후
      // 완료 시에만 KVO 일괄 발화. 개별 set보다 부드럽고 중간 상태 없음.
      map.morph(dirties.center, dirties.zoom);
    } else if (dirties.centerPoint) {
      map.setCenterPoint(dirties.centerPoint);
    } else if (dirties.center) {
      // panTo 사용 이유: setCenter()는 _stopTransition()을 호출하여
      // 드래그 중 관성 패닝을 강제 중단. panTo는 트랜지션을 관리하면서 이동.
      // duration: 0으로 즉시 이동 (애니메이션 없이).
      map.panTo(dirties.center, { duration: 0 });
    } else if (dirties.zoom) {
      map.setZoom(dirties.zoom);
    }

    prevRef.current = {
      center: props.center,
      zoom: props.zoom,
      bounds: props.bounds,
      centerPoint: props.centerPoint,
    };
  });

  // =========================================================================
  // 저주기 KVO: useControlledKVO 유지
  //
  // draggable, scrollWheel 등은 사용자가 UI 버튼으로 토글하는 정도.
  // 드래그 중 변경되지 않으므로 useControlledKVO의 매 렌더 비교가 문제되지 않음.
  // =========================================================================
  useControlledKVO(map, 'mapTypeId', props.mapTypeId);
  useControlledKVO(map, 'size', props.size);
  useControlledKVO(map, 'background', props.background);
  useControlledKVO(map, 'baseTileOpacity', props.baseTileOpacity);
  useControlledKVO(map, 'draggable', props.draggable);
  useControlledKVO(map, 'scrollWheel', props.scrollWheel);
  useControlledKVO(map, 'pinchZoom', props.pinchZoom);
  useControlledKVO(map, 'keyboardShortcuts', props.keyboardShortcuts);
  useControlledKVO(map, 'disableDoubleClickZoom', props.disableDoubleClickZoom);
  useControlledKVO(map, 'disableDoubleTapZoom', props.disableDoubleTapZoom);
  useControlledKVO(
    map,
    'disableTwoFingerTapZoom',
    props.disableTwoFingerTapZoom,
  );
  useControlledKVO(map, 'disableKineticPan', props.disableKineticPan);
  useControlledKVO(map, 'tileTransition', props.tileTransition);
  useControlledKVO(map, 'logoControlOptions', props.logoControlOptions);
  useControlledKVO(map, 'scaleControl', props.scaleControl);
  useControlledKVO(map, 'scaleControlOptions', props.scaleControlOptions);
  useControlledKVO(map, 'mapDataControl', props.mapDataControl);
  useControlledKVO(map, 'mapDataControlOptions', props.mapDataControlOptions);
  useControlledKVO(map, 'mapTypeControl', props.mapTypeControl);
  useControlledKVO(map, 'mapTypeControlOptions', props.mapTypeControlOptions);
  useControlledKVO(map, 'zoomControl', props.zoomControl);
  useControlledKVO(map, 'zoomControlOptions', props.zoomControlOptions);
  useControlledKVO(map, 'mapTypes', props.mapTypes);
  useControlledKVO(map, 'maxBounds', props.maxBounds);
  useControlledKVO(map, 'padding', props.padding);
  useControlledKVO(map, 'resizeOrigin', props.resizeOrigin);
  useControlledKVO(map, 'overlayZoomEffect', props.overlayZoomEffect);
  useControlledKVO(map, 'tileSpare', props.tileSpare);
  useControlledKVO(map, 'zoomOrigin', props.zoomOrigin);
  useControlledKVO(map, 'blankTileImage', props.blankTileImage);

  // Events
  useEffect(() => {
    const add = naver.maps.Event.addListener;
    const ls: naver.maps.MapEventListener[] = [];

    // KVO changed
    if (props.onCenterChanged)
      ls.push(add(map, 'center_changed', props.onCenterChanged));
    if (props.onZoomChanged)
      ls.push(add(map, 'zoom_changed', props.onZoomChanged));
    if (props.onBoundsChanged)
      ls.push(add(map, 'bounds_changed', props.onBoundsChanged));
    if (props.onMapTypeIdChanged)
      ls.push(add(map, 'mapTypeId_changed', props.onMapTypeIdChanged));
    if (props.onSizeChanged)
      ls.push(add(map, 'size_changed', props.onSizeChanged));
    if (props.onCenterPointChanged)
      ls.push(add(map, 'centerPoint_changed', props.onCenterPointChanged));
    if (props.onMapTypeChanged)
      ls.push(add(map, 'mapType_changed', props.onMapTypeChanged));

    // 라이프사이클
    if (props.onInit) ls.push(add(map, 'init', props.onInit));
    if (props.onIdle) ls.push(add(map, 'idle', props.onIdle));
    if (props.onPanning) ls.push(add(map, 'panning', props.onPanning));
    if (props.onZooming) ls.push(add(map, 'zooming', props.onZooming));
    if (props.onTilesloaded)
      ls.push(add(map, 'tilesloaded', props.onTilesloaded));
    if (props.onResize) ls.push(add(map, 'resize', props.onResize));
    if (props.onProjectionChanged)
      ls.push(add(map, 'projection_changed', props.onProjectionChanged));
    if (props.onAddLayer) ls.push(add(map, 'addLayer', props.onAddLayer));
    if (props.onRemoveLayer)
      ls.push(add(map, 'removeLayer', props.onRemoveLayer));

    // 마우스
    if (props.onClick) ls.push(add(map, 'click', props.onClick));
    if (props.onDblclick) ls.push(add(map, 'dblclick', props.onDblclick));
    if (props.onRightclick) ls.push(add(map, 'rightclick', props.onRightclick));
    if (props.onMousedown) ls.push(add(map, 'mousedown', props.onMousedown));
    if (props.onMouseup) ls.push(add(map, 'mouseup', props.onMouseup));
    if (props.onMouseover) ls.push(add(map, 'mouseover', props.onMouseover));
    if (props.onMouseout) ls.push(add(map, 'mouseout', props.onMouseout));
    if (props.onMousemove) ls.push(add(map, 'mousemove', props.onMousemove));

    // 드래그
    if (props.onDragstart) ls.push(add(map, 'dragstart', props.onDragstart));
    if (props.onDrag) ls.push(add(map, 'drag', props.onDrag));
    if (props.onDragend) ls.push(add(map, 'dragend', props.onDragend));

    // 터치
    if (props.onTouchstart) ls.push(add(map, 'touchstart', props.onTouchstart));
    if (props.onTouchmove) ls.push(add(map, 'touchmove', props.onTouchmove));
    if (props.onTouchend) ls.push(add(map, 'touchend', props.onTouchend));

    // 핀치
    if (props.onPinchstart) ls.push(add(map, 'pinchstart', props.onPinchstart));
    if (props.onPinch) ls.push(add(map, 'pinch', props.onPinch));
    if (props.onPinchend) ls.push(add(map, 'pinchend', props.onPinchend));

    // 모바일 탭
    if (props.onTap) ls.push(add(map, 'tap', props.onTap));
    if (props.onLongtap) ls.push(add(map, 'longtap', props.onLongtap));
    if (props.onTwofingertap)
      ls.push(add(map, 'twofingertap', props.onTwofingertap));
    if (props.onDoubletap) ls.push(add(map, 'doubletap', props.onDoubletap));

    // 키보드
    if (props.onKeydown) ls.push(add(map, 'keydown', props.onKeydown));
    if (props.onKeyup) ls.push(add(map, 'keyup', props.onKeyup));

    return () => {
      ls.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    map,
    // KVO changed
    props.onCenterChanged,
    props.onZoomChanged,
    props.onBoundsChanged,
    props.onMapTypeIdChanged,
    props.onSizeChanged,
    props.onCenterPointChanged,
    props.onMapTypeChanged,
    // 라이프사이클
    props.onInit,
    props.onIdle,
    props.onPanning,
    props.onZooming,
    props.onTilesloaded,
    props.onResize,
    props.onProjectionChanged,
    props.onAddLayer,
    props.onRemoveLayer,
    // 마우스
    props.onClick,
    props.onDblclick,
    props.onRightclick,
    props.onMousedown,
    props.onMouseup,
    props.onMouseover,
    props.onMouseout,
    props.onMousemove,
    // 드래그
    props.onDragstart,
    props.onDrag,
    props.onDragend,
    // 터치
    props.onTouchstart,
    props.onTouchmove,
    props.onTouchend,
    // 핀치
    props.onPinchstart,
    props.onPinch,
    props.onPinchend,
    // 모바일 탭
    props.onTap,
    props.onLongtap,
    props.onTwofingertap,
    props.onDoubletap,
    // 키보드
    props.onKeydown,
    props.onKeyup,
  ]);

  return <>{children}</>;
}
