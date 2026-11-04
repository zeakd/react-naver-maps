---
'react-naver-maps': patch
---

`Activity` 로 숨겼다 보인 `Marker`(StrictMode 포함)도 나중에 `clickable` 을 켜면 클릭을 받는다. StrictMode 에서도 `DrawingManager` 가 `drawingMode` 를 지킨다(SDK 는 지도에서 떼면 HAND 로 되돌린다).
