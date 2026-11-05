---
'react-naver-maps': patch
---

`Layer` 의 `mapTypes` 가 `projection` 을 생략한 지도 유형을 단언 없이 받는다(`LayerMapType`). SDK 는 생략하면 기본 투영을 쓴다.
