---
'react-naver-maps': minor
---

prop 을 값으로 비교합니다. 렌더마다 새로 만든 같은 값으로는 SDK 를 부르지 않습니다.

- `center={{ lat, lng }}`, `path={[...]}`, `icon={{ content, anchor: new navermaps.Point(...) }}` 처럼 인라인으로 만든 같은 값으로 렌더마다 setter 를 부르거나, 드래그한 지도가 원래 자리로 돌아가던 문제를 고쳤습니다.
- `GroundOverlay` 는 `url`, `bounds` 가 정말 바뀔 때만 다시 만듭니다.
- 이벤트 prop 의 핸들러가 바뀌기만 하면 SDK 리스너를 다시 붙이지 않습니다. 인라인 `onClick` 을 써도 됩니다.
- 오버레이의 값을 지도에서 바꾸면(예: `draggable` Marker 끌기) 다음 렌더에서 prop 으로 되돌리는 것은 0.3 과 같습니다. 받아들이려면 `onDragend` 등으로 state 를 바꿉니다.
