import { useRef, useEffect, DependencyList } from 'react';

export function usePrevious<T>(state: T, deps: DependencyList): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = state;
  }, deps);

  return ref.current;
}
