---
'react-naver-maps': patch
---

`NaverMap` 의 `center` 리터럴을 SDK 에 넘기기 전에 `LatLng` 로 바꾼다. 투영을 생략한 사용자 지도 유형(공식 예제 "지도 유형 기본")에서 SDK 가 리터럴을 바꾸다 던지던 문제.
