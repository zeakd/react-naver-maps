import React, { ComponentPropsWithoutRef, CSSProperties, Suspense, useEffect, useRef, useState } from 'react';
import { MapDivContext } from './contexts/map-div';

type Props = {
  children: React.ReactNode | React.ComponentType;
  fallback?: React.ReactNode;
  innerMapStyle?: CSSProperties;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

const innerMapDefaultStyle: CSSProperties = { top: 0, left: 0, width: '100%', height: '100%' };

export function MapDiv({ children, fallback, innerMapStyle = innerMapDefaultStyle, ...restProps }: Props) {
  const ref = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div {...restProps} style={{ position: 'relative', ...restProps.style }}>
      <div key='mapdiv' ref={ref} style={innerMapStyle} />
      {isMounted && ref.current ? (
        <MapDivContext.Provider value={ref.current}>
          <Suspense fallback={null}>
            {typeof children === 'function' ? React.createElement(children as React.FC) : children}
          </Suspense>
        </MapDivContext.Provider>
      ) : fallback}
    </div>
  );
}
