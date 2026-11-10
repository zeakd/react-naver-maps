'use client';

// SDK panorama 서브모듈의 Panorama(거리뷰).
// <NavermapsProvider submodules={['panorama']}> 로 불러야 한다.
import type { ReactNode, Ref } from 'react';
import { resolveConstants } from '../sdk/constants.js';
import type { ConstantPaths } from '../sdk/constants.js';
import type {
  ControlOptionsProp,
  ZoomControlOptionsProp,
} from '../sdk/sdk-options.js';
import {
  use,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useMemo,
  useRef,
} from 'react';
import { ContainerContext } from '../map/container-context.js';
import { useMap } from '../hooks/use-map.js';
import { NaverMapContext } from '../map/naver-map-context.js';
import { PanoramaHostContext } from '../overlays/overlay-host-context.js';
import type { PanoramaHost } from '../overlays/overlay-host-context.js';
import { useNavermaps } from '../hooks/use-navermaps.js';
import {
  kvoEquals,
  useControlledProps,
} from '../binding/use-controlled-kvo.js';
import { onMap, useSdkInstance } from '../binding/lifetime.js';
import {
  createdOptionsOf,
  rememberCreatedOptions,
} from '../binding/created-options.js';
import { useOverlayEvents, type EventDecl } from '../overlays/overlay-spec.js';
import { omitUndefined } from '../binding/omit-undefined.js';
import { pick } from '../binding/pick.js';
import { addMapListener, clearMapListeners } from '../sdk/listeners.js';
import { requireSubmodule } from '../sdk/submodule.js';

/**
 * 거리뷰를 보여 준다. SDK 의 `naver.maps.Panorama` 다. NaverMap 처럼 `Container` 안에 둔다.
 *
 * ```tsx
 * <Container className="h-96">
 *   <Panorama position={{ lat: 37.5666, lng: 126.9784 }} onPovChanged={setPov} />
 * </Container>
 * ```
 *
 * 자리와 DOM 은 Container 가, 거리뷰 옵션과 이벤트는 Panorama 가 맡는다.
 *
 * 자식으로 `Marker`, `InfoWindow` 를 두면 거리뷰 위에 그린다(공식 튜토리얼 "파노라마에 마커").
 * 거리뷰가 준비(init)된 뒤에 붙인다. 다른 오버레이는 SDK 가 거리뷰에 붙이지 않아 에러를 낸다.
 *
 * ```tsx
 * <Panorama position={here}>
 *   <Marker position={shop} onClick={() => setOpen(true)} />
 * </Panorama>
 * ```
 */
export interface PanoramaProps {
  ref?: Ref<naver.maps.Panorama>;
  /** 거리뷰 위에 그릴 마커·정보 창. */
  children?: ReactNode;
  /**
   * 보는 곳. `position`, `pov`, `zoom`, `panoId` 는 지도의 카메라처럼 prop 이 바뀔 때만 맞춘다.
   * 사용자가 돌려 보거나 길을 눌러 옮긴 것을 다시 렌더로 되돌리지 않는다.
   */
  position?: naver.maps.LatLng | naver.maps.LatLngLiteral;
  /** 보여 줄 거리뷰 사진의 id. 좌표 대신 사진을 고를 때. */
  panoId?: string;
  /** 보는 방향(`{ pan, tilt, fov }`). prop으로 값을 관리합니다. */
  pov?: naver.maps.PanoramaPov;
  /** 거리뷰 확대 정도. */
  zoom?: number;
  /** 거리뷰를 보일지 여부. */
  visible?: boolean;
  /** 거리뷰 최소 확대 정도. */
  minZoom?: number;
  /** 거리뷰 최대 확대 정도. */
  maxZoom?: number;
  /** 최소 배율. */
  minScale?: number;
  /** 최대 배율. */
  maxScale?: number;
  /** 거리뷰 안에 항공뷰 지점 아이콘을 보일지 여부. */
  flightSpot?: boolean;
  /** 로고 컨트롤을 보일지 여부. */
  logoControl?: boolean;
  /** `position`은 이름(`'BOTTOM_RIGHT'`)으로도 받는다. 아래 컨트롤 옵션도 같다. */
  logoControlOptions?: ControlOptionsProp;
  /** 확대 컨트롤을 보일지 여부. */
  zoomControl?: boolean;
  /** 확대 컨트롤의 위치·모양. */
  zoomControlOptions?: ZoomControlOptionsProp;
  /** 주변 사진으로 옮기는 컨트롤을 보일지 여부. */
  aroundControl?: boolean;
  /** 주변 사진 컨트롤의 위치. */
  aroundControlOptions?: ControlOptionsProp;
  /**
   * 거리뷰 크기(px). 주지 않으면 Container 크기다. SDK 는 Container 가 바뀌어도 따라가지 않는다
   * (window resize 도 듣지 않는다). 따라가게 하려면 이 값을 바꾸거나 `useAutoResize` 를 쓴다.
   */
  size?: naver.maps.Size | naver.maps.SizeLiteral;
  /** 거리뷰가 준비되었을 때(SDK `init`). */
  onInit?: () => void;
  /** 거리뷰를 불러온 뒤. 인자는 지금 panoId. */
  onPanoChanged?: (panoId: string) => void;
  /** 불러오기 결과. SDK는 'OK' 나 'ERROR' 를 준다. */
  onPanoStatus?: (status: 'OK' | 'ERROR') => void;
  /** 보는 방향이 바뀌었을 때. 인자는 새 `pov`. */
  onPovChanged?: (pov: naver.maps.PanoramaPov) => void;
}

const CAMERA = ['position', 'panoId', 'pov', 'zoom'] as const;
/** 이름으로도 받는 SDK 상수 자리(sdk/constants.ts). */
const PANORAMA_CONSTANTS: ConstantPaths = {
  'logoControlOptions.position': 'Position',
  'zoomControlOptions.position': 'Position',
  'zoomControlOptions.style': 'ZoomControlStyle',
  'aroundControlOptions.position': 'Position',
};

const OPTIONS = [
  'size',
  'visible',
  'minZoom',
  'maxZoom',
  'minScale',
  'maxScale',
  'flightSpot',
  'logoControl',
  'logoControlOptions',
  'zoomControl',
  'zoomControlOptions',
  'aroundControl',
  'aroundControlOptions',
] as const;

export function Panorama(props: PanoramaProps) {
  requireSubmodule(useNavermaps(), 'panorama', 'Panorama');
  return <PanoramaRoot {...props} />;
}

function PanoramaRoot({ ref, children, ...given }: PanoramaProps) {
  const navermaps = useNavermaps();
  const props = resolveConstants(
    navermaps,
    given,
    PANORAMA_CONSTANTS,
    'Panorama',
  );
  const container = use(ContainerContext);
  if (!container) {
    throw new Error('Panorama must be used within <Container>');
  }
  const elementRef = useRef<HTMLElement | null>(null);
  // Panorama 는 준비 여부를 공개하지 않는다. 생성 직후 init 을 들어 기록한다.
  const readyRef = useRef(false);

  // 수명은 NaverMap 과 같다(lifetime.ts). 숨길 때는 element 만 숨기고 보일 때 크기를 다시 잰다.
  // SDK 의 Panorama.destroy 는 컨테이너를 비우고 인증 실패 그림을 깔아 정리용으로 쓸 수 없다
  // (3.10.5 확인). 버릴 때는 리스너를 지우고 element 를 뺀다.
  const panorama = useSdkInstance<naver.maps.Panorama>({
    create: () => {
      const el = document.createElement('div');
      el.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%';
      container.appendChild(el);
      elementRef.current = el;
      const options = omitUndefined(pick(props, [...CAMERA, ...OPTIONS]));
      const instance = rememberCreatedOptions(
        new navermaps.Panorama(el, options),
        options,
      );
      readyRef.current = false;
      addMapListener(instance, 'init', () => {
        readyRef.current = true;
      });
      return instance;
    },
    attach: (instance) => {
      if (elementRef.current) elementRef.current.style.display = '';
      instance.setSize(
        props.size ??
          new navermaps.Size(container.clientWidth, container.clientHeight),
      );
    },
    detach: () => {
      if (elementRef.current) elementRef.current.style.display = 'none';
    },
    dispose: (instance) => {
      clearMapListeners(instance);
    },
    release: () => {
      elementRef.current?.remove();
      elementRef.current = null;
    },
  });

  useImperativeHandle(ref, () => panorama!, [panorama]);

  const host = useMemo<PanoramaHost | null>(
    () => (panorama ? { panorama, isReady: () => readyRef.current } : null),
    [panorama],
  );

  if (!panorama) return null;
  return (
    <>
      <PanoramaBindings panorama={panorama} props={props} />
      {/* 거리뷰 안의 오버레이가 바깥 NaverMap 에 붙지 않게 지도 문맥을 비운다. */}
      <NaverMapContext value={null}>
        <PanoramaHostContext value={host}>{children}</PanoramaHostContext>
      </NaverMapContext>
    </>
  );
}

function PanoramaBindings({
  panorama,
  props,
}: {
  panorama: naver.maps.Panorama;
  props: PanoramaProps;
}) {
  useControlledProps(panorama, pick(props, OPTIONS));
  const hold = useGestureHold(panorama);
  const created = createdOptionsOf(panorama) ?? {};
  useCameraProp(
    created.position,
    props.position,
    (v) => panorama.setPosition(v),
    hold,
  );
  useCameraProp(
    created.panoId,
    props.panoId,
    (v) => panorama.setPanoId(v),
    hold,
  );
  useCameraProp(created.pov, props.pov, (v) => panorama.setPov(v), hold);
  useCameraProp(created.zoom, props.zoom, (v) => panorama.setZoom(v), hold);

  // init 은 비동기로 오지만 NaverMap 과 같이 layout effect 로 먼저 단다.
  useOverlayEvents(panorama, props, PANORAMA_LIFECYCLE_EVENTS, 'layout');
  useOverlayEvents(panorama, props, PANORAMA_EVENTS);

  return null;
}

const PANORAMA_LIFECYCLE_EVENTS = ['init'];

/** 거리뷰 이벤트와 prop(모양은 overlays/overlay-spec.tsx의 EventDecl). 공식 문서 Panorama Events(3.10.5). */
const PANORAMA_EVENTS: readonly EventDecl<naver.maps.Panorama>[] = [
  // 이벤트는 인자 없이 온다. 바뀐 값을 읽어 넘긴다.
  ['pano_changed', 'onPanoChanged', (p) => [p.getPanoId()]],
  ['pano_status', 'onPanoStatus'],
  ['pov_changed', 'onPovChanged', (p) => [p.getPov()]],
];

/**
 * 카메라 prop: 값이 바뀔 때만 SDK 에 넣는다. 처음 값은 생성자에 들어갔다.
 * 사용자가 바꾼 시점·위치를 되돌리지 않는 것은 NaverMap 의 center 와 같다.
 */
type GestureHold = {
  /** 사용자가 거리뷰를 누르고 있는가 */
  active: () => boolean;
  /** 보류한 prop이 있다고 알린다. 손을 떼면 다시 렌더해 맞춘다. */
  held: () => void;
};

/**
 * 거리뷰를 누르고 있는 동안(끌기, 핀치) 카메라 prop 을 보류한다. SDK 의 Panorama 는 끌기 이벤트를 내지
 * 않아(공식 문서 Events 4개, 3.10.5) 거리뷰 element 의 포인터로 안다. 끄는 동안 pov 는 확정되지
 * 않지만(getPov 그대로) 앱이 앞선 끌기의 값을 늦게 되돌려주면 그것이 다음 끌기 도중에 와서 시점을
 * 당겼다(e2e "pov 를 늦게 되돌려줘도 놓은 직후 다시 끄는"). 손을 떼면 마지막 prop 으로 맞춘다.
 */
function useGestureHold(panorama: naver.maps.Panorama): GestureHold {
  // 거리뷰에서 누른 포인터들. 마지막 포인터를 뗄 때 보류를 푼다(두 손가락 중 하나만 떼면 아직 누르는 중).
  const pointersRef = useRef(new Set<number>());
  const heldRef = useRef(false);
  const [, resume] = useReducer((n: number) => n + 1, 0);
  useLayoutEffect(() => {
    const el = panorama.getElement();
    const pointers = pointersRef.current;
    const idOf = (e: Event) => (e as PointerEvent).pointerId ?? -1;
    const down = (e: Event) => {
      pointers.add(idOf(e));
    };
    const up = (e: Event) => {
      if (!pointers.delete(idOf(e)) || pointers.size > 0) return;
      if (heldRef.current) {
        heldRef.current = false;
        resume();
      }
    };
    el.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    return () => {
      el.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
      // 숨길 때도 여기로 온다. 떼는 것을 못 보므로 비운다(NaverMap 의 제스처 상태와 같다).
      pointers.clear();
    };
  }, [panorama]);
  return {
    active: () => pointersRef.current.size > 0,
    held: () => {
      heldRef.current = true;
    },
  };
}

/** prop이 바뀔 때만 쓴다. 누르고 있는 동안은 보류하고(prev를 그대로 둔다) 뗀 뒤 다시 비교한다. */
function useCameraProp<T>(
  createdValue: unknown,
  value: T | undefined,
  apply: (value: T) => void,
  hold: GestureHold,
) {
  // 첫 비교 기준은 생성자가 받은 값이다. 생성 뒤 첫 동기화 전에 부모가 바꾼 값도 들어간다.
  const prevRef = useRef<unknown>(createdValue);
  useLayoutEffect(() => {
    const prev = prevRef.current;
    if (value === undefined || kvoEquals(prev, value)) {
      prevRef.current = value;
      return;
    }
    if (hold.active()) {
      hold.held();
      return;
    }
    prevRef.current = value;
    apply(value);
  });
}

/**
 * 지도 위에 항공뷰 지점 아이콘을 보여 준다. SDK 의 `naver.maps.FlightSpot` 이다.
 * `NaverMap` 의 자식으로 둔다. 그룹 아이콘(+)을 누르면 지도가 확대되고 이벤트는 나지 않는다.
 *
 * ```tsx
 * <NaverMap>
 *   <FlightSpot onPoiClicked={(panoId) => setPanoId(panoId)} />
 * </NaverMap>
 * ```
 */
export interface FlightSpotProps {
  ref?: Ref<naver.maps.FlightSpot>;
  /** 항공뷰 아이콘을 눌렀을 때. 인자는 그 지점의 파노라마 id(문서 `poi_clicked(panoId: string)`). */
  onPoiClicked?: (panoId: string) => void;
}

export function FlightSpot(props: FlightSpotProps) {
  requireSubmodule(useNavermaps(), 'panorama', 'FlightSpot');
  return <FlightSpotRoot {...props} />;
}

const FLIGHT_SPOT_EVENTS = [['poi_clicked', 'onPoiClicked'] as const];

function FlightSpotRoot({ ref, onPoiClicked }: FlightSpotProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const flightSpot = useSdkInstance(
    onMap(map, () => {
      const instance = new navermaps.FlightSpot();
      instance.setMap(map);
      return instance;
    }),
    [map],
  );

  useImperativeHandle(ref, () => flightSpot!, [flightSpot]);

  useOverlayEvents(flightSpot, { onPoiClicked }, FLIGHT_SPOT_EVENTS);

  return null;
}
