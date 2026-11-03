---
'react-naver-maps': minor
---

`react-naver-maps/visualization` 추가. SDK visualization 서브모듈의 `HeatMap`, `DotMap`.

```tsx
import { HeatMap } from 'react-naver-maps/visualization';
<HeatMap data={points} radius={20} />
```

지도가 준비된 뒤 붙인다(SDK 는 준비 전에 붙인 HeatMap 을 그리지 않는다). 서브모듈 없이 쓰면 불러오는 법을 담은 에러를 던진다.
