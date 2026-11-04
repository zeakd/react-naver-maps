'use client';

import type { ReactNode, Ref } from 'react';
import {
  use,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useControlledKVO, kvoEquals } from './hooks/use-controlled-kvo.js';
import { useStaticProp, isDev } from './hooks/use-static-prop.js';
import type {
  ControlOptionsProp,
  MapTypeControlOptionsProp,
  MapTypeIdProp,
  ZoomControlOptionsProp,
} from './types/sdk-options.js';
import { ContainerContext } from './contexts/container.js';
import { NaverMapContext } from './contexts/naver-map.js';
import { useSdkInstance } from './lifetime.js';
import { omitUndefined } from './utils/omit-undefined.js';
import {
  addMapListener,
  sdkAlive,
  removeMapListener,
  clearMapListeners,
} from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';

/** 네이버 지도를 렌더링한다. Container 내부에서 사용해야 한다. */
export interface NaverMapProps {
  ref?: Ref<naver.maps.Map>;
  children?: ReactNode;

  // Controlled KVO
  center?: naver.maps.Coord | naver.maps.CoordLiteral;
  zoom?: number;
  /**
   * @deprecated 0.4 에서 deprecated, 다음 버전에서 없앤다. bounds 는 지도가 계산해 내는 값이라
   * 맞춰도 prop 과 같아지지 않는다(`fitBounds` 는 정수 zoom 으로 맞춘다). 처음 영역은
   * `defaultBounds`, 바꿀 때는 `map.fitBounds()`, 읽을 때는 `onBoundsChanged` 를 쓴다.
   */
  bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;
  mapTypeId?: MapTypeIdProp;
  size?: naver.maps.Size | naver.maps.SizeLiteral;
  /**
   * @deprecated 0.4 에서 deprecated, 다음 버전에서 없앤다. `center` 와 같은 중심을 세계 좌표로
   * 나타낸 값이라 둘을 함께 제어하면 우선순위 규칙이 필요하다. `center` 를 쓴다.
   */
  centerPoint?: naver.maps.Point | naver.maps.PointLiteral;

  // Uncontrolled defaults
  defaultCenter?: naver.maps.Coord | naver.maps.CoordLiteral;
  defaultZoom?: number;
  defaultBounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;
  defaultMapTypeId?: MapTypeIdProp;
  defaultSize?: naver.maps.Size | naver.maps.SizeLiteral;
  /** @deprecated 0.4 에서 deprecated, 다음 버전에서 없앤다. `defaultCenter` 를 쓴다. */
  defaultCenterPoint?: naver.maps.Point | naver.maps.PointLiteral;

  // Static options (생성 시에만 적용)
  /**
   * 로고 컨트롤 표시 여부. SDK 패턴: 일방향 controlled.
   * - `true`/미지정: 표시 (SDK 기본).
   * - `false`: SDK가 `setRefinedOption`에서 `value || true`로 강제 변환하여 거부.
   *
   * 즉 false로는 끌 수 없다. 위치만 바꾸려면 `logoControlOptions`를 사용한다.
   * dev에서 `false` 시도 시 console.warn으로 안내.
   */
  logoControl?: boolean;
  /**
   * X축 타일 반복(세계 일주). SDK 패턴: static.
   * 런타임 변경 시 tile system 재구성이 필요해 생성자에만 적용한다.
   */
  repeatX?: boolean;
  /**
   * GL 벡터맵 활성화. SDK 패턴: static.
   * 런타임 변경 시 SDK가 `switchTo()`로 렌더 모드 전체를 교체하므로 비싸고 위험.
   * 생성자에만 적용한다. 사용 시 GL 서브모듈을 함께 로드해야 한다.
   */
  gl?: boolean;
  /**
   * Style Editor에서 발행한 My Style ID. SDK 패턴: static (GL 모드 전용).
   * 생성자에만 적용한다.
   */
  customStyleId?: string;
  /** 스타일 맵 사용 여부. SDK 패턴: static. 생성자에만 적용한다. */
  useStyleMap?: boolean;
  /**
   * 타일 페이드 인 효과 지속 시간(ms). SDK 패턴: static.
   * SDK에 `setTileDuration`/`tileDuration_changed`가 없고 타일 인스턴스 생성 시에만
   * 읽히므로(maps.beautified.js:5568/5642/6468) 런타임 변경이 무시된다. 생성자에만 적용한다.
   */
  tileDuration?: number;

  // Controlled options (런타임 변경 가능)
  minZoom?: number;
  maxZoom?: number;

  // Controlled options (런타임 변경 가능)
  /**
   * 커서 스타일. SDK 패턴: controlled (`setCursor`/`getCursor`).
   * SDK 생성자는 cursor 옵션을 읽지 않고 "open"(손)으로 두므로 마운트 때 한 번 맞춘다.
   * SDK 는 드래그 중 커서가 "open"/"closed" 일 때만 둘을 오간다. 다른 값(crosshair 등)은 그대로 둔다.
   */
  cursor?: string;
  /** 지도 기울기(GL 모드). SDK 패턴: controlled (`setTilt`/`getTilt`, `tilt_changed`). */
  tilt?: number;
  /** 지도 회전(GL 모드). SDK 패턴: controlled (`setRotation`/`getRotation`, `rotation_changed`). */
  rotation?: number;
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
  logoControlOptions?: ControlOptionsProp;
  mapDataControl?: boolean;
  mapDataControlOptions?: ControlOptionsProp;
  mapTypeControl?: boolean;
  mapTypeControlOptions?: MapTypeControlOptionsProp;
  scaleControl?: boolean;
  scaleControlOptions?: ControlOptionsProp;
  zoomControl?: boolean;
  zoomControlOptions?: ZoomControlOptionsProp;
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
  onMapTypeIdChanged?: (
    mapTypeId: naver.maps.MapTypeId | (string & {}),
  ) => void;
  onSizeChanged?: (value: naver.maps.Size) => void;
  onCenterPointChanged?: (value: naver.maps.Point) => void;
  onMapTypeChanged?: (value: naver.maps.MapType) => void;
  onTiltChanged?: (value: number) => void;
  onRotationChanged?: (value: number) => void;

  // 맵 라이프사이클 이벤트
  onInit?: () => void;
  onIdle?: () => void;
  onPanning?: () => void;
  /** 줌 효과가 시작될 때(SDK `zoomstart`). */
  onZoomstart?: () => void;
  /** 줌 효과가 끝날 때(SDK `zoomend`). */
  onZoomend?: () => void;
  /** GL 에서 실수 줌 레벨이 바뀔 때마다(SDK `zoom`, GL 서브모듈 전용). */
  onZoom?: () => void;
  /**
   * SDK 가 zoomstart 와 함께 내는 `zooming`. 공식 문서에는 없다. 0.3 과의 호환으로 둔다.
   * 새 코드는 `onZoomstart` 를 쓴다.
   */
  onZooming?: () => void;
  onTilesloaded?: () => void;
  onResize?: () => void;
  onProjectionChanged?: () => void;
  onAddLayer?: (layer: naver.maps.Layer) => void;
  onRemoveLayer?: (layername: string) => void;

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
  onKeydown?: (e: MapKeyboardEvent) => void;
  onKeyup?: (e: MapKeyboardEvent) => void;
}

/** 지도 keydown, keyup 이벤트 인자. 공식 문서 Map Events(keyboardEvent). */
export type MapKeyboardEvent = { keyboardEvent: KeyboardEvent };

export function NaverMap({ ref, children, ...props }: NaverMapProps) {
  const navermaps = useNavermaps();
  const container = use(ContainerContext);
  const mapElementRef = useRef<HTMLElement | null>(null);

  if (!container) {
    throw new Error('NaverMap must be used within <Container>');
  }

  // 지도 수명은 lifetime.ts 규칙을 따른다. 숨길 때(Suspense 재중단, Activity hidden)는 지도
  // element 만 숨기고 같은 지도를 둔다. 다시 보일 때 크기를 다시 잰다(숨긴 동안 영역이 바뀌었을 수 있다).
  //
  // destroy 는 진짜 언마운트에서만 하고 microtask 로 미룬다. 같은 commit 에서 자식 오버레이가
  // 이 지도에서 떨어지는(setMap(null)) 정리가 지도 destroy 뒤에 오지 않게 한다.
  // StrictMode 재실행에서는 버리지 않으므로 GL 에서 지도를 바로 다시 만들어 인증 실패로
  // 표시되던 문제(#171)도 생기지 않는다.
  const map = useSdkInstance<naver.maps.Map>({
    create: () => createMap(container),
    attach: (instance) => {
      if (mapElementRef.current) mapElementRef.current.style.display = '';
      instance.autoResize();
    },
    detach: () => {
      if (mapElementRef.current) mapElementRef.current.style.display = 'none';
    },
    dispose: (instance) => {
      const el = mapElementRef.current;
      mapElementRef.current = null;
      queueMicrotask(() => {
        clearMapListeners(instance);
        if (sdkAlive()) instance.destroy();
        el?.remove();
      });
    },
  });

  function createMap(parent: HTMLElement): naver.maps.Map {
    // SDK 의 destroy 는 지도 element 의 내용을 비운다. key 로 다시 만들면 새 지도가 옛 지도의
    // destroy 보다 먼저 생기므로, element 를 나눠 쓰지 않도록 지도마다 자기 div 를 만든다.
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%';
    parent.appendChild(el);
    mapElementRef.current = el;

    // bounds가 있으면 center/zoom 대신 bounds로 초기화
    const initialBounds = props.bounds ?? props.defaultBounds;

    const instance = new navermaps.Map(
      el,
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
        cursor: props.cursor,
        tilt: props.tilt,
        rotation: props.rotation,
        tileDuration: props.tileDuration,
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
        // Static (생성자에만 적용)
        repeatX: props.repeatX,
        gl: props.gl,
        customStyleId: props.customStyleId,
        useStyleMap: props.useStyleMap,
        // 옵션 타입은 공식 문서를 따라 @types 3.9.2 보다 넓다(types/sdk-options.ts). SDK 는 그대로 받는다.
      }) as unknown as naver.maps.MapOptions,
    );
    // centerPoint는 MapOptions에 정의되지 않으므로 생성 후 직접 설정
    const initialCenterPoint = props.centerPoint ?? props.defaultCenterPoint;
    if (initialCenterPoint) {
      instance.setCenterPoint(initialCenterPoint);
    }
    return instance;
  }

  useImperativeHandle(ref, () => map!, [map]);

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

// keyof NaverMapProps로 propName 오타 방지 + value 타입 매칭 자동 추론.
//
// 정책: static prop 호출이 3회 이상이면 wrapper, 1~2회면 satisfies 패턴 사용.
// - wrapper(이 파일, 5회 호출): 호출 사이트 짧고 일관 — `useNaverMapStatic('foo', x)`
// - satisfies(CustomOverlay/TrafficLayer, 1회 호출): wrapper 추가 비용 회피 —
//   `useStaticProp('Comp', 'foo' satisfies keyof Props, x)`
// 둘 다 컴파일 시점에 propName 오타를 잡고 value 타입을 추론한다.
function useNaverMapStatic<K extends keyof NaverMapProps>(
  propName: K,
  value: NaverMapProps[K],
): void {
  useStaticProp('NaverMap', propName, value);
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
  //
  // dirty diff 전략 (v1 getDirtyKVOs 패턴):
  // - prevRef: 이전 렌더의 prop 을 저장
  // - prop 이 prev 와 값이 같음 → 사용자가 prop을 안 바꿈 → skip
  //   렌더마다 새로 만든 같은 값(`center={{ lat, lng }}`)도 바뀌지 않은 것으로 본다.
  //   카메라는 다른 prop 과 달리 바깥 변경(사용자 드래그)을 되돌리지 않는다. 0.3.0 부터 그렇다.
  //   이것은 controlled center + onCenterChanged 시 중요:
  //   사용자 드래그 → center_changed → onCenterChanged(coord) → setState(coord)
  //   → 같은 값이 다시 내려옴 → skip → 불필요한 panTo 방지
  // - kvoEquals(map.getX(), prop) → 값이 같으면 skip (느린 경로)
  // =========================================================================
  // 제스처 중 보류. 사용자가 끌거나 핀치하는 동안과 그 뒤 관성이 멈출 때(idle)까지 카메라 prop 을
  // 지도에 넣지 않는다. 앱이 onCenterChanged 값을 가공해 되돌려주면(반올림 등) 드래그 중 panTo 가
  // 지도를 그 값으로 끌어당겼다(래스터는 끌려가며, GL 은 거의 안 움직였다). 멈춘 뒤 마지막 prop 으로 맞춘다.
  // 우리가 panTo 하지 않는 동안의 idle 은 관성이 끝났다는 뜻이다. GL 의 idle 은 벡터 타일을 다
  // 받은 뒤라 네트워크만큼 늦을 수 있다.
  const gestureRef = useRef<'none' | 'active' | 'settling'>('none');
  const heldRef = useRef(false);
  const [, resumeCamera] = useReducer((n: number) => n + 1, 0);
  useLayoutEffect(() => {
    const start = () => {
      gestureRef.current = 'active';
    };
    const end = () => {
      if (gestureRef.current === 'active') gestureRef.current = 'settling';
    };
    const listeners = [
      addMapListener(map, 'dragstart', start),
      addMapListener(map, 'pinchstart', start),
      addMapListener(map, 'dragend', end),
      addMapListener(map, 'pinchend', end),
      addMapListener(map, 'idle', () => {
        if (gestureRef.current !== 'settling') return;
        gestureRef.current = 'none';
        if (heldRef.current) {
          heldRef.current = false;
          resumeCamera();
        }
      }),
    ];
    return () => listeners.forEach((l) => removeMapListener(l));
  }, [map]);

  const isFirstRef = useRef(true);
  // 지도에 요청했지만 아직 반영되지 않은 center. panTo 는 duration 0 이어도 다음 프레임에
  // 적용되므로, 그 사이 들어온 prop 은 getCenter() 가 아니라 이 값과 비교해야 한다.
  const requestedCenterRef = useRef<
    naver.maps.Coord | naver.maps.CoordLiteral | null
  >(null);
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
    if (!sdkAlive()) return;

    const prev = prevRef.current;
    const dirties: {
      center?: naver.maps.Coord | naver.maps.CoordLiteral;
      zoom?: number;
      bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral;
      centerPoint?: naver.maps.Point | naver.maps.PointLiteral;
    } = {};

    if (props.center !== undefined && !kvoEquals(props.center, prev.center)) {
      const atCenter = sameOnScreen(map, map.getCenter(), props.center);
      if (atCenter && requestedCenterRef.current) {
        // SDK 의 panTo 는 현재 위치로의 이동을 무시해 진행 중인 이동이 끝까지 간다.
        map.stop();
        requestedCenterRef.current = null;
      } else if (!atCenter) {
        dirties.center = props.center;
      }
    }
    if (props.zoom !== undefined && props.zoom !== prev.zoom) {
      if (map.getZoom() !== props.zoom) dirties.zoom = props.zoom;
    }
    if (props.bounds !== undefined && !kvoEquals(props.bounds, prev.bounds)) {
      if (!kvoEquals(map.getBounds(), props.bounds))
        dirties.bounds = props.bounds;
    }
    if (
      props.centerPoint !== undefined &&
      !kvoEquals(props.centerPoint, prev.centerPoint)
    ) {
      if (!kvoEquals(map.getCenterPoint(), props.centerPoint))
        dirties.centerPoint = props.centerPoint;
    }

    if (gestureRef.current !== 'none') {
      // prevRef 를 그대로 두어 제스처가 끝난 뒤 다시 비교하게 한다.
      if (Object.keys(dirties).length > 0) heldRef.current = true;
      return;
    }

    // 우선순위 기반 setter — 순서가 중요함
    // bounds > center+zoom(morph) > centerPoint(setCenterPoint) > center(panTo) > zoom(setZoom)
    if (dirties.bounds) {
      map.fitBounds(dirties.bounds);
    } else if (dirties.center && dirties.zoom) {
      // morph: center+zoom을 원자적으로 변경. CSS transform으로 시각적 줌 처리 후
      // 완료 시에만 KVO 일괄 발화. 개별 set보다 부드럽고 중간 상태 없음.
      requestedCenterRef.current = dirties.center;
      map.morph(dirties.center, dirties.zoom);
    } else if (dirties.centerPoint) {
      map.setCenterPoint(dirties.centerPoint);
    } else if (dirties.center) {
      // panTo 사용 이유: setCenter()는 _stopTransition()을 호출하여
      // 드래그 중 관성 패닝을 강제 중단. panTo는 트랜지션을 관리하면서 이동.
      // duration: 0으로 즉시 이동 (애니메이션 없이).
      requestedCenterRef.current = dirties.center;
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

  // Static props (마운트 시에만 적용 — 변경 시 dev에서 경고)
  // wrapper로 keyof NaverMapProps 강제 → propName 오타 시 컴파일 에러
  useNaverMapStatic('repeatX', props.repeatX);
  useNaverMapStatic('gl', props.gl);
  useNaverMapStatic('customStyleId', props.customStyleId);
  // SDK 는 빈 타일 이미지를 생성자에서만 읽는다(바꿔도 반영되지 않는다).
  useNaverMapStatic('blankTileImage', props.blankTileImage);
  useNaverMapStatic('useStyleMap', props.useStyleMap);
  useNaverMapStatic('tileDuration', props.tileDuration);

  // logoControl은 일방향 controlled — SDK가 false를 거부 (setRefinedOption: value || true).
  // false 시도 시 안내. 한 인스턴스당 한 번만 출력하도록 ref로 보호 (toggle 시 폭주 방지).
  const logoControlValue = props.logoControl;
  const logoWarnedRef = useRef(false);
  useEffect(() => {
    if (!isDev) return;
    if (logoControlValue === false && !logoWarnedRef.current) {
      logoWarnedRef.current = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[react-naver-maps] <NaverMap logoControl={false} />: SDK rejects logoControl=false (forces true internally). Logo is always visible. Use logoControlOptions to change position only.\n' +
          'SDK가 logoControl=false를 거부합니다 (내부적으로 true로 강제). 로고는 항상 표시됩니다. 위치만 변경하려면 logoControlOptions를 사용하세요.',
      );
    }
  }, [logoControlValue]);

  useDeprecatedProp('bounds', props.bounds, 'defaultBounds 와 map.fitBounds()');
  useDeprecatedProp('centerPoint', props.centerPoint, 'center');
  useDeprecatedProp(
    'defaultCenterPoint',
    props.defaultCenterPoint,
    'defaultCenter',
  );

  // =========================================================================
  // 저주기 KVO: useControlledKVO 유지
  //
  // draggable, scrollWheel 등은 사용자가 UI 버튼으로 토글하는 정도.
  // 드래그 중 변경되지 않으므로 useControlledKVO의 매 렌더 비교가 문제되지 않음.
  // =========================================================================
  useControlledKVO(map, 'mapTypeId', props.mapTypeId);
  useControlledKVO(map, 'minZoom', props.minZoom);
  useControlledKVO(map, 'maxZoom', props.maxZoom);
  useControlledKVO(map, 'size', props.size);
  useControlledKVO(map, 'cursor', props.cursor, { writeOnMount: ['cursor'] });
  useControlledKVO(map, 'tilt', props.tilt);
  useControlledKVO(map, 'rotation', props.rotation);
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

  // 라이프사이클 이벤트(init/idle/tilesloaded 등)는 SDK가 동기 또는 빠른 async로 발화.
  // useEffect(paint 후)는 1 프레임 늦어 init을 놓칠 수 있으므로 useLayoutEffect로 등록.
  useLayoutEffect(() => {
    const add = addMapListener;
    const ls: MapListener[] = [];
    if (props.onInit) ls.push(add(map, 'init', props.onInit));
    if (props.onIdle) ls.push(add(map, 'idle', props.onIdle));
    if (props.onTilesloaded)
      ls.push(add(map, 'tilesloaded', props.onTilesloaded));
    return () => {
      ls.forEach((l) => removeMapListener(l));
    };
  }, [map, props.onInit, props.onIdle, props.onTilesloaded]);

  useLayoutEffect(() => {
    const listener = addMapListener(map, 'center_changed', () => {
      requestedCenterRef.current = null;
    });
    return () => removeMapListener(listener);
  }, [map]);

  // Events
  const { onZoomChanged } = props;
  useEffect(() => {
    const add = addMapListener;
    const ls: MapListener[] = [];

    // KVO changed
    if (props.onCenterChanged)
      ls.push(add(map, 'center_changed', props.onCenterChanged));
    // gl 서브모듈을 불러오면 SDK 내부 zoom 이 1 커져 이벤트 값과 getZoom() 이 다르다.
    // getZoom() 이 사용자에게 보이는 값이므로 이 값을 넘긴다.
    if (onZoomChanged) {
      ls.push(add(map, 'zoom_changed', () => onZoomChanged(map.getZoom())));
    }
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
    if (props.onTiltChanged)
      ls.push(add(map, 'tilt_changed', props.onTiltChanged));
    if (props.onRotationChanged)
      ls.push(add(map, 'rotation_changed', props.onRotationChanged));

    // 라이프사이클 (init/idle/tilesloaded는 위 useLayoutEffect로 분리됨 — 누락 방지)
    if (props.onPanning) ls.push(add(map, 'panning', props.onPanning));
    if (props.onZoomstart) ls.push(add(map, 'zoomstart', props.onZoomstart));
    if (props.onZoomend) ls.push(add(map, 'zoomend', props.onZoomend));
    if (props.onZoom) ls.push(add(map, 'zoom', props.onZoom));
    if (props.onZooming) ls.push(add(map, 'zooming', props.onZooming));
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
      ls.forEach((l) => removeMapListener(l));
    };
  }, [
    map,
    // KVO changed
    props.onCenterChanged,
    onZoomChanged,
    props.onBoundsChanged,
    props.onMapTypeIdChanged,
    props.onSizeChanged,
    props.onCenterPointChanged,
    props.onMapTypeChanged,
    props.onTiltChanged,
    props.onRotationChanged,
    // 라이프사이클 (init/idle/tilesloaded는 위 useLayoutEffect deps로 분리됨)
    props.onPanning,
    props.onZoomstart,
    props.onZoomend,
    props.onZoom,
    props.onZooming,
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

/**
 * 두 좌표가 지금 zoom 에서 화면 1px 안이면 같은 자리로 본다. 앱이 반올림해 되돌려준 center,
 * SDK 가 저장하며 생기는 미세한 차이로 지도를 움직이지 않기 위해서다.
 */
function sameOnScreen(
  map: naver.maps.Map,
  a: naver.maps.Coord | naver.maps.CoordLiteral,
  b: naver.maps.Coord | naver.maps.CoordLiteral,
): boolean {
  if (kvoEquals(a, b)) return true;
  const projection = map.getProjection();
  const pa = projection.fromCoordToOffset(toCoord(a));
  const pb = projection.fromCoordToOffset(toCoord(b));
  return Math.hypot(pa.x - pb.x, pa.y - pb.y) < 1;
}

function toCoord(c: naver.maps.Coord | naver.maps.CoordLiteral) {
  if (c instanceof naver.maps.LatLng || c instanceof naver.maps.Point) return c;
  // 배열 리터럴은 [경도, 위도] 순서다(PointArrayLiteral).
  if (Array.isArray(c)) return new naver.maps.LatLng(c[1], c[0]);
  const { lat, lng } = c as { lat: number; lng: number };
  return new naver.maps.LatLng(lat, lng);
}

/** 개발 모드에서 deprecated prop 을 처음 받았을 때 한 번 알린다. */
function useDeprecatedProp(
  name: keyof NaverMapProps,
  value: unknown,
  instead: string,
): void {
  const warnedRef = useRef(false);
  const given = value !== undefined;
  useEffect(() => {
    if (!isDev || !given || warnedRef.current) return;
    warnedRef.current = true;
    // eslint-disable-next-line no-console
    console.warn(
      `[react-naver-maps] <NaverMap ${name}> 는 0.4 에서 deprecated 이고 다음 버전에서 없어집니다. ${instead} 를 쓰세요.`,
    );
  }, [name, given, instead]);
}
