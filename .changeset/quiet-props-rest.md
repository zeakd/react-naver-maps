---
'react-naver-maps': minor
---

버그 수정

- useKVO 로 center, zoom 을 읽으면 갱신되지 않던 문제
- 값이 그대로여도 렌더마다 setPath, setOptions 를 호출하던 문제
- 인라인 anchor 로 InfoWindow 가 렌더마다 닫혔다 열리던 문제
- clickable 을 나중에 켠 Marker 가 이벤트를 받지 못하던 문제

useControlledKVO 는 이제 prop 이 바뀔 때만 지도에 반영한다. 지도 쪽에서 바꾼 값을 재렌더로 되돌리지 않는다.
