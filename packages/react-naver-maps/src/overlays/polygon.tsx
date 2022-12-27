import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import pick from 'lodash.pick';
import { Overlay } from '../helpers/overlay';
import { HandleEvents } from '../helpers/event';
import type { UIEventHandlers } from '../types/event';
import { omitUndefined } from '../utils/omit-undefined';

const kvoKeys = [
  'paths',
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

type PolygonOptions = Omit<naver.maps.PolygonOptions, 'map'>;

export type Props = PolygonOptions & UIEventHandlers<typeof uiEvents> & {
  onPathsChanged?: (value: Array<naver.maps.ArrayOfCoords>) => void;
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

export const Polygon = forwardRef<naver.maps.Polygon, Props>(function Polygon(props, ref) {
  const options = pick(props, [...kvoKeys]);
  const [polygon] = useState(() => new naver.maps.Polygon(options));

  useImperativeHandle<naver.maps.Polygon | undefined, naver.maps.Polygon | undefined>(ref, () => polygon);

  useEffect(() => {
    polygon.setOptions(omitUndefined(options) as PolygonOptions); // TODO: FIX DefinilyTyped. setOptions의 assign type 은 Partial<Options> 이어야 함
  }, kvoKeys.map(key => options[key]));

  return (
    <Overlay element={polygon}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
});
