---
'react-naver-maps': minor
---

`CustomControl` 추가. React 내용을 지도의 컨트롤 자리에 그린다.

```tsx
<CustomControl position={navermaps.Position.TOP_RIGHT}>
  <button onClick={goHome}>처음 위치</button>
</CustomControl>
```

지도가 준비되기 전에 마운트해도 준비된 뒤 붙는다. `position` 을 바꾸면 옮긴다.
