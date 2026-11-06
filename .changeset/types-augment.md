---
'react-naver-maps': minor
---

`@types/navermaps` 를 선택적 peer `^3.10.0` 으로 둔다. TypeScript 를 쓰는 앱은 함께 올려야 한다. 3.10.0 부터 공식 문서의 멤버(`Map.addOverlayPane`, `PointerEvent.overlay`·`originalEvent`, `MarkerOptions.collisionBehavior`, `InfoWindowOptions.autoPanPadding`, `BicycleLayer`, 거리뷰에 붙는 `Marker.setMap`·`InfoWindow.open` 등)가 타입에 들어 있다. 라이브러리가 따로 더하던 타입 보강은 없앴다.
