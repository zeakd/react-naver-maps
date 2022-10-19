import React, { useEffect } from 'react';
import { useEventTarget } from '../contexts/event-target';
import type { AllowedKey } from '../types/utils';

export function useAddListener(target: any, type: string, listener: (e: any) => void) {
  useEffect(() => {
    const mapEventListener = naver.maps.Event.addListener(target, type, listener);

    return () => {
      naver.maps.Event.removeListener(mapEventListener);
    };
  }, [target, type, listener]);
}

interface Props {
  target?: any;
  type: string;
  listener: (e: any) => any;
}

export const AddListener: React.FC<Props> = (props) => {
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
  useAddListener((target as unknown) as EventTarget, type, listener);

  return null;
};

export function getListenerKeys<P extends Record<string, any>>(props: P) {
  return Object.keys(props).filter(key => /on[A-Z]\w+/.test(key)) as unknown as Array<AllowedKey<P, `on${string}`>>;
}
