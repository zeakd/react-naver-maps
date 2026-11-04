---
'react-naver-maps': patch
---

- GL 지도에서 `center`·`zoom` 을 연달아(1초 안에) 함께 바꾸면 애니메이션 없이 바로 옮긴다. 매 프레임 바뀌는 prop 을 따라가며 수십 px 뒤처지던 것을 고친다.
- GL 지도에서 앱이 `onZoomChanged` 값을 늦게 되돌려줘도 휠·핀치 줌이 되돌아가지 않는다. 지도가 최근 2초 안에 보고한 정수가 아닌 zoom 과 같은 zoom prop 은 따르지 않는다.
