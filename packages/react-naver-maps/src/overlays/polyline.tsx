import pick from 'lodash.pick';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../overlay';
import type { UIEventHandlers } from '../types/event';
import { useNavermaps } from '../use-navermaps';
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

type PolylineOptions = {
  /**
   * @type naver.maps.ArrayOfCoords | naver.maps.KVOArrayOfCoords | naver.maps.ArrayOfCoordsLiteral
   */
  path: naver.maps.ArrayOfCoords | naver.maps.KVOArrayOfCoords | naver.maps.ArrayOfCoordsLiteral;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeColor?: string;
  strokeStyle?: naver.maps.strokeStyleType;
  strokeLineCap?: naver.maps.strokeLineCapType;
  strokeLineJoin?: naver.maps.strokeLineJoinType;
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
  startIcon?: naver.maps.PointingIcon;
  startIconSize?: number;
  endIcon?: naver.maps.PointingIcon;
  endIconSize?: number;
};

export type Props = PolylineOptions & {
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
} & UIEventHandlers<typeof uiEvents>;

export const Polyline = forwardRef<naver.maps.Polyline, Props>(function Polyline(props, ref) {
  const options = pick(props, [...kvoKeys]);
  const navermaps = useNavermaps();
  const [polyline] = useState(() => new navermaps.Polyline(options));

  useImperativeHandle<naver.maps.Polyline | undefined, naver.maps.Polyline | undefined>(ref, () => polyline);

  useEffect(() => {
    polyline.setOptions(omitUndefined(options) as PolylineOptions); // TODO: FIX DefinilyTyped. setOptions의 assign type 은 Partial<Options> 이어야 함
  }, kvoKeys.map(key => options[key]));

  return (
    <Overlay element={polyline}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
});
