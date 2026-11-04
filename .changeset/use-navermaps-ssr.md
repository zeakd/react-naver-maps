---
'react-naver-maps': patch
---

서버 렌더에서 `Container` 밖의 `useNavermaps()` 가 서버 렌더를 멈추지 않는다. 서버에서는 오류를 던져 가장 가까운 `<Suspense>` 가 fallback 을 내보내고 브라우저에서 다시 렌더한다.
