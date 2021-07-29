import React, { useEffect, useRef } from 'react';
import pick from 'lodash.pick';
import isEmpty from 'lodash.isempty';
import OverlayView from './overlay-view';
import { UIEventListeners } from '../utils/types';

const optionKeys = [
  'center',
  'radius',
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
type KVOType = naver.maps.Circle;
type KVOOptionsType = naver.maps.CircleOptions;

type Props = KVOOptionsType & UIEventListeners<UIEvents> & {
  circle?: KVOType;

  onCenterChanged?: (value: naver.maps.Coord) => void;
  onRadiusChanged?: (value: number) => void;
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

export const useCircle = (circle?: naver.maps.Circle): [naver.maps.Circle] => {
  // TODO: fix DefinitelyType
  const circleRef = useRef<naver.maps.Circle>(circle || new window.naver.maps.Circle({} as naver.maps.CircleOptions));

  // TODO: Wrapper
  return [circleRef.current];
};

const Circle: React.FC<Props> = (props) => {
  const { circle: _circle } = props;
  const [circle] = useCircle(_circle);

  useEffect(() => {
    const pickChanged = (
      kvo: KVOType,
      options: Partial<KVOOptionsType>,
    ): Partial<KVOOptionsType> => {
      const { center, ...restOptions } = options;
      const changed: Partial<KVOOptionsType> = {};

      if (center) {
        if (!kvo.getCenter() || (kvo.getCenter() && !kvo.getCenter().equals(center as naver.maps.Point))) {
          changed.center = center;
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
    const diff = pickChanged(circle, options);
    if (!isEmpty(diff)) {
      update(circle, diff);
    }
  }, optionKeys.map(key => props[key]));

  return (
    <OverlayView<Props>
      overlay={circle}
      overlayProps={props}
      events={events}
    />
  );
};

export default Circle;
