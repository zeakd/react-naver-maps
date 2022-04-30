import React, { useEffect, useState } from 'react';
import pick from 'lodash.pick';
import { Overlay } from '../helpers/overlay';
import { HandleEvents } from '../helpers/event';
import { UIEventHandlers } from '../types/event';
import { omitUndefined } from '../utils/omit-undefined';

const kvoKeys = [
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
const kvoEvents = kvoKeys.map(key => `${key}_changed`);
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

type PolylineOptions = Omit<naver.maps.PolylineOptions, 'map'>;

type Props = PolylineOptions & UIEventHandlers<typeof uiEvents> & {
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

export function Polyline(props: Props) {
  const options = pick(props, [...kvoKeys]);
  const [polyline] = useState(() => new naver.maps.Polyline(options));

  useEffect(() => {
    polyline.setOptions(omitUndefined(options) as PolylineOptions); // TODO: FIX DefinilyTyped. setOptions의 assign type 은 Partial<Options> 이어야 함
  }, kvoKeys.map(key => options[key]));

  return (
    <Overlay element={polyline}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
}
