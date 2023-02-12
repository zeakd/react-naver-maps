import pick from 'lodash.pick';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../overlay';
import type { UIEventHandlers } from '../types/event';
import { useNavermaps } from '../use-navermaps';
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

type PolygonOptions = {
  /**
   * @type naver.maps.ArrayOfCoords[] | naver.maps.KVOArrayOfCoords[] | naver.maps.ArrayOfCoordsLiteral[]
   */
  paths: naver.maps.ArrayOfCoords[] | naver.maps.KVOArrayOfCoords[] | naver.maps.ArrayOfCoordsLiteral[];
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

export type Props = PolygonOptions & {
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
} & UIEventHandlers<typeof uiEvents>;

export const Polygon = forwardRef<naver.maps.Polygon, Props>(function Polygon(props, ref) {
  const options = pick(props, [...kvoKeys]);
  const navermaps = useNavermaps();
  const [polygon] = useState(() => new navermaps.Polygon(options));

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
