import React, { useEffect, useState } from 'react';
import { Overlay } from '../helpers/overlay';
import { HandleEvents } from '../helpers/event';
import type { UIEventHandlers } from '../types/event';
import pick from 'lodash.pick';

const kvoKeys = [
  'clickable',
  'opacity',
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

type GroundOverlayOptions = Omit<naver.maps.GroundOverlayOptions, 'map'>;

export type Props = GroundOverlayOptions & UIEventHandlers<typeof uiEvents> & {
  url: string;
  bounds: naver.maps.Bounds | naver.maps.BoundsLiteral;
  onOpacityChanged?: (value: number) => void;
  onClickableChanged?: (event: boolean) => void;
};

export function GroundOverlay(props: Props) {
  const options = pick(props, kvoKeys);
  const { url, bounds } = props;
  const [groundOverlay, setGroundOverlay] = useState(() => new naver.maps.GroundOverlay(url, bounds, options));

  useEffect(() => {
    if (groundOverlay.getUrl() !== url || groundOverlay.getBounds().equals(bounds as naver.maps.Bounds)) {
      setGroundOverlay(new naver.maps.GroundOverlay(url, bounds, options));
    }
  }, [url, bounds]);

  useEffect(() => {
    kvoKeys.forEach(key => {
      if (options[key] && groundOverlay.get(key) !== options[key]) {
        groundOverlay.set(key, options[key]);
      }
    });
  }, kvoKeys.map(key => options[key]));

  return (
    <Overlay element={groundOverlay}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
}
