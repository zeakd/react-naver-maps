---
'react-naver-maps': minor
---

공식 문서에 있는데 prop 이 없거나 타입이 좁던 것.

- `NaverMap`: `onZoomstart`, `onZoomend`, `onZoom`(GL). `onKeydown`·`onKeyup` 인자는 `{ keyboardEvent }`, `onAddLayer(layer)`, `onRemoveLayer(layername)`. `mapTypeId` 는 사용자 지도 유형 id 와 문자열도 받는다. 컨트롤 옵션은 문서처럼 모든 필드가 선택이고 `mapTypeControlOptions.hideTime` 을 받는다
- 오버레이의 KVO 변경 이벤트: `Marker` 의 `onPositionChanged` 등 공식 문서에 있는 `*_changed` 를 `on*Changed(값)` 로, `Marker` 의 `onIconLoaded`
- `Marker`: `collisionBehavior`, `collisionBoxSize`(GL)
- `InfoWindow`: `content` 에 HTML 요소, `pixelOffset` 리터럴, `autoPanPadding`, `onOpen`·`onClose` 의 포인터 이벤트 인자
- `CustomOverlay` 의 `position` 에 Point(지도 이벤트의 `e.coord`)
- `Polygon`·`Polyline` 의 `paths`·`path` 에 KVOArray
