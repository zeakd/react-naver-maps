'use client';

import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { ContainerContext } from './contexts/container.js';
import { useNavermaps } from './hooks/use-navermaps.js';

const defaultInnerStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
};

/**
 * 지도가 렌더링될 DOM 컨테이너. NaverMap의 부모로 사용한다.
 *
 * children으로 ReactNode 또는 render function을 받을 수 있다.
 * render function 사용 시 navermaps 네임스페이스를 인자로 받아
 * 별도 컴포넌트 분리 없이 지도를 구성할 수 있다.
 *
 * @example
 * ```tsx
 * // render function
 * <Container style={{ width: '100%', height: '400px' }}>
 *   {(navermaps) => (
 *     <NaverMap defaultCenter={new navermaps.LatLng(37.5, 127.0)} />
 *   )}
 * </Container>
 * ```
 */
export interface ContainerProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> {
  children: ReactNode | ((navermaps: typeof naver.maps) => ReactNode);
  fallback?: ReactNode;
  /** 내부 지도 div의 스타일. 기본값: position absolute, 100% 크기 */
  innerStyle?: CSSProperties;
}

export function Container({
  children,
  fallback,
  style,
  innerStyle = defaultInnerStyle,
  ...restProps
}: ContainerProps) {
  const [mapDiv, setMapDiv] = useState<HTMLDivElement | null>(null);

  return (
    <div {...restProps} style={{ position: 'relative', ...style }}>
      <div ref={setMapDiv} style={innerStyle} />
      {mapDiv && (
        <ContainerContext value={mapDiv}>
          <Suspense fallback={fallback ?? null}>
            {typeof children === 'function' ? (
              <RenderPropBridge>{children}</RenderPropBridge>
            ) : (
              children
            )}
          </Suspense>
        </ContainerContext>
      )}
    </div>
  );
}

/**
 * render function children을 위한 내부 브릿지.
 * Suspense 안에서 useNavermaps()를 호출하여 navermaps를 전달한다.
 */
function RenderPropBridge({
  children,
}: {
  children: (navermaps: typeof naver.maps) => ReactNode;
}) {
  const navermaps = useNavermaps();
  return <>{children(navermaps)}</>;
}
