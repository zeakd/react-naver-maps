import { suspend } from 'suspend-react';

import { useClientOptions } from './contexts/client-options';
import { loadNavermapsScript } from './load-navermaps-script';
import type { ClientOptions } from './types/client';

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

  /**
   * TODO: Provider option 이 변경될 경우 클리어하는 로직 필요
   * ex) submodule 에 파노라마 추가시 window.naver.maps가 존재하므로 새로 로드하지 않음
   */
  if (window.naver?.maps) {
    return window.naver.maps;
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
