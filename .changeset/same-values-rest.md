---
'react-naver-maps': minor
---

prop 을 값으로 비교한다. 렌더마다 새로 만든 같은 값으로는 SDK 를 부르지 않는다.

- 인라인 배열 `path={[...]}`, 인라인 객체 `icon={{ content, anchor: new navermaps.Point(...) }}` 로 렌더마다 setter 를 부르던 문제
- `center={{ lat, lng }}` 처럼 같은 값의 새 객체로 다시 렌더하면 드래그한 지도가 원래 자리로 돌아가던 문제

prop 을 준 값은 지도 쪽에서 바뀌면(예: `draggable` Marker 를 끌기) 다음 렌더에서 prop 으로 되돌린다. 0.3.0 과 같다. 받아들이려면 이벤트(`onDragend` 등)로 상태를 갱신한다. 카메라(`center`, `zoom`)는 되돌리지 않는다.
