---
'react-naver-maps': patch
---

공식 문서와 실제 SDK 로 맞춰 본 동작 수정.

- `Marker` 의 `animation={DROP}` 이 끝난 뒤 다시 렌더하면 또 떨어지던 문제. `animation` 은 바뀔 때만 적용하고, `null` 로 BOUNCE 를 멈춘다
- `NaverMap` 의 `cursor` 첫 값이 적용되지 않던 문제
- `mapTypes` 에 `MapTypeRegistry` 를 넘기고 다시 렌더하면 스택이 넘쳐 지도가 멈추던 문제. SDK 객체는 참조로 비교한다
- `blankTileImage` 는 처음 값만 쓴다(SDK 가 생성 때만 읽는다). 바꾸면 개발 모드에서 경고한다
- `Marker` 의 `onMousemove` 를 뺐다. SDK 마커는 mousemove 를 내지 않아 불린 적이 없다
