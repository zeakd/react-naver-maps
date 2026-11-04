---
'react-naver-maps': patch
---

`DrawingManager` 의 `rectangleOptions` 등 도형 스타일 옵션과 `controlPointOptions` 를 일부만 받는다(위치는 사용자가 그려서 정한다). 지도에 올린 도형을 `addDrawing` 하는 것, 종류별 그리기 이벤트를 이름으로 `addListener` 하는 것, drawing 서브모듈이 도형에 붙이는 `setEditable` 을 타입으로 더한다.
