import React, { useEffect, useRef } from 'react';
import pick from 'lodash.pick';
import isEmpty from 'lodash.isempty';
import OverlayView from './overlay-view';
import { UIEventListeners } from '../utils/types';

const optionKeys = [
  'position',
  'content',
  'zIndex',
  'maxWidth',
  'pixelOffset',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'disableAutoPan',
  'disableAnchor',
  'anchorSkew',
  'anchorSize',
  'anchorColor',
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
type KVOType = naver.maps.InfoWindow;
type KVOOptionsType = naver.maps.InfoWindowOptions;

type Props = KVOOptionsType & UIEventListeners<UIEvents> & {
  infoWindow?: KVOType;

  onPositionChanged?: (value: naver.maps.Coord) => void;
  onContentChanged?: (value: HTMLElement) => void;
  onZIndexChanged?: (value: number) => void;
  onMaxWidthChanged?: (value: number) => void;
  onPixelOffsetChanged?: (value: naver.maps.Point) => void;
  onBackgroundColorChanged?: (value: string) => void;
  onBorderColorChanged?: (value: string) => void;
  onBorderWidthChanged?: (value: number) => void;
  onDisableAutoPanChanged?: (value: boolean) => void;
  onDisableAnchorChanged?: (value: boolean) => void;
  onAnchorSkewChanged?: (value: boolean) => void;
  onAnchorSizeChanged?: (value: naver.maps.Size) => void;
  onAnchorColorChanged?: (value: string) => void;
};

export const useInfoWindow = (infoWindow?: naver.maps.InfoWindow): [naver.maps.InfoWindow] => {
  // TODO: fix DefinitelyType
  const infoWindowRef = useRef<naver.maps.InfoWindow>(infoWindow || new window.naver.maps.InfoWindow({} as naver.maps.InfoWindowOptions));

  // TODO: Wrapper
  return [infoWindowRef.current];
};


const InfoWindow: React.FC<Props> = (props) => {
  const { infoWindow: _infoWindow } = props;
  const [infoWindow] = useInfoWindow(_infoWindow);

  useEffect(() => {
    const pickChanged = (
      kvo: KVOType,
      options: Partial<KVOOptionsType>,
    ): Partial<KVOOptionsType> => {
      const { position, ...restOptions } = options;
      const changed: Partial<KVOOptionsType> = {};

      if (position) {
        if (!kvo.getPosition() || (kvo.getPosition() && !kvo.getPosition().equals(position as naver.maps.Point))) {
          changed.position = position;
        }
      }

      const keys = Object.keys(restOptions) as Array<keyof KVOOptionsType>;
      keys.forEach(key => {
        if (options[key] !== kvo.get(key)) {
          changed[key] = options[key] as any;
        }
      });

      return changed;
    };

    const update = (kvo: KVOType, options: Partial<KVOOptionsType>) => {
      kvo.setOptions(options as KVOOptionsType);
    };

    const options = pick(props, optionKeys);
    const diff = pickChanged(infoWindow, options);
    if (!isEmpty(diff)) {
      update(infoWindow, diff);
    }
  }, optionKeys.map(key => props[key]));

  return (
    <OverlayView<Props>
      overlay={infoWindow}
      overlayProps={props}
      events={events}
    />
  );
};

export default InfoWindow;
