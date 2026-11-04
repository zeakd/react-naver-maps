---
'react-naver-maps': minor
---

서브모듈에서 공식 문서대로 안 되던 것.

- `HeatMap`·`DotMap` 의 `data` 에 공식 튜토리얼의 `{ weight, location }` 리터럴. `HeatMap` 에 `colorMapInReverse`(SDK `setColorMap` 의 둘째 인자)
- `DrawingManager` 의 `onDrawingAdded` 등 인자에 SDK 가 붙인 `id`, `name`. `controlPointOptions` 타입
- `geocode` 결과의 `addressElements[].types` 는 배열이다(실제 응답과 공식 문서)
- 개발 모드 경고: `gl` 인데 gl 서브모듈이 없을 때, GL 을 다른 서브모듈과 함께 불렀을 때, `customStyleId` 지도에 내장 레이어를 올렸을 때
