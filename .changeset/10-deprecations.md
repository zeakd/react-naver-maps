---
'react-naver-maps': minor
---

`NaverMap` 의 controlled `bounds`, `centerPoint`, `defaultCenterPoint` 는 deprecated 입니다. 개발 모드에서 한 번 경고하고 다음 버전에서 없앱니다. 처음 영역은 `defaultBounds`, 바꿀 때는 `map.fitBounds()`, 중심은 `center` 를 써 주세요.

`Container` 가 `ref` 를 받습니다(바깥 div).
