'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { ContainerContext } from './contexts/container.js';

export interface ContainerProps {
  children: ReactNode;
  fallback?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Container({
  children,
  fallback,
  style,
  className,
}: ContainerProps) {
  const [mapDiv, setMapDiv] = useState<HTMLDivElement | null>(null);

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      <div ref={setMapDiv} style={{ width: '100%', height: '100%' }} />
      {mapDiv && (
        <ContainerContext value={mapDiv}>
          <Suspense fallback={fallback ?? null}>{children}</Suspense>
        </ContainerContext>
      )}
    </div>
  );
}
