import React, { useEffect, useState } from 'react';
import { Overlay } from '../helpers/overlay';
import { HandleEvents } from '../helpers/event';
import { UIEventHandlers } from '../types/event';
import pick from 'lodash.pick';

const kvoKeys = [
  'animation',
  'position',
  'icon',
  'shape',
  'title',
  'cursor',
  'clickable',
  'draggable',
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
  // 'mousemove',
  'dragstart',
  'drag',
  'dragend',
  // 'touchstart',
  // 'touchmove',
  // 'touchend',
  // 'pinchstart',
  // 'pinch',
  // 'pinchend',
  // 'tap',
  // 'longtap',
  // 'twofingertap',
  // 'doubletap',
] as const;
const events = [...uiEvents, ...kvoEvents];

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

type Props = MarkerOptions & {
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
} & UIEventHandlers<typeof uiEvents>;

export function Marker(props: Props) {
  const { position } = props;
  const kvoOptions = pick(props, kvoKeys);
  const [marker] = useState(() => new naver.maps.Marker(kvoOptions));

  useEffect(() => {
    if (position) {
      marker.setPosition(position);
    }
  }, [position]);

  return (
    <Overlay element={marker}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
}
