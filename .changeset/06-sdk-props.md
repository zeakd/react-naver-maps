---
'react-naver-maps': minor
---

공식 문서에 있는 옵션과 이벤트를 prop 으로 받습니다.

- `NaverMap`, `Marker`, `InfoWindow`, 도형이 목록에 없는 SDK 옵션도 받습니다. SDK 에 새 옵션이 생겨도 라이브러리를 올리지 않고 쓸 수 있습니다.
- 오버레이의 변경 이벤트를 `on*Changed(값)` 로 받습니다(예: `Marker` 의 `onPositionChanged`). `Marker` 의 `onIconLoaded`, `collisionBehavior`, `collisionBoxSize`(GL).
- `NaverMap`: `onZoomstart`, `onZoomend`, `onZoom`(GL), `onAddLayer`, `onRemoveLayer`. `onKeydown`·`onKeyup` 인자는 `{ keyboardEvent }`. `mapTypeId` 는 사용자 지도 유형 id 도 받고, 컨트롤 옵션은 모든 필드가 선택입니다.
- `InfoWindow`: `content` 에 HTML 요소, `pixelOffset` 리터럴, `autoPanPadding`. `CustomOverlay` 의 `position` 에 Point, `Polygon`·`Polyline` 의 `paths`·`path` 에 KVOArray.
- `HeatMap`·`DotMap` 의 `data` 에 `{ weight, location }` 리터럴, `HeatMap` 의 `colorMapInReverse`. `DrawingManager` 의 도형 스타일 옵션과 이벤트 인자의 `id`, `name`.
