import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, ComponentPropsWithoutRef, CSSProperties, ComponentType } from 'react';

import { ContainerContext, ContainerContextType } from './contexts/container';

export type Props = {
  children: ReactNode | ComponentType;
  fallback?: ReactNode;
  innerStyle?: CSSProperties;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const innerDefaultStyle: CSSProperties = { top: 0, left: 0, width: '100%', height: '100%', position: 'absolute' };

export function Container({ children, fallback, innerStyle = innerDefaultStyle, ...restProps }: Props) {
  const ref = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const containerContext = useMemo<ContainerContextType>(() => ({ element: ref.current }), [ref.current]);

  return (
    <div {...restProps} style={{ position: 'relative', ...restProps.style }}>
      <div key='mapdiv' ref={ref} style={innerStyle} />
      {isMounted && ref.current ? (
        <ContainerContext.Provider value={containerContext}>
          <Suspense fallback={null}>
            {typeof children === 'function' ? React.createElement(children as ComponentType) : children}
          </Suspense>
        </ContainerContext.Provider>
      ) : fallback}
    </div>
  );
}
