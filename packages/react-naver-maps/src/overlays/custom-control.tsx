'use client';

import type { ReactNode, Ref } from 'react';
import { resolveConstant } from '../sdk/constants.js';
import type { PositionName } from '../sdk/constants.js';
import { useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { useMap } from '../hooks/use-map.js';
import { useControlledProps } from '../binding/use-controlled-kvo.js';
import { onReadyMap, useSdkInstance } from '../binding/lifetime.js';

/**
 * 지도의 컨트롤 자리에 React 내용을 그린다. SDK 의 CustomControl 이다.
 *
 * ```tsx
 * const navermaps = useNavermaps();
 * <NaverMap>
 *   <CustomControl position="TOP_RIGHT">
 *     <button onClick={goHome}>처음 위치</button>
 *   </CustomControl>
 * </NaverMap>
 * ```
 *
 * props 는 SDK 컨트롤의 것이고(position), children 은 컨트롤 element 안에 그릴 DOM 이다.
 */
export interface CustomControlProps {
  ref?: Ref<naver.maps.CustomControl>;
  /** 컨트롤 자리. `'TOP_RIGHT'` 같은 이름이나 `navermaps.Position.TOP_RIGHT`. 바꾸면 그 자리로 옮긴다. */
  position: PositionName;
  children?: ReactNode;
}

export function CustomControl({
  ref,
  position: given,
  children,
}: CustomControlProps) {
  const navermaps = useNavermaps();
  const position = resolveConstant(
    navermaps,
    'Position',
    given,
    '<CustomControl position>',
  ) as naver.maps.Position;
  const map = useMap();

  // 지도 init 전이면 init 을 기다렸다 붙인다(lifetime.ts onReadyMap).
  const control = useSdkInstance<naver.maps.CustomControl>(
    onReadyMap(map, () => new navermaps.CustomControl('', { position })),
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
