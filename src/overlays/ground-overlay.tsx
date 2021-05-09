import React, { useEffect, useRef } from 'react';
import pick from 'lodash.pick';
import isEmpty from 'lodash.isempty';
import OverlayView from './overlay-view';
import { UIEventListeners } from '../utils/types';

const optionKeys = [
  'clickable',
  'opacity',
] as const;
const kvoEvents = optionKeys.map(key => `${key}_changed`);
const uiEvents = [
  'mousedown',
  'mouseup',
  'click',
  'dblclick',
  'rightclick',
  'mouseover',
  'mouseout',
  'mousemove',
] as const;
const events = [...uiEvents, ...kvoEvents];

type UIEvents = typeof uiEvents[number];
type KVOType = naver.maps.GroundOverlay;
type KVOOptionsType = naver.maps.GroundOverlayOptions;

type Props = KVOOptionsType & UIEventListeners<UIEvents> & {
  groundOverlay: KVOType;

  onOpacityChanged?: (value: number) => void;
  onClickableChanged?: (event: boolean) => void;
};

export const useGroundOverlay = (groundOverlay: naver.maps.GroundOverlay): [naver.maps.GroundOverlay] => {
  // TODO: fix DefinitelyType
  const groundOverlayRef = useRef<naver.maps.GroundOverlay>(groundOverlay);

  // TODO: Wrapper
  return [groundOverlayRef.current];
};

const GroundOverlay: React.FC<Props> = (props) => {
  const { groundOverlay } = props;

  useEffect(() => {
    const pickChanged = (
      kvo: KVOType,
      options: Partial<KVOOptionsType>,
    ): Partial<KVOOptionsType> => {
      const changed: Partial<KVOOptionsType> = {};

      const keys = Object.keys(options) as Array<keyof KVOOptionsType>;
      keys.forEach(key => {
        if (options[key] !== kvo.get(key)) {
          changed[key] = options[key] as any;
        }
      });

      return changed;
    };

    const update = (kvo: KVOType, options: Partial<KVOOptionsType>) => {
      Object.keys(options).forEach((key) => {
        kvo.set(key, options[key as keyof KVOOptionsType]);
      });
    };

    const options = pick(props, optionKeys);
    const diff = pickChanged(groundOverlay, options);
    if (!isEmpty(diff)) {
      update(groundOverlay, diff);
    }
  }, optionKeys.map(key => props[key]));

  return (
    <OverlayView<Props>
      overlay={groundOverlay}
      overlayProps={props}
      events={events}
    />
  );
};

export default GroundOverlay;
