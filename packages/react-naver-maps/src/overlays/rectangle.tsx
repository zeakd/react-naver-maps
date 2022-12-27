import React, { useEffect, useState } from 'react';
import { Overlay } from '../helpers/overlay';
import { HandleEvents } from '../helpers/event';
import type { UIEventHandlers } from '../types/event';
import pick from 'lodash.pick';
import { omitUndefined } from '../utils/omit-undefined';

const optionKeys = [
  'strokeWeight',
  'strokeOpacity',
  'strokeColor',
  'strokeStyle',
  'strokeLineCap',
  'strokeLineJoin',
  'fillColor',
  'fillOpacity',
] as const;
const kvoKeys = [
  'bounds',
  'clickable',
  'visible',
  'zIndex',
] as const;
const kvoEvents = kvoKeys.map(key => `${key}_changed`);
const uiEvents = [
  'click',
  'dblclick',
  'mousedown',
  'mouseout',
  'mouseover',
  'mouseup',
] as const;
const events = [...uiEvents, ...kvoEvents];

type RectangleOptions = Omit<naver.maps.RectangleOptions, 'map'>;

export type Props = RectangleOptions & UIEventHandlers<typeof uiEvents> & {
  onBoundsChanged?: (value: naver.maps.Bounds) => void;
  onClickableChanged?: (value: boolean) => void;
  onVisibleChanged?: (value: boolean) => void;
  onZIndexChanged?: (value: number) => void;
};

export function Rectangle(props: Props) {
  const options = pick(props, [...optionKeys, ...kvoKeys]);
  const [rectangle] = useState(() => new naver.maps.Rectangle(options));

  useEffect(() => {
    rectangle.setOptions(omitUndefined(options) as RectangleOptions); // TODO: FIX DefinilyTyped. setOptions의 assign type 은 Partial<Options> 이어야 함
  }, kvoKeys.map(key => options[key]));

  return (
    <Overlay element={rectangle}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
}
