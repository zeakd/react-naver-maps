import camelcase from 'camelcase';
import mapKeys from 'lodash.mapkeys';
import pick from 'lodash.pick';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../helpers/overlay';
import type { UIEventHandlers } from '../types/event';
import { getKeys } from '../utils/get-keys';
import { omitUndefined } from '../utils/omit-undefined';

const primitiveKvoKeys = [
  'animation',
  'icon',
  'shape',
  'title',
  'cursor',
  'clickable',
  'draggable',
  'visible',
  'zIndex',
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
  'dragstart',
  'drag',
  'dragend',
] as const;
const events = [...uiEvents, ...kvoEvents];

const defaultOptionKeyMap = kvoKeys.reduce((acc, key) => ({ ...acc, [camelcase(`default_${key}`)]: key }), {}) as {
  [key in typeof kvoKeys[number] as `default${Capitalize<key>}`]: key;
};

type DefaultKVOOptionKey = keyof typeof defaultOptionKeyMap;

type MarkerKVO = {
  animation: naver.maps.Animation;
  position: naver.maps.Coord | naver.maps.CoordLiteral;
  icon: string | naver.maps.ImageIcon | naver.maps.SymbolIcon | naver.maps.HtmlIcon;
  shape: naver.maps.MarkerShape;
  title: string;
  cursor: string;
  clickable: boolean;
  draggable: boolean;
  visible: boolean;
  zIndex: number;
};

// TODO: Fix DefinitelyTyped
type MarkerOptions = Partial<MarkerKVO>;

export type Props = MarkerOptions & UIEventHandlers<typeof uiEvents> & {
  onAnimationChanged?: (value: naver.maps.Animation) => void;
  onPositionChanged?: (value: naver.maps.Coord) => void;
  onIconChanged?: (value: string | naver.maps.ImageIcon | naver.maps.HtmlIcon | naver.maps.SymbolIcon) => void;
  onShapeChanged?: (event: naver.maps.MarkerShape) => void;
  onTitleChanged?: (event: string) => void;
  onCursorChanged?: (event: string) => void;
  onClickableChanged?: (event: boolean) => void;
  onDraggableChanged?: (event: boolean) => void;
  onVisibleChanged?: (event: boolean) => void;
  onZIndexChanged?: (event: number) => void;
};

function makeInitialOption(props: Props) {
  const defaultPrefixedProps = mapKeys(pick(props, getKeys(defaultOptionKeyMap)), (_, key: DefaultKVOOptionKey) => defaultOptionKeyMap[key]);
  const kvoProps = pick(props, kvoKeys);

  return omitUndefined({ ...kvoProps, ...defaultPrefixedProps });
}

export const Marker = forwardRef<naver.maps.Marker, Props>(function Marker(props, ref) {
  const { position } = props;
  const [marker] = useState(() => new naver.maps.Marker(makeInitialOption(props)));

  useImperativeHandle<naver.maps.Marker | undefined, naver.maps.Marker | undefined>(ref, () => marker);

  useEffect(() => {
    if ('defaultPosition' in props && props['defaultPosition'] === undefined) {
      return;
    }

    if (position && !marker.getPosition().equals(position as naver.maps.Point)) {
      marker.setPosition(position);
    }
  }, [position]);

  useEffect(() => {
    marker.setOptions(pick(props, primitiveKvoKeys));
  }, primitiveKvoKeys.map(key => props[key]));

  return (
    <Overlay element={marker}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
});
