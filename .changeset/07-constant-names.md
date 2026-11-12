---
'react-naver-maps': minor
---

SDK 상수를 받는 prop 이 이름도 받습니다. SDK 상수도 그대로 받고, 없는 이름이면 쓸 수 있는 이름을 담은 오류를 냅니다.

```tsx
<NaverMap zoomControl zoomControlOptions={{ position: 'TOP_RIGHT', style: 'SMALL' }} />
<Marker animation="BOUNCE" />
<DrawingManager drawingMode="POLYGON" />
```
