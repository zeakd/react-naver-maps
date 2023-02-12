
import camelcase from 'camelcase';
import pick from 'lodash.pick';
import { useMemo } from 'react';

import { Listener } from '../listener';

type Props = {
  events: string[];
  listeners: Record<string, (...args: any[]) => any>;
};

export function HandleEvents(props: Props) {
  const { events, listeners: _listeners } = props;

  const eventMap = useMemo(() => createEventMap(events), events);
  const listeners = pick(_listeners, Object.keys(eventMap)) as unknown as Record<string, (e: any) => void>;

  return (
    <>
      {Object.keys(listeners).map(key => {

        const eventName = eventMap[key];
        const listener = listeners[key];

        return listener ? <Listener
          key={key}
          type={eventName}
          listener={listener}
        /> : null;
      })}
    </>
  );
}


function createEventMap(events: string[]): Record<string, string> {
  return events.reduce((acc, eventName) => {
    const key = camelcase(`on_${eventName}`);

    return {
      [key]: eventName,
      ...acc,
    };
  }, {});
}
