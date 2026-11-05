'use client';

import type { ReactNode, Ref } from 'react';
import {
  use,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useNavermaps } from '../hooks/use-navermaps.js';
import {
  kvoEquals,
  useControlledProps,
} from '../binding/use-controlled-kvo.js';
import { isDev, useStaticProps } from '../binding/use-static-prop.js';
import {
  MAP_CONSTANTS,
  MAP_EVENTS,
  MAP_LIFECYCLE_EVENTS,
  MAP_OPTION_PROPS,
  MAP_STATIC_PROPS,
  MAP_SYNCED_PROPS,
} from './naver-map-options.js';
import { useOverlayEvents } from '../overlays/overlay-spec.js';
import type {
  ControlOptionsProp,
  MapTypeControlOptionsProp,
  MapTypeIdProp,
  ZoomControlOptionsProp,
} from '../sdk/sdk-options.js';
import { ContainerContext } from './container-context.js';
import { NaverMapContext } from './naver-map-context.js';
import { PanoramaHostContext } from '../overlays/overlay-host-context.js';
import { ClientOptionsContext } from '../sdk/client-options-context.js';
import { useSdkInstance } from '../binding/lifetime.js';
import { EchoLog } from './camera/echo.js';
import { useMapTypeProps } from './use-map-types.js';
import { FOLLOW_MS, planCamera } from './camera/plan.js';
import { omitUndefined } from '../binding/omit-undefined.js';
import { pick } from '../binding/pick.js';
import { resolveConstants } from '../sdk/constants.js';
import {
  addMapListener,
  sdkAlive,
  removeMapListener,
  clearMapListeners,
} from '../sdk/listeners.js';

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
   * SDK에 `setTileDuration`/`tileDuration_changed`가 없고 타일을 만들 때만 읽으므로
   * (SDK 3.10.5) 런타임 변경이 무시된다. 생성자에만 적용한다.
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

export function NaverMap({ ref, children, ...given }: NaverMapProps) {
  const navermaps = useNavermaps();
  // 컨트롤 옵션의 상수 이름('TOP_RIGHT')을 SDK 값으로 바꾼다. 생성 옵션과 값 동기화 모두 바꾼 값을 쓴다.
  const props = resolveConstants(navermaps, given, MAP_CONSTANTS, 'NaverMap');
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
        // 리터럴은 SDK 객체로 바꿔 넘긴다. SDK 는 리터럴을 지금 지도 유형의 투영으로 바꾸는데,
        // 투영을 생략한 사용자 지도 유형이면 그 자리에서 던진다(3.10.5 실측).
        center: initialBounds
          ? undefined
          : optionalCoord(props.center ?? props.defaultCenter),
        zoom: initialBounds
          ? undefined
          : (props.zoom ?? props.defaultZoom ?? 16),
        bounds: initialBounds,
        mapTypeId: props.mapTypeId ?? props.defaultMapTypeId,
        size: props.size ?? props.defaultSize,
        ...pick(
          props,
          MAP_OPTION_PROPS.map(([k]) => k),
        ),
        // 옵션 타입은 공식 문서를 따라 @types 3.9.2 보다 넓다(sdk/sdk-options.ts). SDK 는 그대로 받는다.
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
      {/* 거리뷰 안에 둔 지도의 오버레이가 거리뷰에 붙지 않게 Panorama 문맥을 비운다. */}
      <PanoramaHostContext value={null}>
        <NaverMapInner map={map} {...props}>
          {children}
        </NaverMapInner>
      </PanoramaHostContext>
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
    return () => {
      listeners.forEach((l) => removeMapListener(l));
      // 숨길 때(Activity hidden, Suspense 재중단)도 여기로 온다. 리스너를 뗀 동안에는 제스처가
      // 끝나는 것을 못 보므로 제스처 상태를 비운다. 남겨 두면 다시 보인 뒤 카메라 prop 을 계속
      // 보류한다. 보류한 prop 은 다시 붙인 뒤의 렌더(lifetime.ts)가 맞춘다.
      gestureRef.current = 'none';
    };
  }, [map]);

  const isFirstRef = useRef(true);
  // 지도에 요청했지만 아직 반영되지 않은 center. panTo 는 duration 0 이어도 다음 프레임에
  // 적용되므로, 그 사이 들어온 prop 은 getCenter() 가 아니라 이 값과 비교해야 한다.
  const requestedCenterRef = useRef<
    naver.maps.Coord | naver.maps.CoordLiteral | null
  >(null);
  // 지도가 최근에 보고한 center·zoom(되울림 기록, map/camera/echo.ts).
  const [echo] = useState(() => new EchoLog<naver.maps.Coord>());
  // 라이브러리가 마지막으로 카메라를 옮긴 시각(performance.now). map/camera/plan.ts FOLLOW_MS 참고.
  const lastCameraWriteAtRef = useRef(Number.NEGATIVE_INFINITY);
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

    const now = performance.now();
    const gl = isGl(map);
    const plan = planCamera({
      prev: prevRef.current,
      next: props,
      map: {
        center: () => map.getCenter(),
        zoom: () => map.getZoom(),
        bounds: () => map.getBounds(),
        centerPoint: () => map.getCenterPoint(),
        gl,
        sameOnScreen: (a, b, zoom) => sameOnScreen(map, a, b, zoom),
      },
      isCenterEcho: (center, zoom) =>
        echo.isCenterEcho(now, (r) => sameOnScreen(map, r, center, zoom)),
      isZoomEcho: (zoom) => echo.isZoomEcho(zoom, now),
      pendingMove: requestedCenterRef.current !== null,
      gesture: gestureRef.current,
      following: now - lastCameraWriteAtRef.current < FOLLOW_MS,
    });

    if (plan.stop) {
      map.stop();
      requestedCenterRef.current = null;
    }
    if (plan.kind === 'hold') {
      if (plan.held) heldRef.current = true;
      return;
    }
    if (plan.kind === 'move') {
      lastCameraWriteAtRef.current = now;
      const c = plan.command;
      switch (c.kind) {
        case 'fitBounds':
          map.fitBounds(c.bounds);
          break;
        case 'morph':
          // center 와 zoom 을 한 번에 옮긴다. 개별 set 보다 부드럽고 중간 상태가 없다.
          requestedCenterRef.current = c.center;
          if (c.animate) map.morph(toCoord(c.center), c.zoom);
          else map.morph(toCoord(c.center), c.zoom, { duration: 0 });
          break;
        case 'setCenterPoint':
          map.setCenterPoint(c.centerPoint);
          break;
        case 'panTo':
          // panTo 는 duration 0 이어도 다음 프레임에 반영된다. 그 사이 온 prop 은 requestedCenterRef 로 안다.
          requestedCenterRef.current = c.center;
          map.panTo(toCoord(c.center), { duration: 0 });
          break;
        case 'setZoom':
          map.setZoom(c.zoom);
          break;
      }
    }

    prevRef.current = {
      center: props.center,
      zoom: props.zoom,
      bounds: props.bounds,
      centerPoint: props.centerPoint,
    };
  });

  // 생성자만 읽는 prop. 바꾸면 개발 모드에서 경고한다.
  useStaticProps('NaverMap', pick(props, MAP_STATIC_PROPS));

  // GL 은 gl 서브모듈을 불러야 하고 다른 서브모듈과 함께 쓰지 않는다(공식 문서 "GL 생성 및 기본 동작").
  const clientOptions = use(ClientOptionsContext);
  const glWanted = props.gl;
  useEffect(() => {
    if (!isDev || !glWanted || !clientOptions) return;
    const subs = clientOptions.submodules ?? [];
    if (!subs.includes('gl')) {
      // eslint-disable-next-line no-console
      console.warn(
        "[react-naver-maps] NaverMap 의 gl 은 gl 서브모듈이 있어야 적용된다. <NavermapsProvider submodules={['gl']}> 로 불러온다.",
      );
    } else if (subs.length > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        `[react-naver-maps] 공식 문서는 GL 서브모듈을 다른 서브모듈과 함께 쓰지 말라고 한다(지금: ${subs.join(', ')}).`,
      );
    }
  }, [glWanted, clientOptions]);

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

  // 카메라 밖 옵션. 바뀌면 맞추고 바깥 변경을 되돌린다(useControlledProps). 목록과 규칙은
  // naver-map-options.ts. 생성자가 cursor 를 읽지 않아 마운트 때 다르면 맞춘다.
  useControlledProps(map, pick(props, MAP_SYNCED_PROPS), {
    writeOnMount: ['cursor'],
  });
  useMapTypeProps(map, props.mapTypes, props.mapTypeId);

  // init, idle, tilesloaded 는 지도를 만들며 바로 온다. paint 뒤에 붙이면 init 을 놓칠 수 있다.
  useOverlayEvents(map, props, MAP_LIFECYCLE_EVENTS, 'layout');

  useLayoutEffect(() => {
    const listeners = [
      addMapListener(map, 'center_changed', () => {
        requestedCenterRef.current = null;
        echo.rememberCenter(map.getCenter(), performance.now());
      }),
      // gl 서브모듈에서는 이벤트 값과 getZoom() 이 1 다르다. 앱이 받는 값(getZoom)을 기억한다.
      addMapListener(map, 'zoom_changed', () => {
        echo.rememberZoom(map.getZoom(), performance.now());
      }),
    ];
    return () => listeners.forEach((l) => removeMapListener(l));
  }, [map, echo]);

  useOverlayEvents(map, props, MAP_EVENTS);

  return <>{children}</>;
}

/**
 * GL 로 그리는가. SDK 3.10.5 의 `renderMode` 는 1 이 래스터, 2 가 GL 이다. `gl: true` 여도 WebGL 을 쓸 수
 * 없으면(성능 경고가 있는 소프트웨어 렌더) SDK 가 래스터로 바꿔 1 이다. 시나리오의 `renderMode` 필드가 이 값을 본다.
 */
function isGl(map: naver.maps.Map): boolean {
  return (
    (map as unknown as { get(k: string): unknown }).get('renderMode') === 2
  );
}

/**
 * 두 좌표가 zoom 에서 화면 1px 안이면 같은 자리로 본다. 앱이 반올림해 되돌려준 center,
 * SDK 가 저장하며 생기는 미세한 차이로 지도를 움직이지 않기 위해서다.
 */
function sameOnScreen(
  map: naver.maps.Map,
  a: naver.maps.Coord | naver.maps.CoordLiteral,
  b: naver.maps.Coord | naver.maps.CoordLiteral,
  zoom: number,
): boolean {
  if (kvoEquals(a, b)) return true;
  const projection = map.getProjection();
  const pa = projection.fromCoordToOffset(toCoord(a));
  const pb = projection.fromCoordToOffset(toCoord(b));
  // 화면 좌표는 지금 zoom 의 것이다. zoom 이 1 크면 거리가 두 배다.
  const scale = 2 ** (zoom - map.getZoom());
  return Math.hypot(pa.x - pb.x, pa.y - pb.y) * scale < 1;
}

/** 좌표 리터럴을 SDK 객체로. `{ lat, lng }` 와 `[경도, 위도]` 는 LatLng, `{ x, y }` 는 Point. */
function toCoord(
  c: naver.maps.Coord | naver.maps.CoordLiteral,
): naver.maps.Coord {
  if (c instanceof naver.maps.LatLng || c instanceof naver.maps.Point) return c;
  // 배열 리터럴은 [경도, 위도] 순서다(PointArrayLiteral).
  if (Array.isArray(c)) return new naver.maps.LatLng(c[1], c[0]);
  if ('x' in c && !('lat' in c)) return new naver.maps.Point(c.x, c.y);
  const { lat, lng } = c as { lat: number; lng: number };
  return new naver.maps.LatLng(lat, lng);
}

function optionalCoord(
  c: naver.maps.Coord | naver.maps.CoordLiteral | undefined,
) {
  return c === undefined ? undefined : toCoord(c);
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
