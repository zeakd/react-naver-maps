import { useEffect } from 'react';
import type { FunctionComponent } from 'react';

import { useEventTarget } from './contexts/event-target';
import type { AllowedKey } from './types/utils';

export function useListener(target: any, type: string, listener: (...args: any[]) => void) {
  useEffect(() => {
    const _listener = (...args: any[]) => listener(...args, target);
    const mapEventListener = naver.maps.Event.addListener(target, type, _listener);

    return () => {
      naver.maps.Event.removeListener(mapEventListener);
    };
  }, [target, type, listener]);
}

export interface Props {
  target?: any;
  type: string;
  listener: (...args: any[]) => any;
}

export const Listener: FunctionComponent<Props> = (props) => {
  const {
    target: propTarget,
    type,
    listener,
  } = props;

  const contextTarget = useEventTarget();
  const target = propTarget || contextTarget;
  if (!target) {
    throw new Error('react-naver-maps: No Target to add listener');
  }

  // TODO: FIX DefinitelyTyped
  useListener((target as unknown) as EventTarget, type, listener);

  return null;
};

export function getListenerKeys<P extends Record<string, any>>(props: P) {
  return Object.keys(props).filter(key => /on[A-Z]\w+/.test(key)) as unknown as Array<AllowedKey<P, `on${string}`>>;
}
