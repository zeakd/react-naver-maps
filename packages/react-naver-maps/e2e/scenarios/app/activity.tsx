import * as React from 'react';
import type { ReactNode } from 'react';

/**
 * React 19.2 부터 있는 `Activity`. 그 전 버전에서는 자식을 그대로 그린다. 하네스를 React 19.0·19.1 로도
 * 돌리기 위해서다(라이브러리의 peer 범위는 ^19.0.0). Activity 를 쓰는 시나리오는 scenarios.spec.ts 가
 * 그 버전에서 건너뛴다.
 */
type ActivityProps = { mode?: 'visible' | 'hidden'; children?: ReactNode };
const Native = (
  React as unknown as { Activity?: React.ComponentType<ActivityProps> }
).Activity;

export const Activity: React.ComponentType<ActivityProps> =
  Native ?? (({ children }: ActivityProps) => <>{children}</>);
