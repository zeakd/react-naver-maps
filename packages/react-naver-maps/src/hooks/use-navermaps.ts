import { suspend } from 'suspend-react';

import { useClientOptions } from '../contexts/client-options';
import { loadNavermapsScript } from '../load-navermaps-script';
import type { ClientOptions } from '../types/client';

async function load(options?: ClientOptions): Promise<typeof naver.maps> {
  if (typeof window !== 'undefined' && window.naver?.maps) {
    return window.naver.maps;
  }

  if (!options) {
    throw new Error('react-naver-maps: set options with `useNavermaps.config`');
  }

  return await loadNavermapsScript(options);
}

export function useNavermaps() {
  if (typeof window === 'undefined') {
    throw new Error('react-naver-maps: browser');
  }

  const options = useClientOptions();

  return suspend(load, [options, 'react-naver-maps/loadClient']);
}

// useNavermaps.preload = (options: any) => {
//   if (!window) {
//     return;
//   }

//   return preload(load, [options, 'react-naver-maps/loadClient']);
// };

// useNavermaps.clear = (options: any) => {
//   return clear([options, 'react-naver-maps/loadClient']);
// };
