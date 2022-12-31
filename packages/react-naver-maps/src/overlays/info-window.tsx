import pick from 'lodash.pick';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../helpers/overlay';
import type { UIEventHandlers } from '../types/event';
import { omitUndefined } from '../utils/omit-undefined';

const primitiveKvoKeys = [
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
const kvoKeys = [
  ...primitiveKvoKeys,
  'position',
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

type InfoWindowOptions = Omit<naver.maps.InfoWindowOptions, 'map'>;

export type Props = InfoWindowOptions & UIEventHandlers<typeof uiEvents> & {
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

export const InfoWindow = forwardRef<naver.maps.InfoWindow, Props>(function InfoWindow(props, ref) {
  const { position } = props;
  const [infoWindow] = useState(() => new naver.maps.InfoWindow(omitUndefined(pick(props, [...kvoKeys])) as InfoWindowOptions));

  useImperativeHandle<naver.maps.InfoWindow | undefined, naver.maps.InfoWindow | undefined>(ref, () => infoWindow);

  useEffect(() => {
    infoWindow.setOptions(omitUndefined(pick(props, primitiveKvoKeys)) as InfoWindowOptions); // TODO: FIX DefinilyTyped
  }, primitiveKvoKeys.map(key => props[key]));

  useEffect(() => {
    if (position && infoWindow.getPosition().equals(position as naver.maps.Point)) {
      infoWindow.setPosition(position);
    }
  }, [position]);

  return (
    <Overlay element={infoWindow} autoMount={false}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
});
