import pick from 'lodash.pick';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../overlay';
import type { UIEventHandlers } from '../types/event';
import { useNavermaps } from '../use-navermaps';
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

type EllipseOptions = {
  /**
   * bounds
   * @type naver.maps.Bounds | naver.maps.BoundsLiteral
   */
  bounds: naver.maps.Bounds | naver.maps.BoundsLiteral;
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

export type Props = EllipseOptions & {
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
} & UIEventHandlers<typeof uiEvents>;

export const Ellipse = forwardRef<naver.maps.Ellipse, Props>(function Ellipse(props, ref) {
  const { bounds } = props;
  const navermaps = useNavermaps();
  const [ellipse] = useState(() => new navermaps.Ellipse(omitUndefined(pick(props, [...kvoKeys])) as EllipseOptions));

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
