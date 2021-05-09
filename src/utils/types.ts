export type UIEventListeners<UIEvents extends string> = {
  [k in UIEvents as `on${Capitalize<UIEvents>}`]: (value: naver.maps.PointerEvent) => void;
};
