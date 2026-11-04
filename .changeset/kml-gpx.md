---
'react-naver-maps': minor
---

`Kml`, `Gpx` 추가. XML `Document` 를 지도의 데이터 레이어에 올린다. `GeoJson` 과 `style`·`autoStyle`·이벤트가 같다.

```tsx
<Kml data={new DOMParser().parseFromString(kmlText, 'text/xml')} />
```

`GeoJson`, `Kml`, `Gpx` 에 `onPropertyChanged` 추가. 자기가 올린 feature 의 `setProperty` 만 받는다.
