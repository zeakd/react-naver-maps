import pick from 'lodash.pick';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../overlay';
import type { UIEventHandlers } from '../types/event';
import { useNavermaps } from '../use-navermaps';

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

type GroundOverlayOptions = {
  clickable?: boolean;
  opacity?: number;
};

export type Props = GroundOverlayOptions & {
  url: string;
  /**
   * bounds
   * @type naver.maps.Bounds | naver.maps.BoundsLiteral
   */
  bounds: naver.maps.Bounds | naver.maps.BoundsLiteral;
  onOpacityChanged?: (value: number) => void;
  onClickableChanged?: (event: boolean) => void;
} & UIEventHandlers<typeof uiEvents>;

export const GroundOverlay = forwardRef<naver.maps.GroundOverlay, Props>(function GroundOverlay(props, ref) {
  const options = pick(props, kvoKeys);
  const { url, bounds } = props;
  const navermaps = useNavermaps();
  const [groundOverlay, setGroundOverlay] = useState(() => new navermaps.GroundOverlay(url, bounds, options));

  useImperativeHandle<naver.maps.GroundOverlay | undefined, naver.maps.GroundOverlay | undefined>(ref, () => groundOverlay, [groundOverlay]);

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
});
