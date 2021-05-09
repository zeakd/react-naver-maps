import React, { useEffect, useRef } from 'react';
import pick from 'lodash.pick';
import isEmpty from 'lodash.isempty';
import OverlayView from './overlay-view';
import { UIEventListeners } from '../utils/types';

const optionKeys = [
  'path',
  'strokeWeight',
  'strokeOpacity',
  'strokeColor',
  'strokeStyle',
  'strokeLineCap',
  'strokeLineJoin',
  'clickable',
  'visible',
  'zIndex',
  'startIcon',
  'startIconSize',
  'endIcon',
  'endIconSize',
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
type KVOType = naver.maps.Polyline;
type KVOOptionsType = naver.maps.PolylineOptions;

type Props = KVOOptionsType & UIEventListeners<UIEvents> & {
  polyline?: KVOType;

  onPathChanged?: (value: naver.maps.ArrayOfCoords) => void;
  onStrokeWeightChanged?: (value: number) => void;
  onStrokeOpacityChanged?: (value: number) => void;
  onStrokeColorChanged?: (value: string) => void;
  onStrokeStyleChanged?: (value: naver.maps.strokeStyleType) => void;
  onStrokeLineCapChanged?: (value: naver.maps.strokeLineCapType) => void;
  onStrokeLineJoinChanged?: (value: naver.maps.strokeLineJoinType) => void;
  onClickableChanged?: (value: boolean) => void;
  onVisibleChanged?: (value: boolean) => void;
  onZIndexChanged?: (value: number) => void;
  onStartIconChanged?: (value: naver.maps.PointingIcon) => void;
  onStartIconSizeChanged?: (number: string) => void;
  onEndIconChanged?: (value: naver.maps.PointingIcon) => void;
  onEndIconSizeChanged?: (number: string) => void;
};

export const usePolyline = (polyline?: naver.maps.Polyline): [naver.maps.Polyline] => {
  // TODO: fix DefinitelyType
  const polylineRef = useRef<naver.maps.Polyline>(polyline || new window.naver.maps.Polyline({} as naver.maps.PolylineOptions));

  // TODO: Wrapper
  return [polylineRef.current];
};


const Polyline: React.FC<Props> = (props) => {
  const { polyline: _polyline } = props;
  const [polyline] = usePolyline(_polyline);

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
      kvo.setOptions(options as KVOOptionsType);
    };

    const options = pick(props, optionKeys);
    const diff = pickChanged(polyline, options);
    if (!isEmpty(diff)) {
      update(polyline, diff);
    }
  }, optionKeys.map(key => props[key]));

  return (
    <OverlayView<Props>
      overlay={polyline}
      overlayProps={props}
      events={events}
    />
  );
};

export default Polyline;
