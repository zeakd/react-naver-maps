'use client';

// SDK panorama 서브모듈의 Panorama(거리뷰).
// <NavermapsProvider submodules={['panorama']}> 로 불러야 한다.
import type { Ref } from 'react';
import {
  use,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import { ContainerContext } from '../core/contexts/container.js';
import { useNavermaps } from '../core/hooks/use-navermaps.js';
import {
  kvoEquals,
  useControlledProps,
} from '../core/hooks/use-controlled-kvo.js';
import { useSdkInstance } from '../core/lifetime.js';
import { omitUndefined } from '../core/utils/omit-undefined.js';
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
 */
export interface PanoramaProps {
  ref?: Ref<naver.maps.Panorama>;
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
  /** 거리뷰를 불러온 뒤. 인자는 지금 panoId. */
  onPanoChanged?: (panoId: string) => void;
  /** 불러오기 결과. SDK 는 'OK' 나 'ERROR' 를 준다. */
  onPanoStatus?: (status: string) => void;
  onPovChanged?: (pov: naver.maps.PanoramaPov) => void;
}

const CAMERA = ['position', 'panoId', 'pov', 'zoom'] as const;
const OPTIONS = [
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

function PanoramaRoot({ ref, ...props }: PanoramaProps) {
  const navermaps = useNavermaps();
  const container = use(ContainerContext);
  if (!container) {
    throw new Error('Panorama must be used within <Container>');
  }
  const elementRef = useRef<HTMLElement | null>(null);

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
      return new navermaps.Panorama(
        el,
        omitUndefined(
          Object.fromEntries([...CAMERA, ...OPTIONS].map((k) => [k, props[k]])),
        ) as naver.maps.PanoramaOptions,
      );
    },
    attach: (instance) => {
      if (elementRef.current) elementRef.current.style.display = '';
      instance.setSize(
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

  if (!panorama) return null;
  return <PanoramaBindings panorama={panorama} props={props} />;
}

function PanoramaBindings({
  panorama,
  props,
}: {
  panorama: naver.maps.Panorama;
  props: PanoramaProps;
}) {
  useControlledProps(
    panorama,
    Object.fromEntries(OPTIONS.map((k) => [k, props[k]])),
  );
  useCameraProp(props.position, (v) => panorama.setPosition(v));
  useCameraProp(props.panoId, (v) => panorama.setPanoId(v));
  useCameraProp(props.pov, (v) => panorama.setPov(v));
  useCameraProp(props.zoom, (v) => panorama.setZoom(v));

  const { onPanoChanged, onPanoStatus, onPovChanged } = props;
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
