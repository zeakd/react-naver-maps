'use client';

import type { ReactNode, Ref } from 'react';
import { useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledProps } from './hooks/use-controlled-kvo.js';
import { useSdkInstance } from './lifetime.js';
import {
  addMapListener,
  clearMapListeners,
  removeMapListener,
} from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';

/**
 * 지도의 컨트롤 자리에 React 내용을 그린다. SDK 의 CustomControl 이다.
 *
 * ```tsx
 * const navermaps = useNavermaps();
 * <NaverMap>
 *   <CustomControl position={navermaps.Position.TOP_RIGHT}>
 *     <button onClick={goHome}>처음 위치</button>
 *   </CustomControl>
 * </NaverMap>
 * ```
 *
 * props 는 SDK 컨트롤의 것이고(position), children 은 컨트롤 element 안에 그릴 DOM 이다.
 */
export interface CustomControlProps {
  ref?: Ref<naver.maps.CustomControl>;
  /** 컨트롤 자리. `navermaps.Position.TOP_RIGHT` 같은 값. 바꾸면 그 자리로 옮긴다. */
  position: naver.maps.Position;
  children?: ReactNode;
}

type ReadyMap = naver.maps.Map & { isReady?: boolean };

export function CustomControl({ ref, position, children }: CustomControlProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  // SDK 는 지도가 init 되기 전(isReady 가 false)에 setMap 을 부르면 붙이지 않고 콘솔에 다시
  // 하라고만 남긴다. 그래서 init 전이면 init 을 기다렸다 붙인다.
  const waitsRef = useRef(new WeakMap<naver.maps.CustomControl, MapListener>());
  const attach = (control: naver.maps.CustomControl) => {
    if ((map as ReadyMap).isReady) {
      control.setMap(map);
      return;
    }
    const listener = addMapListener(map, 'init', () => {
      waitsRef.current.delete(control);
      control.setMap(map);
    });
    waitsRef.current.set(control, listener);
  };
  const detach = (control: naver.maps.CustomControl) => {
    const listener = waitsRef.current.get(control);
    if (listener) {
      removeMapListener(listener);
      waitsRef.current.delete(control);
    }
    control.setMap(null);
  };

  const control = useSdkInstance<naver.maps.CustomControl>(
    {
      create: () => {
        const created = new navermaps.CustomControl('', { position });
        attach(created);
        return created;
      },
      attach,
      detach,
      dispose: (instance) => {
        detach(instance);
        clearMapListeners(instance);
      },
    },
    [map],
  );

  useImperativeHandle(ref, () => control!, [control]);

  if (!control) return null;
  return (
    <>
      <CustomControlBindings control={control} position={position} />
      {createPortal(children, control.getElement())}
    </>
  );
}

function CustomControlBindings({
  control,
  position,
}: {
  control: naver.maps.CustomControl;
  position: naver.maps.Position;
}) {
  useControlledProps(control, { position });
  return null;
}
