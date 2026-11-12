---
'react-naver-maps': minor
---

숨겼다 보여도 같은 지도와 오버레이를 씁니다.

- 지도 안의 컴포넌트가 suspend 했다 풀리거나 `<Activity>` 로 숨겼다 보이면 지도를 새로 만들고, 오버레이가 옛 지도에 남던 문제를 고쳤습니다.
- 숨기는 동안 오버레이는 지도에서 떼고 지도는 영역을 숨깁니다. 다시 보이면 같은 인스턴스를 다시 붙이고, `open` 인 `InfoWindow` 는 다시 엽니다.
- StrictMode 의 이중 실행에서도 인스턴스를 새로 만들지 않습니다. 숨겼다 보인 `Marker` 도 나중에 `clickable` 을 켜면 클릭을 받고, `DrawingManager` 는 `drawingMode` 를 지킵니다.
