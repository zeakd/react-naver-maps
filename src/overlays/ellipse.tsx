import React, { useEffect, useRef } from 'react';
import pick from 'lodash.pick';
import isEmpty from 'lodash.isempty';
import OverlayView from './overlay-view';
import { UIEventListeners } from '../utils/types';

const optionKeys = [
  'bounds',
  'strokeWeight',
  'strokeOpacity',
  'strokeColor',
  'strokeStyle',
  'strokeLineCap',
  'strokeLineJoin',
  'fillColor',
  'fillOpacity',
  'clickable',
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
  'mousemove',
] as const;
const events = [...uiEvents, ...kvoEvents];

type UIEvents = typeof uiEvents[number];
type KVOType = naver.maps.Ellipse;
type KVOOptionsType = naver.maps.EllipseOptions;

type Props = KVOOptionsType & UIEventListeners<UIEvents> & {
  ellipse?: KVOType;

  onBoundsChanged?: (value: naver.maps.Bounds) => void;
  onStrokeWeightChanged?: (value: number) => void;
  onStrokeOpacityChanged?: (value: number) => void;
  onStrokeColorChanged?: (value: string) => void;
  onStrokeStyleChanged?: (value: naver.maps.strokeStyleType) => void;
  onStrokeLineCapChanged?: (value: naver.maps.strokeLineCapType) => void;
  onStrokeLineJoinChanged?: (value: naver.maps.strokeLineJoinType) => void;
  onFillColorChanged?: (value: string) => void;
  onFillOpacityChanged?: (value: number) => void;
  onClickableChanged?: (event: boolean) => void;
  onVisibleChanged?: (event: boolean) => void;
  onZIndexChanged?: (event: number) => void;
};

export const useEllipse = (ellipse?: naver.maps.Ellipse): [naver.maps.Ellipse] => {
  // TODO: fix DefinitelyType
  const ellipseRef = useRef<naver.maps.Ellipse>(ellipse || new window.naver.maps.Ellipse({} as naver.maps.EllipseOptions));

  // TODO: Wrapper
  return [ellipseRef.current];
};


const Ellipse: React.FC<Props> = (props) => {
  const { ellipse: _ellipse } = props;
  const [ellipse] = useEllipse(_ellipse);

  useEffect(() => {
    const pickChanged = (
      kvo: KVOType,
      options: Partial<KVOOptionsType>,
    ): Partial<KVOOptionsType> => {
      const { bounds, ...restOptions } = options;
      const changed: Partial<KVOOptionsType> = {};

      if (bounds) {
        if (!kvo.getBounds() || (kvo.getBounds() && !kvo.getBounds().equals(bounds as naver.maps.Bounds))) {
          changed.bounds = bounds;
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
    const diff = pickChanged(ellipse, options);
    if (!isEmpty(diff)) {
      update(ellipse, diff);
    }
  }, optionKeys.map(key => props[key]));

  return (
    <OverlayView<Props>
      overlay={ellipse}
      overlayProps={props}
      events={events}
    />
  );
};

export default Ellipse;
