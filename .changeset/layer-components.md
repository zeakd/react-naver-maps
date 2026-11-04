---
'react-naver-maps': minor
---

`LabelLayer`, `Layer`, `FlightSpot`(`react-naver-maps/panorama`) 추가. 지명 레이어, 사용자 정의 레이어, 항공뷰 지점 아이콘을 컴포넌트로 지도에 올린다.

```tsx
<NaverMap>
  <LabelLayer />
  <Layer name="tileGrid" mapTypeOrRegistry={tileGrid} zIndex={5} />
  <FlightSpot onPoiClicked={(panoId) => setPanoId(panoId)} />
</NaverMap>
```
