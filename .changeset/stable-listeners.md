---
'react-naver-maps': patch
---

이벤트 prop 의 핸들러가 바뀌기만 하면 SDK 리스너를 다시 붙이지 않는다. 인라인 `onClick` 이 있는 Marker 300개를 controlled center 로 끌 때 프레임마다 리스너 300개를 떼었다 붙이던 것이 없어진다. 오버레이 렌더마다 하던 이벤트 목록 계산과 SDK 접근 함수 생성도 한 번만 한다. 성능 가이드를 더한다.
