---
'react-naver-maps': minor
---

`GeoJson` 추가. GeoJSON 을 지도의 데이터 레이어(`map.data`)에 올린다.

```tsx
<GeoJson
  data={regions}
  style={(feature) => ({ fillColor: feature.getProperty('color') })}
  onClick={(e) => select(e.feature.getProperty('id'))}
/>
```

`style` 과 이벤트는 그 컴포넌트가 올린 feature 에만 적용된다.
