---
'react-naver-maps': minor
---

GroundOverlay 가 같은 값의 새 `bounds` 객체로 다시 렌더할 때마다 새로 만들어지던 문제. `url`, `bounds` 를 값으로 비교해 정말 바뀔 때만 다시 만든다.
