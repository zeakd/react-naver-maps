import pick from 'lodash.pick';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../overlay';
import type { UIEventHandlers } from '../types/event';
import { useNavermaps } from '../use-navermaps';
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

type CircleOptions = {
  /**
   * center
   * @type naver.maps.Coord | naver.maps.CoordLiteral
   */
  center: naver.maps.Coord | naver.maps.CoordLiteral;
  radius?: number;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeColor?: string;
  strokeStyle?: naver.maps.strokeStyleType;
  strokeLineCap?: naver.maps.strokeLineCapType;
  strokeLineJoin?: naver.maps.strokeLineJoinType;
  fillColor?: string;
  fillOpacity?: number;
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
};

export type Props = CircleOptions & {
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
} & UIEventHandlers<typeof uiEvents>;

export const Circle = forwardRef<naver.maps.Circle, Props>(function Circle(props, ref) {
  const { center } = props;
  const navermaps = useNavermaps();
  const [circle] = useState(() => new navermaps.Circle(omitUndefined(pick(props, [...kvoKeys])) as CircleOptions));

  useImperativeHandle<naver.maps.Circle | undefined, naver.maps.Circle | undefined>(ref, () => circle);

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
});
