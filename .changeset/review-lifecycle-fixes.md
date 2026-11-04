---
'react-naver-maps': patch
---

버그 수정

- 지도의 자식이 transition 밖에서 suspend 했다 풀리면, 열어 둔 `InfoWindow` 가 닫힌 채 남던 문제
- 지도 init 전에 `DrawingManager` 의 `drawingMode` 를 바꾸면 init 때 처음 값으로 돌아가던 문제
