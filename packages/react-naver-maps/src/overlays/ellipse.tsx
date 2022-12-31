import pick from 'lodash.pick';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../helpers/overlay';
import type { UIEventHandlers } from '../types/event';
import { omitUndefined } from '../utils/omit-undefined';

const primitiveKvoKeys = [
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
  'bounds',
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

type EllipseOptions = Omit<naver.maps.EllipseOptions, 'map'>;

export type Props = Omit<naver.maps.EllipseOptions, 'map'> & UIEventHandlers<typeof uiEvents> & {
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

export const Ellipse = forwardRef<naver.maps.Ellipse, Props>(function Ellipse(props, ref) {
  const { bounds } = props;
  const [ellipse] = useState(() => new naver.maps.Ellipse(omitUndefined(pick(props, [...kvoKeys])) as EllipseOptions));

  useImperativeHandle<naver.maps.Ellipse | undefined, naver.maps.Ellipse | undefined>(ref, () => ellipse);

  useEffect(() => {
    ellipse.setOptions(omitUndefined(pick(props, primitiveKvoKeys)) as EllipseOptions); // TODO: FIX DefinilyTyped. setOptions의 assign type 은 Partial<Options> 이어야 함
  }, primitiveKvoKeys.map(key => props[key]));

  useEffect(() => {
    if (bounds && ellipse.getBounds().equals(bounds as naver.maps.Bounds)) {
      ellipse.setBounds(bounds);
    }
  }, [bounds]);

  return (
    <Overlay element={ellipse}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
});
