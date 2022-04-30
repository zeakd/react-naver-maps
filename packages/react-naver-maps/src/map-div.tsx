import React, { ComponentPropsWithoutRef, Suspense, useEffect, useRef, useState } from 'react';
import { MapDivContext } from './contexts/map-div';

type Props = {
  children: React.ReactNode | React.ComponentType;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

export function MapDiv({ children, ...restProps }: Props) {
  const ref = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div {...restProps}>
      <div key='mapdiv' ref={ref} style={{ width: '100%', height: '100%' }} />
      {isMounted && ref.current && (
        <MapDivContext.Provider value={ref.current}>
          <Suspense fallback={null}>
            {typeof children === 'function' ? React.createElement(children as React.FC) : children}
          </Suspense>
        </MapDivContext.Provider>
      )}
    </div>
  );
}
