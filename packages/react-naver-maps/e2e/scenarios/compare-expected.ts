import type { TraceFrame } from './types.js';

type Field = keyof TraceFrame | 'status' | 'frames' | 'trace';

/**
 * 배포본과 소스 사이에서 의도한 동작 차이. 시나리오 이름 → 달라져도 되는 필드와 이유.
 *
 * `e2e/compare.ts` 는 여기 없는 시나리오의 차이, 그리고 적은 필드 밖의 차이를 실패로 친다.
 * `status` 는 시나리오 판정(통과·실패)이 바뀌는 것이다. 이유에는 바뀐 동작과 근거를 적는다.
 * 기준: 0.3.0.
 */
export const expectedDifferences: Record<
  string,
  { fields: Field[]; reason: string }
> = {
  // useKVO 가 Map 자체 KVO(center, zoom)를 구독한다. 0.3.0 은 첫 값에 멈춰 있었다 (#192).
  'center prop 변경은 setCenter 를 쓰지 않는다': {
    fields: ['kvoLat'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  'center 와 zoom 을 함께 바꾸면 morph 한 번으로 처리한다': {
    fields: ['kvoLat', 'kvoZoom'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  'panTo 도중 목표를 바꿔도 새 목표로 곧장 간다': {
    fields: ['kvoLat'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  'panTo 도중 center prop 이 바뀌면 prop 값으로 끝난다': {
    fields: ['kvoLat'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  'useKVO 는 지도 이동과 줌을 따라간다': {
    fields: ['status', 'kvoLat', 'kvoZoom'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  'gl 없으면 onZoomChanged 값은 getZoom() 과 같다': {
    fields: ['kvoZoom'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  '한 프레임 안에 center prop 이 되돌아오면 처음 값에 머문다': {
    fields: ['status', 'center', 'events'],
    reason: '요청한 center 를 기억하고 진행 중 이동을 멈춘다 (#190)',
  },
  'key 로 다시 만든 지도가 화면에 남는다': {
    fields: ['status', 'controls', 'attached'],
    reason: '지도마다 자기 div 를 만든다 (#191)',
  },
  '값이 그대로면 재렌더해도 setter 를 부르지 않는다': {
    fields: ['status', 'calls'],
    reason: '직전 prop 과 비교해 같으면 setter 를 부르지 않는다 (#192)',
  },
  '인라인 anchor 로 재렌더해도 InfoWindow 를 다시 열지 않는다': {
    fields: ['status', 'calls'],
    reason: '열린 상태를 기억해 다시 열지 않는다 (#192)',
  },
  'clickable 을 나중에 켠 Marker 도 클릭을 받는다': {
    fields: ['status', 'markerClicks'],
    reason: 'Marker 를 clickable 로 만든 뒤 끈다 (#192)',
  },
  'onClick 이 있는 도형은 clickable 없이도 클릭을 받는다': {
    fields: ['status', 'events', 'circleClicks'],
    reason: '포인터 핸들러가 있는 도형은 clickable 을 켠다 (#194)',
  },
  'gl 서브모듈을 불러도 onZoomChanged 값은 getZoom() 과 같다': {
    fields: ['status', 'zoomReports'],
    reason: 'GL 의 내부 zoom 대신 getZoom() 을 보낸다 (#190)',
  },
  // 고칠 차이. 소스가 0.3.0 보다 나빠진 것이라 고치면 이 항목을 지운다.
  '드래그한 Marker 는 다시 렌더하면 position 으로 돌아간다': {
    fields: ['status', 'calls', 'markerPosition'],
    reason:
      '#192 가 SDK 쪽 변경을 되돌리던 동작을 없앴다. 0.3.0 동작으로 되살린다',
  },
};
