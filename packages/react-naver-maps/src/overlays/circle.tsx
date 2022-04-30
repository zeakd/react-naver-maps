import React, { useEffect, useState } from 'react';
import pick from 'lodash.pick';
import { Overlay } from '../helpers/overlay';
import { HandleEvents } from '../helpers/event';
import { UIEventHandlers } from '../types/event';
import { omitUndefined } from '../utils/omit-undefined';

const primitiveKvoKeys = [
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
const kvoKeys = [
  ...primitiveKvoKeys,
  'center',
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

type CircleOptions = Omit<naver.maps.CircleOptions, 'map'>;

type Props = CircleOptions & UIEventHandlers<typeof uiEvents> & {
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

export function Circle(props: Props) {
  const { center } = props;
  const [circle] = useState(() => new naver.maps.Circle(omitUndefined(pick(props, [...kvoKeys])) as CircleOptions));

  useEffect(() => {
    if (center && !circle.getCenter().equals(center as naver.maps.Point)) {
      circle.setCenter(center);
    }
  }, [center]);

  useEffect(() => {
    circle.setOptions(omitUndefined(pick(props, primitiveKvoKeys)) as CircleOptions);
  }, primitiveKvoKeys.map(key => props[key]));

  return (
    <Overlay element={circle}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
}
