---
'react-naver-maps': minor
---

`NavermapsProvider` 에 `language`(지도 언어 ko·en·zh·ja)와 `onAuthFailure`(인증 실패)를 더했습니다. `submodules` 는 SDK 서브모듈 이름만 받습니다.

`@types/navermaps` 를 선택 peer `^3.10.0` 으로 둡니다. TypeScript 를 쓰는 앱은 함께 올려 주세요. 3.10.0 부터 공식 문서의 멤버가 타입에 들어 있어, 라이브러리가 따로 하던 타입 보강은 없앴습니다.
