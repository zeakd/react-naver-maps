---
'react-naver-maps': minor
---

`react-naver-maps/geocoder` 추가. SDK geocoder 서브모듈을 Promise 로 쓴다.

```ts
import { geocode, reverseGeocode } from 'react-naver-maps/geocoder';
const { addresses } = await geocode(navermaps, { query: '불정로 6' });
```

`submodules={['geocoder']}` 없이 부르면 불러오는 법을 담은 에러를 던진다.
