---
'react-naver-maps': minor
---

버그 수정

- 페이지가 maps.js 를 먼저 넣고 load 뒤에 마운트하면 지도가 뜨지 않던 문제
- gl 서브모듈을 불러오면 onZoomChanged 값이 getZoom() 과 다르던 문제
- 한 프레임 안에 center prop 이 되돌아오면 지도가 중간 값으로 가던 문제
