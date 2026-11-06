---
'react-naver-maps': patch
---

`InfoWindow` 가 값을 맞춘 뒤 연다. 닫힌 창에 첫 `position` 과 `open` 을 한 렌더에 주면 던지던 것이 열리고, `content`·`position`·`open` 을 함께 바꾸면 새 값으로 연다. 첫 열기의 `onOpen` 에서 `ref` 를 읽을 수 있다.
