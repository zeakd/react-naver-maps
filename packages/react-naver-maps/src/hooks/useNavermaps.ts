import { useEffect } from 'react';
import { useAsset } from 'use-asset';
import { loadNavermapsScript, Options } from '../load-navermaps-script';

let config: Options | undefined = undefined;

async function load(options?: Options): Promise<typeof naver.maps> {
  if (typeof window !== 'undefined' && window.naver?.maps) {
    return window.naver.maps;
  }

  if (!options) {
    throw new Error('react-naver-maps: set options with `useNavermaps.config`');
  }

  return loadNavermapsScript(options);
}

export function useNavermaps() {
  if (typeof window === 'undefined') {
    throw new Error('react-naver-maps: browser');
  }


  // It is okay to return in the middle because useAsset is actually not hook.
  // TODO: use `createAsset`

  // if (typeof window !== 'undefined' && window.naver?.maps) {
  //   return window.naver.maps;
  // }

  return useAsset(load, config);
}

useNavermaps.config = (options: Options) => {
  config = options;
};

useNavermaps.preload = () => {
  if (!window) {
    return;
  }

  return useAsset.preload(load, config);
};

useNavermaps.clear = () => {
  return useAsset.clear();
};
