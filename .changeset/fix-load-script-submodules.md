---
"react-naver-maps": patch
---

fix(load-script): submodules 로드 회귀 수정 (#159)

0.2.0에서 `submodules` 옵션이 무력화되던 두 회귀를 수정한다.

- URL의 쉼표가 `%2C`로 인코딩되어 submodule 청크가 404나던 문제 → raw 쉼표 복원
- submodule attach(`onJSContentLoaded`) 전에 resolve하던 문제 → attach 완료까지 대기

Closes #158
