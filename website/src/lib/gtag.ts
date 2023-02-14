export const GA_TRACKING_ID = 'UA-88587508-2';

type MappedTypeSnakeToCamel<InputType> = {[K in keyof InputType as SnakeToCamelCase<string & K>]: InputType[K]};

type SnakeToCamelCase<S extends string> =
  S extends `${infer T}_${infer U}` ?
  `${T}${Capitalize<SnakeToCamelCase<U>>}` :
    S;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, { page_path: url });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (action: Gtag.EventNames, { eventCategory, eventLabel, value }: MappedTypeSnakeToCamel<Gtag.EventParams>) => {
  window.gtag('event', action, {
    event_category: eventCategory,
    event_label: eventLabel,
    value: value,
  });
};
