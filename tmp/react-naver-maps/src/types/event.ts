export type UIEventHandlers<Events extends readonly string[]> = Partial<Record<`on${Capitalize<Events[number]>}`, (e: naver.maps.PointerEvent) => void>>;
