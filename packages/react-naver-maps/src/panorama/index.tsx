'use client';

// SDK panorama 서브모듈의 Panorama(거리뷰).
// <NavermapsProvider submodules={['panorama']}> 로 불러야 한다.
import type { ReactNode, Ref } from 'react';
import {
  use,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { ContainerContext } from '../core/contexts/container.js';
import { useMap } from '../core/hooks/use-map.js';
import { NaverMapContext } from '../core/contexts/naver-map.js';
import { PanoramaHostContext } from '../core/contexts/overlay-host.js';
import type { PanoramaHost } from '../core/contexts/overlay-host.js';
import { useNavermaps } from '../core/hooks/use-navermaps.js';
import {
  kvoEquals,
  useControlledProps,
} from '../core/hooks/use-controlled-kvo.js';
import { onMap, useSdkInstance } from '../core/lifetime.js';
import { omitUndefined } from '../core/utils/omit-undefined.js';
import { pick } from '../core/utils/pick.js';
import {
  addMapListener,
  clearMapListeners,
  removeMapListener,
} from '../core/utils/sdk.js';
import type { MapListener } from '../core/utils/sdk.js';
import { requireSubmodule } from '../core/utils/submodule.js';

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
  children?: ReactNode;
  /**
   * 보는 곳. `position`, `pov`, `zoom`, `panoId` 는 지도의 카메라처럼 prop 이 바뀔 때만 맞춘다.
   * 사용자가 돌려 보거나 길을 눌러 옮긴 것을 다시 렌더로 되돌리지 않는다.
   */
  position?: naver.maps.LatLng | naver.maps.LatLngLiteral;
  panoId?: string;
  pov?: naver.maps.PanoramaPov;
  zoom?: number;
  visible?: boolean;
  minZoom?: number;
  maxZoom?: number;
  minScale?: number;
  maxScale?: number;
  flightSpot?: boolean;
  logoControl?: boolean;
  logoControlOptions?: naver.maps.LogoControlOptions;
  zoomControl?: boolean;
  zoomControlOptions?: naver.maps.ZoomControlOptions;
  aroundControl?: boolean;
  aroundControlOptions?: naver.maps.AroundControlOptions;
  /**
   * 거리뷰 크기(px). 주지 않으면 Container 크기다. SDK 는 Container 가 바뀌어도 따라가지 않는다
   * (window resize 도 듣지 않는다). 따라가게 하려면 이 값을 바꾸거나 `useAutoResize` 를 쓴다.
   */
  size?: naver.maps.Size | naver.maps.SizeLiteral;
  /** 거리뷰가 준비되었을 때(SDK `init`). */
  onInit?: () => void;
  /** 거리뷰를 불러온 뒤. 인자는 지금 panoId. */
  onPanoChanged?: (panoId: string) => void;
  /** 불러오기 결과. SDK 는 'OK' 나 'ERROR' 를 준다. */
  onPanoStatus?: (status: 'OK' | 'ERROR') => void;
  onPovChanged?: (pov: naver.maps.PanoramaPov) => void;
}

const CAMERA = ['position', 'panoId', 'pov', 'zoom'] as const;
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

function PanoramaRoot({ ref, children, ...props }: PanoramaProps) {
  const navermaps = useNavermaps();
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
      const instance = new navermaps.Panorama(
        el,
        omitUndefined(
          pick(props, [...CAMERA, ...OPTIONS]),
        ) as naver.maps.PanoramaOptions,
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
      const el = elementRef.current;
      elementRef.current = null;
      clearMapListeners(instance);
      el?.remove();
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
  useCameraProp(props.position, (v) => panorama.setPosition(v));
  useCameraProp(props.panoId, (v) => panorama.setPanoId(v));
  useCameraProp(props.pov, (v) => panorama.setPov(v));
  useCameraProp(props.zoom, (v) => panorama.setZoom(v));

  const { onPanoChanged, onPanoStatus, onPovChanged, onInit } = props;
  // init 은 비동기로 오지만 NaverMap 과 같이 layout effect 로 먼저 단다.
  useLayoutEffect(() => {
    if (!onInit) return;
    const listener = addMapListener(panorama, 'init', onInit);
    return () => removeMapListener(listener);
  }, [panorama, onInit]);
  useEffect(() => {
    const listeners: MapListener[] = [];
    if (onPanoChanged)
      listeners.push(
        addMapListener(panorama, 'pano_changed', () =>
          onPanoChanged(panorama.getPanoId()),
        ),
      );
    if (onPanoStatus)
      listeners.push(addMapListener(panorama, 'pano_status', onPanoStatus));
    if (onPovChanged)
      listeners.push(
        addMapListener(panorama, 'pov_changed', () =>
          onPovChanged(panorama.getPov()),
        ),
      );
    return () => listeners.forEach((l) => removeMapListener(l));
  }, [panorama, onPanoChanged, onPanoStatus, onPovChanged]);

  return null;
}

/**
 * 카메라 prop: 값이 바뀔 때만 SDK 에 넣는다. 처음 값은 생성자에 들어갔다.
 * 사용자가 바꾼 시점·위치를 되돌리지 않는 것은 NaverMap 의 center 와 같다.
 */
function useCameraProp<T>(value: T | undefined, apply: (value: T) => void) {
  const prevRef = useRef(value);
  useLayoutEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (value === undefined || kvoEquals(prev, value)) return;
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

  useEffect(() => {
    if (!flightSpot || !onPoiClicked) return;
    const listener = addMapListener(flightSpot, 'poi_clicked', onPoiClicked);
    return () => removeMapListener(listener);
  }, [flightSpot, onPoiClicked]);

  return null;
}
