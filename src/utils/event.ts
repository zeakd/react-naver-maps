import React, { useEffect, useRef } from 'react';

interface Props {
  target: naver.maps.KVO;
  type: string;
  listener: (e: any) => any;
}

interface EventTarget {
  addListener: (type: string, listener: (e: any) => void) => naver.maps.MapEventListener;
  removeListener: (mapEventListener: naver.maps.MapEventListener) => void;
}

const useEvent = (target: EventTarget, type: string, listener: (e: any) => void) => {
  const listeningRef = useRef<naver.maps.MapEventListener>();

  useEffect(() => {
    listeningRef.current = target.addListener(type, listener as () => void);

    return () => {
      if (listeningRef.current) target.removeListener(listeningRef.current);
    };
  }, [target, type, listener]);
};

export const AddListener: React.FC<Props> = (props) => {
  const {
    target,
    type,
    listener,
  } = props;

  // TODO: FIX DefinitelyTyped
  useEvent((target as unknown) as EventTarget, type, listener);

  return null;
};

export function getListenerKeys<Props>(props: Props): string[] {
  return Object.keys(props).filter(key => /on[A-Z]\w+/.test(key));
}
