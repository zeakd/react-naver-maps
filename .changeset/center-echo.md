---
'react-naver-maps': patch
---

앱이 `onCenterChanged` 값을 늦게 되돌려줘도(비동기 store, transition, setTimeout) 지도가 지나온 자리로 당겨지며 흔들리지 않는다. 지도가 최근 2초 안에 보고한 center 와 같은(화면 1px 안) center prop 은 따르지 않는다.
