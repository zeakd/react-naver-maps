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
    fields: ['status', 'controls', 'attached', 'mapCursor'],
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
    fields: ['status', 'events', 'circleClicks', 'mapCursor'],
    reason:
      '포인터 핸들러가 있는 도형은 clickable 을 켠다(그래서 그 위 커서도 pointer) (#194)',
  },
  'gl 서브모듈을 불러도 onZoomChanged 값은 getZoom() 과 같다': {
    fields: ['status', 'zoomReports'],
    reason: 'GL 의 내부 zoom 대신 getZoom() 을 보낸다 (#190)',
  },
  'GL 지도를 끌어 놓으면 움직임이 끝난 뒤 idle 이 한 번 온다': {
    fields: ['kvoLat'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  'GL 지도에서 zoom prop 을 바꾸면 그 zoom 이 되고 onZoomChanged 도 같다': {
    fields: ['kvoZoom'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  'GL 지도에서 반올림한 center 를 되돌려줘도 드래그 중에는 지도를 당기지 않는다':
    {
      fields: ['status', 'kvoLat', 'center', 'calls'],
      reason:
        'useKVO 가 지도를 따라간다 (#192). 드래그 중 들어온 center 는 멈춘 뒤 넣는다',
    },
  '핀치로 zoom 이 바뀌면 onZoomChanged 가 getZoom() 과 같다': {
    fields: ['kvoZoom'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  // 받는 값을 값으로 비교한다(배열은 원소마다, 객체는 키마다). 렌더마다 새로 만든 같은 값으로는
  // SDK 를 부르지 않는다. 0.3.0 은 참조로 비교해 매 렌더 불렀다.
  '상태를 갱신하지 않아도 같은 center 로 다시 렌더하면 드래그한 자리에 머문다':
    {
      fields: ['status', 'center', 'events', 'calls'],
      reason: 'center prop 을 값으로 비교한다',
    },
  '같은 좌표의 새 path 배열로 다시 렌더해도 setPath 를 부르지 않는다': {
    fields: ['status', 'calls'],
    reason: '배열 prop 을 원소마다 값으로 비교한다',
  },
  '같은 값의 새 icon 객체로 다시 렌더해도 setIcon 을 부르지 않는다': {
    fields: ['status', 'calls'],
    reason: '중첩 객체 prop 을 키마다 값으로 비교한다',
  },
  // 제스처 중 보류. 사용자가 끄는 동안과 관성이 멈출 때까지 카메라 prop 을 넣지 않고 멈춘 뒤 맞춘다.
  // 0.3.0 은 드래그 중에도 바로 panTo 했다.
  '드래그 중 들어온 center prop 은 드래그가 끝나면 지도에 반영된다': {
    fields: ['center', 'events', 'calls', 'kvoLat'],
    reason: '드래그 중 들어온 center 는 멈춘 뒤 넣는다',
  },
  '반올림한 center 를 되돌려줘도 드래그 중에는 지도를 당기지 않는다': {
    fields: ['status', 'center', 'events', 'calls', 'kvoLat'],
    reason: '드래그 중 들어온 center 는 멈춘 뒤 넣는다',
  },
  '터치로 끄는 중 반올림한 center 를 되돌려줘도 지도를 당기지 않는다': {
    fields: ['status', 'center', 'events', 'calls', 'kvoLat'],
    reason: '드래그 중 들어온 center 는 멈춘 뒤 넣는다',
  },
  // 수명. 숨겼다 보여도 같은 지도·오버레이 인스턴스를 쓴다(lifetime.ts). 0.3.0 은 숨길 때 버리고 새로 만들었다.
  '지도 안의 자식이 suspend 했다 풀려도 같은 지도에 Marker 가 붙어 있다': {
    fields: [
      'status',
      'attached',
      'calls',
      'mapId',
      'markerOnMap',
      'mapVisible',
    ],
    reason:
      '숨겼다 보여도 같은 지도를 쓴다. 숨긴 동안은 그 지도의 element 를 감춘다(mapVisible false)',
  },
  'Activity 로 지도를 숨겼다 보이면 같은 지도가 같은 크기와 center 로 돌아온다':
    {
      fields: [
        'status',
        'attached',
        'calls',
        'mapId',
        'markerOnMap',
        'mapVisible',
      ],
      reason:
        '숨겼다 보여도 같은 지도를 쓴다. 숨긴 동안은 그 지도의 element 를 감춘다(mapVisible false)',
    },
  'Activity 로 Marker 를 숨기면 지도에서 떨어지고 보이면 다시 붙는다': {
    fields: ['calls'],
    reason:
      '숨겼다 보여도 같은 Marker 를 다시 붙여 setter 를 다시 부르지 않는다',
  },
  'Activity 로 도형과 열린 InfoWindow 를 숨겼다 보이면 같은 지도에 다시 붙고 다시 열린다':
    {
      fields: ['calls', 'mapCursor'],
      reason:
        '숨겼다 보여도 같은 오버레이를 다시 붙여 setter 를 다시 부르지 않는다. 클릭 핸들러 있는 도형이 clickable 이라 커서가 pointer (#194)',
    },
  // 다시 만드는 기준(keys)을 값으로 비교한다. 0.3.0 은 렌더마다 새 bounds 객체로 다시 만들었다.
  '같은 값의 새 bounds 로 다시 렌더해도 GroundOverlay 를 다시 만들지 않고 url 이 바뀌면 만든다':
    {
      fields: ['status', 'groundOverlays'],
      reason: 'GroundOverlay 의 url, bounds 를 값으로 비교한다',
    },
  // 공식 문서 전수 대조에서 고친 것 (#215)
  'DROP 이 끝난 Marker 를 다시 렌더해도 다시 떨어지지 않는다': {
    fields: ['status', 'calls', 'markerAnimation'],
    reason:
      'animation 은 바뀔 때만 적용한다. 0.3.0 은 DROP 뒤 다시 렌더하면 다시 넣었다 (#215)',
  },
  'cursor 를 주고 올리면 지도 위 커서가 그 값이다': {
    fields: ['status', 'mapCursor'],
    reason: 'SDK 생성자가 cursor 옵션을 읽지 않아 마운트 때 맞춘다 (#215)',
  },
  // 다시 붙인 Marker 의 클릭
  'StrictMode 에서도 clickable 을 나중에 켠 Marker 가 클릭을 받는다': {
    fields: ['status', 'markerClicks'],
    reason:
      'SDK 는 붙일 때 clickable 인 Marker 에만 리스너를 단다. 붙일 때마다 켠 채로 붙인다. 0.3.0 은 StrictMode 재실행 뒤 클릭을 못 받았다',
  },
  'Activity 로 숨겼다 보인 Marker 도 clickable 을 켜면 클릭을 받는다': {
    fields: ['status', 'markerClicks', 'calls'],
    reason:
      '같은 이유. 0.3.0 은 다시 보일 때 Marker 를 새로 만들어(calls 의 setIcon 등) clickable 을 꺼진 채 붙였다',
  },
  // 튐·React 수명 확인 사례에서 고친 것
  '가까운 center 와 큰 zoom 을 함께 바꾸면 그 center 가 가운데에 온다': {
    fields: ['kvoZoom', 'kvoLat'],
    reason:
      'useKVO 가 지도를 따라간다 (#192). 0.3.0 은 이 경우 바르게 morph 했다. 0.4 의 1px 허용이 지금 zoom 으로 재던 회귀를 고쳤다',
  },
  '누르고 움직이지 않고 떼도 다음 center prop 이 곧장 반영된다': {
    fields: ['kvoLat'],
    reason: 'useKVO 가 지도를 따라간다 (#192)',
  },
  '두 InfoWindow 를 열어 두고 다시 렌더해도 서로 닫고 열기를 반복하지 않는다': {
    fields: ['status', 'calls'],
    reason:
      '인라인 anchor 를 값으로 비교해 렌더마다 다시 열지 않는다. 0.3.0 은 SDK 가 닫은 쪽을 렌더마다 다시 열어 둘이 번갈아 닫혔다',
  },
};
