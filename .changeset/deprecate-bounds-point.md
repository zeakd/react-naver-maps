---
'react-naver-maps': minor
---

- NaverMap 의 controlled `bounds`, `centerPoint`, `defaultCenterPoint` 를 deprecated 로 표시하고 개발 모드에서 한 번 경고한다. 다음 버전에서 없앤다. 처음 영역은 `defaultBounds`, 바꿀 때는 `map.fitBounds()`, 중심은 `center` 를 쓴다
- `Container` 가 `ref` 를 받는다. 바깥 div 를 가리킨다
