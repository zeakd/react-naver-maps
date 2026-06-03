---
"react-naver-maps": patch
---

fix(load-script): submodules 로드 회귀 수정

0.2.0(v2 재작성)에서 `submodules` 옵션이 무력화되어 geocoder의 `naver.maps.Service` 등 submodule 네임스페이스가 런타임에 attach되지 않던 두 회귀를 수정한다.

- `buildUrl`: `URLSearchParams`가 submodules 쿼리의 `,`를 `%2C`로 percent-encode → naver 로더가 `maps-geocoder%2Cdrawing.js` 단일 청크를 요청해 404. 인증 키만 `URLSearchParams`로 유지하고 submodules는 raw 쉼표로 append (0.1.x 동작 복원).
- `loadScript`: 메인 script `load` 이벤트는 코어만 attach된 시점이고 submodule은 그 뒤 비동기로 로드된다. `naver.maps.onJSContentLoaded` 대기 로직을 복원해 모든 submodule attach 완료 후 resolve하도록 수정. submodules 미사용 호출자는 `jsContentLoaded`가 같은 tick에 true가 되어 동작 변화 없음.

Closes #158
