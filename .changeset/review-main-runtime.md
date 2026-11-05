---
'react-naver-maps': patch
---

버그 수정

- 새 `mapTypes` 와 거기에만 있는 `mapTypeId` 를 함께 바꾸면 SDK 가 던져 지도가 내려가던 문제. 둘을 한 번에 넣는다
- 인증 실패 뒤 `InfoWindow` 의 `content` 를 바꾸면 앱이 내려가던 문제
- Suspense 로 숨겼다 다시 보인 `TrafficLayer` 가 `autoRefresh={false}` 를 잃던 문제
- `GeoJson`·`Kml`·`Gpx` 의 `autoStyle` 을 바꿔도 적용되지 않던 문제. 바꾸면 다시 올린다
- 지도 준비(init)를 기다리던 오버레이가 붙은 뒤에도 init 리스너가 남던 문제
- `react-naver-maps/drawing` 등 하위 경로만 가져와도 SDK 타입 보강이 들어간다
