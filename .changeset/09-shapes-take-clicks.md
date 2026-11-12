---
'react-naver-maps': minor
---

도형(`Circle`, `Ellipse`, `Rectangle`, `Polygon`, `Polyline`)에 `onClick` 같은 포인터 핸들러가 있으면 `clickable` 을 켭니다. SDK 기본은 꺼져 있어 0.3 에서는 핸들러가 불리지 않았습니다. 도형 위 클릭이 지도로 가야 하면 `clickable={false}` 를 적어 주세요.
