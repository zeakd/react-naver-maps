import React, { useEffect, useRef } from 'react';
import pick from 'lodash.pick';
import isEmpty from 'lodash.isempty';
import OverlayView from './overlay-view';
import { UIEventListeners } from '../utils/types';

const optionKeys = [
  'animation',
  'position',
  'icon',
  'shape',
  'title',
  'cursor',
  'clickable',
  'draggable',
  'visible',
  'zIndex',
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
  // 'mousemove',
  'dragstart',
  'drag',
  'dragend',
  // 'touchstart',
  // 'touchmove',
  // 'touchend',
  // 'pinchstart',
  // 'pinch',
  // 'pinchend',
  // 'tap',
  // 'longtap',
  // 'twofingertap',
  // 'doubletap',
] as const;
const events = [...uiEvents, ...kvoEvents];

type UIEvents = typeof uiEvents[number];
type KVOType = naver.maps.Marker;
type KVOOptionsType = naver.maps.MarkerOptions;

type Props = KVOOptionsType & UIEventListeners<UIEvents> & {
  marker?: KVOType;

  onAnimationChanged?: (value: naver.maps.Animation) => void;
  onPositionChanged?: (value: naver.maps.LatLng) => void;
  onIconChanged?: (value: string | naver.maps.ImageIcon | naver.maps.HtmlIcon | naver.maps.SymbolIcon) => void;
  onShapeChanged?: (event: naver.maps.MarkerShape) => void;
  onTitleChanged?: (event: string) => void;
  onCursorChanged?: (event: string) => void;
  onClickableChanged?: (event: boolean) => void;
  onDraggableChanged?: (event: boolean) => void;
  onVisibleChanged?: (event: boolean) => void;
  onZIndexChanged?: (event: number) => void;
};

export const useMarker = (marker?: naver.maps.Marker): [naver.maps.Marker] => {
  const markerRef = useRef<naver.maps.Marker>(marker || new window.naver.maps.Marker({}));

  // TODO: Wrapper
  return [markerRef.current];
};

const Marker: React.FC<Props> = (props) => {
  const { marker: _marker } = props;
  const [marker] = useMarker(_marker);

  useEffect(() => {
    const pickChanged = (
      kvo: KVOType,
      options: Partial<KVOOptionsType>,
    ): Partial<KVOOptionsType> => {
      const { position, ...restOptions } = options;
      const changed: Partial<KVOOptionsType> = {};

      if (position) {
        if (!kvo.getPosition() || (kvo.getPosition() && !kvo.getPosition().equals(position))) {
          changed.position = position;
        }
      }

      const keys = Object.keys(restOptions) as Array<keyof KVOOptionsType>;
      keys.forEach(key => {
        if (options[key] !== kvo.get(key)) {
          changed[key] = options[key];
        }
      });

      return changed;
    };

    const update = (kvo: KVOType, options: Partial<KVOOptionsType>) => {
      kvo.setOptions(options as KVOOptionsType);
    };

    const options: KVOOptionsType = pick(props, optionKeys);
    const diff = pickChanged(marker, options);
    if (!isEmpty(diff)) {
      update(marker, diff);
    }
  }, optionKeys.map(key => props[key]));

  return (
    <OverlayView<Props>
      overlay={marker}
      overlayProps={props}
      events={events}
    />
  );
};

export default Marker;
