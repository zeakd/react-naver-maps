---
'react-naver-maps': minor
---

SDK 서브모듈을 하위 경로로 씁니다. 서브모듈을 불러오지 않고 쓰면 `submodules` 로 불러오는 법을 담은 에러를 냅니다.

- `react-naver-maps/geocoder`: `geocode`, `reverseGeocode` 를 Promise 로 씁니다.
- `react-naver-maps/visualization`: `HeatMap`, `DotMap`.
- `react-naver-maps/drawing`: `DrawingManager`. 그린 도형은 `onDrawingAdded` 등 이벤트로 받습니다.
- `react-naver-maps/panorama`: 거리뷰 `Panorama`(`Container` 안에 둡니다)와 항공뷰 지점 `FlightSpot`. `Panorama` 의 자식으로 `Marker`, `InfoWindow` 를 두면 거리뷰 위에 그립니다. `size`, `onInit` 을 받고 `position`, `pov` 는 지도의 카메라처럼 바뀔 때만 맞춥니다.
- `react-naver-maps/addons`: SDK 에 없는 기능. `useAutoResize` 는 지도·거리뷰 영역 크기가 바뀌면 맞춥니다.

```ts
import { geocode } from 'react-naver-maps/geocoder';
const { addresses } = await geocode(navermaps, { query: '불정로 6' });
```
