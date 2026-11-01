---
'react-naver-maps': minor
---

인증 키 옵션을 `ncpKeyId` 하나로 정리. AI NAVER API 지도 API 종료(2026-11-24)에 맞춰 `ncpClientId`·`govClientId`·`finClientId` 를 제거했다. 이 옵션만 넘기면 제거 안내 에러를 던진다. (#174)

`useNavermaps` 가 따로 들고 있던 Promise 캐시를 없애고 `loadScript` 캐시 하나만 쓴다. 스크립트 로드에 실패하면 다음 렌더에서 다시 시도한다.
