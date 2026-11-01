---
'react-naver-maps': patch
---

StrictMode(dev)의 mount → cleanup → setup 에서 NaverMap 이 지도를 destroy 하고 새로 만들던 문제 수정. destroy 를 microtask 로 미뤄 다시 실행된 setup 이 기존 인스턴스를 재사용한다. 지도가 두 번 초기화되며 로고·축척 컨트롤이 두 벌 남던 현상과, gl 서브모듈에서 보고된 인증 실패(#171)를 막는다.
