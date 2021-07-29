import camelcase from 'camelcase';
import pick from 'lodash.pick';
import React, { useEffect, useMemo } from 'react';
import { useMap } from '../contexts/map-context';
import { AddListener } from '../utils/event';

interface Props<T> {
  overlay: naver.maps.OverlayView;
  events: string[];
  overlayProps: T;
}

const createEventMap = (events: string[]): Record<string, string> => {
  return events.reduce((acc, eventName) => {
    const key = camelcase(`on_${eventName}`);

    return {
      [key]: eventName,
      ...acc,
    };
  }, {});
};

const OverlayView: <T>(props: Props<T>) => React.ReactElement = ({
  overlay,
  overlayProps,
  events,
}) => {
  const map = useMap();

  useEffect(() => {
    overlay.setMap(map ? map : null);
  }, [map]);

  const eventMap = useMemo(() => createEventMap(events), events);
  const listeners = pick(overlayProps, Object.keys(eventMap)) as unknown as Record<string, (e: any) => void>;

  return (
    <>
      {Object.keys(listeners).map(key => {
        const eventName = eventMap[key];
        const listener = listeners[key];
        return listener ? <AddListener
          key={key}
          target={overlay}
          type={eventName}
          listener={listener}
        /> : null;
      })}
    </>
  );
};

export default OverlayView;
