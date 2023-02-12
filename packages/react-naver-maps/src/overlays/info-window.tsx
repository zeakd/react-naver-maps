import pick from 'lodash.pick';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../overlay';
import type { UIEventHandlers } from '../types/event';
import { useNavermaps } from '../use-navermaps';
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

type InfoWindowOptions = {
  /**
   * position
   * @type naver.maps.Coord | naver.maps.CoordLiteral
   */
  position?: naver.maps.Coord | naver.maps.CoordLiteral;
  content: string;
  zIndex?: number;
  maxWidth?: number;
  /**
   * @type naver.maps.Point | naver.maps.PointLiteral
   */
  pixelOffset?: naver.maps.Point | naver.maps.PointLiteral;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  disableAutoPan?: boolean;
  disableAnchor?: boolean;
  anchorSkew?: boolean;
  /**
   * @type naver.maps.Size | naver.maps.SizeLiteral
   */
  anchorSize?: naver.maps.Size | naver.maps.SizeLiteral;
  anchorColor?: string;
};

export type Props = InfoWindowOptions & {
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
} & UIEventHandlers<typeof uiEvents>;

export const InfoWindow = forwardRef<naver.maps.InfoWindow, Props>(function InfoWindow(props, ref) {
  const { position } = props;
  const navermaps = useNavermaps();
  const [infoWindow] = useState(() => new navermaps.InfoWindow(omitUndefined(pick(props, [...kvoKeys])) as InfoWindowOptions));

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
