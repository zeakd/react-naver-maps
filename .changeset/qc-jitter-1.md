---
'react-naver-maps': patch
---

- 가까운 `center` 와 큰 `zoom` 을 함께 바꾸면 center 를 버리던 것을 고친다(같은 자리 판정을 바뀐 zoom 으로 잰다).
- 드래그 중 `Activity` 로 지도를 숨겼다 보이면 그 뒤 카메라 prop 을 계속 무시하던 것을 고친다.
- 같은 지도에 `open` 인 `InfoWindow` 가 둘이거나 사용자가 닫은 정보 창이 있을 때, 인라인 `anchor` 로 다시 렌더하면 렌더마다 다시 열던 것을 고친다.
