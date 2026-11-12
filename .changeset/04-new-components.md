---
'react-naver-maps': minor
---

새 컴포넌트를 더했습니다.

- `GeoJson`, `Kml`, `Gpx`: 지도의 데이터 레이어에 올립니다. `style`, 이벤트, `onPropertyChanged` 는 그 컴포넌트가 올린 feature 에만 적용됩니다.
- `CustomControl`: React 내용을 지도의 컨트롤 자리에 그립니다.
- `BicycleLayer`, `LabelLayer`, `Layer`(사용자 정의 레이어).
- `Polygon`, `Polyline`, `Rectangle`, `Ellipse` 의 `editable`(꼭짓점을 끌어 고치기, drawing 서브모듈 필요).

```tsx
<NaverMap>
  <GeoJson
    data={regions}
    style={(f) => ({ fillColor: f.getProperty('color') })}
  />
  <CustomControl position="TOP_RIGHT">
    <button onClick={goHome}>처음 위치</button>
  </CustomControl>
  <BicycleLayer />
</NaverMap>
```
