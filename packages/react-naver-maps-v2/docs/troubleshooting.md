# 트러블슈팅 & 인사이트 기록

Phase 0+1 구현 과정에서 겪은 모든 문제와 디버깅 과정, 해결책, 교훈을 시간순으로 기록한다.

---

## 1. TypeScript 6.0 beta + nodenext 설정

### 문제

TypeScript 6.0 beta에서 `types` 컴파일러 옵션의 기본값이 `[]`로 변경되었다. 이전 버전에서는 `node_modules/@types/` 하위의 모든 타입을 자동으로 포함했지만, 6.0부터는 명시적으로 지정해야 한다.

### 증상

`naver.maps`가 전역에 존재하지 않는다는 타입 에러.

### 해결

```json
{
  "compilerOptions": {
    "types": ["navermaps"]
  }
}
```

### 인사이트

`nodenext` + `verbatimModuleSyntax` 조합에서는 모든 상대 임포트에 `.js` 확장자가 필수다. `.ts` 파일을 임포트할 때도 `.js`를 써야 한다. 이것은 TypeScript가 출력 파일의 확장자를 기준으로 해석하기 때문이다.

```typescript
// ✅
import { useKVO } from './hooks/use-kvo.js';
// ❌
import { useKVO } from './hooks/use-kvo';
import { useKVO } from './hooks/use-kvo.ts';
```

---

## 2. `Array.prototype.toSorted()` 타입 에러

### 문제

`load-script.ts`에서 캐시 키 생성 시 `submodules?.toSorted()` 사용.

### 증상

```
error TS2339: Property 'toSorted' does not exist on type 'string[]'.
```

### 원인

`toSorted()`는 ES2023 사양. 초기 `tsconfig.json`의 `target`이 `es2022`였다.

### 해결

`target`을 `es2023`으로 변경. 실제 런타임(모던 브라우저)에서 ES2023 지원은 문제 없음.

### 대안 검토

`[...arr].sort()` 패턴으로 대체 가능했지만, `toSorted()`가 의도를 더 명확히 표현하고 원본 배열을 변경하지 않는다는 점에서 target 변경이 더 나은 선택이었다.

---

## 3. `@types/navermaps`에 `naver.maps.Util` 미포함

### 문제

`useControlledKVO`에서 값 비교 시 `naver.maps.Util.equals()`를 사용하려 했으나, `@types/navermaps`에 `Util` 네임스페이스가 없다.

### 증상

```
error TS2339: Property 'Util' does not exist on type 'typeof maps'.
```

### 디버깅 과정

1. `@types/navermaps` 소스 확인 → `Util` 타입 정의 없음
2. CDN 역분석 문서에서 `Util.equals`의 내부 동작 확인: 재귀적 deep equality
3. 실제로 필요한 건 LatLng 등의 epsilon 비교 → 인스턴스의 `.equals()` 메서드로 충분

### 해결

커스텀 `kvoEquals()` 함수:

```typescript
function kvoEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'object' && typeof b === 'object' &&
      'equals' in a && typeof a.equals === 'function') {
    return a.equals(b);
  }
  return false;
}
```

### 인사이트

`@types/navermaps`는 완벽하지 않다. 특히 유틸리티 함수들(`Util.equals`, `Util.extend` 등)이 빠져있다. Phase 3에서 type augmentation으로 보완할 예정이지만, 런타임에 존재하더라도 타입이 없으면 다른 방법을 찾아야 한다.

---

## 4. KVO 타입 캐스팅

### 문제

`useControlledKVO`에서 KVO 객체의 setter를 동적으로 호출할 때, TypeScript가 `KVO` 타입에서 `Record<string, unknown>` 접근을 허용하지 않음.

### 증상

```
error TS2352: Conversion of type 'KVO' to type 'Record<string, unknown>' may be a mistake.
```

### 해결

이중 캐스트: `target as unknown as Record<string, (v: T) => void>`

### 인사이트

네이버맵 KVO 시스템은 본질적으로 동적이다. 속성 이름이 문자열이고, setter 이름도 문자열에서 파생된다. TypeScript의 정적 타입으로 이를 완전히 표현하기 어렵기 때문에, 내부 유틸리티에서는 타입 단언이 불가피하다.

---

## 5. oxlint `react-in-jsx-scope` 규칙

### 문제

React 19 + jsx transform 환경에서 `import React from 'react'`가 불필요한데, oxlint가 이를 요구.

### 해결

`.oxlintrc.json`에 규칙 비활성화:

```json
{
  "rules": {
    "react/react-in-jsx-scope": "off"
  }
}
```

---

## 6. oxlint `unicorn/prefer-add-event-listener` 규칙

### 문제

`load-script.ts`에서 `script.onload = () => {}` 패턴 사용 시 oxlint 경고.

### 해결

`script.addEventListener('load', () => {})` 패턴으로 변경. 의미적으로도 더 명확하다(여러 리스너 등록 가능).

---

## 7. oxfmt가 `dist/` 파일도 검사

### 문제

`pnpm fmt:check`에서 `dist/` 하위의 빌드 산출물까지 포맷 검사.

### 해결

`.gitignore`에 `dist/`가 이미 있지만, oxfmt는 `.gitignore`를 자동으로 참조하지 않을 수 있다. 패키지의 `.gitignore`에 `dist/`를 명시하여 해결.

---

## 8. Container ref callback 무한 루프

### 문제

Container 컴포넌트에서 ref callback을 사용하여 맵 div를 추적할 때 무한 리렌더 발생.

### 초기 구현 (문제)

```tsx
const mapDivRef = (el: HTMLDivElement | null) => {
  if (el) {
    setMapDiv(el);
    return () => setMapDiv(null);
  }
};
```

### 원인

인라인 화살표 함수는 매 렌더마다 새 참조가 된다. React는 ref가 변경되면 이전 ref의 cleanup을 호출하고 새 ref를 호출한다. 이로 인해:

1. render → ref callback 호출 → `setMapDiv(el)` → state 변경
2. re-render → 새 ref callback (다른 참조) → React가 이전 ref cleanup → `setMapDiv(null)` → state 변경
3. re-render → 새 ref callback → `setMapDiv(el)` → state 변경
4. 무한 반복

### 해결

```tsx
const [mapDiv, setMapDiv] = useState<HTMLDivElement | null>(null);
// ...
<div ref={setMapDiv} style={{ width: '100%', height: '100%' }} />
```

`useState`의 setter 함수(`setMapDiv`)는 컴포넌트 생명주기 동안 안정적인 참조(stable identity)를 유지한다. React는 ref 참조가 동일하면 cleanup/re-call을 하지 않는다.

### 인사이트

React 19에서 ref callback cleanup이 도입되면서, ref callback의 참조 안정성이 더 중요해졌다. `useCallback`으로 감싸거나 `useState` setter를 직접 전달하는 것이 가장 안전하다.

---

## 9. Suspense + `use()` + `@testing-library/react` 비호환

### 문제

smoke 테스트에서 `@testing-library/react`의 `render()`로 렌더링 시, `use(promise)`가 포함된 컴포넌트의 Suspense가 해소되지 않음.

### 증상

`render()` 호출 후 DOM에 컴포넌트가 마운트되지 않음. Suspense fallback 상태에서 멈춤.

### 원인

`@testing-library/react`의 `render()`는 내부적으로 `act()`로 감싸져 있다. `act()`는 React의 동기적 작업을 기다리지만, `use(promise)`의 Promise 해소는 비동기 마이크로태스크로 처리된다. `act()` 안에서 비동기 Suspense 해소를 올바르게 처리하지 못하는 타이밍 이슈.

### 해결

`@testing-library/react`를 사용하지 않고, `createRoot`를 직접 사용:

```typescript
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);

await act(async () => {
  root.render(<Component />);
});

// requestAnimationFrame 기반 폴링으로 Suspense 해소 대기
await new Promise<void>((resolve) => {
  const check = () => {
    if (container.querySelector('[class*="nmap"]')) {
      resolve();
    } else {
      requestAnimationFrame(check);
    }
  };
  requestAnimationFrame(check);
});
```

### 인사이트

React 19의 `use()` 훅은 아직 테스팅 라이브러리 생태계와 완벽하게 호환되지 않는다. Suspense 기반 데이터 로딩 패턴을 테스트할 때는 lower-level API를 직접 사용하는 것이 더 안정적이다.

---

## 10. Vitest browser mode 포트 설정

### 문제

NCP API 키가 `localhost:3000`에만 인증되도록 등록되어 있어서, Vitest browser mode도 3000 포트에서 실행해야 했다.

### 시행착오

```typescript
// ❌ 작동하지 않음 — server.port는 HMR/file server 포트
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
  server: { port: 3000 },
});
```

### 해결

```typescript
// ✅ browser.api.port가 브라우저가 접속하는 실제 포트
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      api: { port: 3000 },
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

### 인사이트

Vitest browser mode에서 `server.port`와 `browser.api.port`는 다른 것이다. `server.port`는 파일 서빙/HMR 서버의 포트이고, `browser.api.port`가 실제 브라우저가 테스트 페이지에 접속하는 포트다.

---

## 11. `ncpKeyId` vs `ncpClientId` 혼동

### 문제

네이버맵 스크립트 URL의 쿼리 파라미터명이 라이브러리 prop명과 다름.

### 원인

v1 코드에서 라이브러리 prop은 `ncpKeyId`인데, 실제 API URL 쿼리 파라미터는 `ncpClientId`다. 초기 구현에서 prop명을 그대로 쿼리 파라미터로 사용하여 인증 실패.

### 해결

`load-script.ts`에서 매핑:

```typescript
const params = new URLSearchParams({
  ncpClientId: options.ncpKeyId,  // prop명 → 쿼리 파라미터명 매핑
});
```

### 인사이트

라이브러리의 공개 API 이름(prop명)과 외부 서비스의 파라미터명이 다를 수 있다. v1과의 하위 호환성을 위해 prop명은 유지하되, 내부 구현에서 올바르게 매핑해야 한다.

---

## 12. Map을 useState 초기화에서 생성 vs useEffect에서 생성

### 문제

초기 플랜에서는 `useState` 초기화 함수로 Map을 생성하려 했다:

```typescript
const [map] = useState(() => new navermaps.Map(container!, options));
```

### 증상

Map 생성자가 render phase에서 호출되어 DOM을 직접 변경 → React의 가상 DOM과 실제 DOM 불일치.

### 원인

`useState`의 초기화 함수는 React의 render phase에서 실행된다. 이 시점에서 DOM을 직접 변경하는 것은 React의 규칙에 어긋난다. 네이버맵 Map 생성자는 전달받은 DOM 요소의 innerHTML을 완전히 교체하고, 스타일을 변경하고, 자식 요소를 추가한다.

### 해결

`useEffect`로 이동:

```typescript
useEffect(() => {
  const instance = new navermaps.Map(container!, options);
  setMap(instance);
  return () => { instance.destroy(); };
}, []);
```

### 인사이트

외부 라이브러리가 DOM을 직접 조작하는 경우 (지도, 차트, 에디터 등), 반드시 effect 단계(useEffect/useLayoutEffect)에서 초기화해야 한다. v1도 `useLayoutEffect`를 사용했다. v2에서는 `useEffect`를 사용하는데, 이는 Map의 타일 로딩이 어차피 비동기이므로 `useLayoutEffect`의 동기적 DOM 차단이 불필요하기 때문이다.

---

## 13. 맵 타일 미렌더링 — 핵심 디버깅 과정 (Critical)

이 섹션은 가장 오래 걸린 디버깅 과정을 상세히 기록한다.

### 증상

- 맵 DOM 구조가 생성됨 (tabindex, cursor, background 등)
- 하지만 타일 이미지(img/canvas)가 전혀 없음
- `init` 이벤트가 발생하지 않음
- 콘솔 에러 없음 (silent failure)

### 디버깅 타임라인

#### 1단계: 현상 확인

브라우저에서 `localhost:3000` 접속 → 빈 화면. DOM 검사 결과 맵의 컨테이너 div가 네이버맵에 의해 수정됨(tabindex, overflow:hidden 등)을 확인. 하지만 내부에 타일 관련 요소 없음 (descendants: 10 vs 정상: 59).

#### 2단계: 바닐라 JS 대조 실험

같은 페이지에서 `browser_evaluate`로 바닐라 JS 맵 생성 → **정상 동작** (16개 타일 이미지, init 이벤트 발생).

```javascript
// 같은 페이지에서 이 코드는 정상 동작
const map = new naver.maps.Map(newDiv, {
  center: { lat: 37.5666, lng: 126.9784 },
  zoom: 16,
});
```

이 시점에서 "React의 무언가가 맵 초기화를 방해한다"는 가설 형성.

#### 3단계: 가설 검증 — React 실행 컨텍스트

**가설**: `useEffect` 내부의 실행 컨텍스트가 문제일 수 있다.

**실험**: `setTimeout(0)`으로 useEffect에서 탈출한 뒤 Map 생성 → **여전히 실패**.

**결론**: useEffect 실행 컨텍스트는 원인이 아님.

#### 4단계: 가설 검증 — `navermaps` 참조

**가설**: `useNavermaps()`가 반환한 `navermaps` 참조가 `naver.maps`와 다를 수 있다.

**실험**: `naver.maps.Map`을 직접 사용 → **여전히 실패**. 로그에서 `navermaps === naver.maps: true` 확인.

**결론**: 참조 문제 아님.

#### 5단계: 가설 검증 — `setMap` 상태 업데이트

**가설**: `setMap(instance)` 호출이 트리거하는 리렌더가 맵 초기화를 방해한다.

**실험**: `setMap` 호출 제거, `return null`만 반환 → **여전히 실패**.

**결론**: 상태 업데이트 아님. `new navermaps.Map()` 호출 자체만으로 이미 실패하고 있었음.

#### 6단계: 가설 검증 — Container/Suspense 구조

**가설**: Container 컴포넌트나 Suspense 경계가 문제.

**실험**: 라이브러리 코드를 사용하지 않고, 최소 React 컴포넌트에서 직접 맵 생성:

```tsx
function App() {
  const divRef = useRef(null);
  useEffect(() => {
    const map = new naver.maps.Map(divRef.current, options);
    // ...
  }, [loaded]);
  return <div ref={divRef} style={{...}} />;
}
```

→ **정상 동작**.

**추가 실험**: Container + ContainerContext + useNavermaps() + Suspense 조합 → **정상 동작**.

**추가 실험**: 위에 `useState` + `setMap` + `useControlledKVO` 추가 → **정상 동작**.

**결론**: 라이브러리의 개별 구성요소는 모두 정상. NaverMap 컴포넌트 고유의 문제.

#### 7단계: 차이점 분석

정상 동작하는 테스트 코드 vs 실패하는 NaverMap 컴포넌트의 차이를 비교:

| 항목 | 테스트 코드 | NaverMap |
|------|-----------|----------|
| Map 옵션 | `{ center, zoom }` | `{ center, zoom, mapTypeId, minZoom, maxZoom, draggable, scrollWheel, pinchZoom, logoControl }` |
| undefined 값 | 없음 | `mapTypeId: undefined, minZoom: undefined, ...` |

**핵심 발견**: NaverMap은 props에서 비구조화된 값들을 그대로 옵션 객체에 포함시키므로, 사용자가 전달하지 않은 속성도 `undefined` 값으로 명시적으로 포함됨.

#### 8단계: 근본 원인 확인

```javascript
// 바닐라 JS에서 재현
new naver.maps.Map(div, {
  center: { lat: 37.5666, lng: 126.9784 },
  zoom: 16,
  mapTypeId: undefined,  // ← 이것이 원인
});
// → init 이벤트 미발생, 타일 로드 안됨
```

**확정**: `mapTypeId: undefined`를 명시적으로 전달하면 네이버맵 내부에서 기본 mapType(NORMAL)을 설정하지 않고 undefined를 그대로 사용한다. mapType이 없으면 타일 레이어가 생성되지 않아 init이 완료되지 않는다.

#### 소요 시간 분포

- 현상 확인 + 바닐라 대조: 15분
- React 실행 컨텍스트 검증: 20분
- navermaps 참조 검증: 5분
- setMap/setState 검증: 10분
- Container/Suspense 검증: 5분
- 최소 재현 + 개별 부품 검증: 15분
- 차이점 분석 + 근본 원인: 10분
- **총: ~80분**

### 교훈

1. **`{ key: undefined }`와 `{}`는 다르다.** JavaScript에서 `'key' in { key: undefined }`는 `true`다. 외부 라이브러리가 `in` 연산자로 옵션 존재 여부를 체크하면, undefined 값도 "존재하는 옵션"으로 취급된다.

2. **Silent failure는 가장 디버깅하기 어렵다.** 네이버맵은 `mapTypeId: undefined`에 대해 에러를 던지지 않고, 단순히 타일을 로드하지 않는다. 콘솔 에러도 없다. 이런 경우 이분 탐색(binary search) 방식의 차이점 좁히기가 효과적이다.

3. **바닐라 대조 실험을 먼저 하라.** React 문제인지 라이브러리 문제인지 빠르게 구분할 수 있다. 이 케이스에서는 바닐라도 같은 방식으로 실패하므로 React 특유의 문제가 아님을 일찍 확인할 수 있었다 — 다만, 바닐라 실험 시 "동일한 옵션"을 사용하지 않아 발견이 늦어졌다.

4. **"동일한 옵션"의 정의를 정밀하게 하라.** `{ center, zoom }`과 `{ center, zoom, mapTypeId: undefined }`는 개발자 관점에서 "같은" 옵션이지만, JavaScript 엔진과 외부 라이브러리 관점에서는 다르다.

5. **React 래퍼에서 외부 라이브러리에 옵션을 전달할 때는 항상 undefined를 제거하라.** 이것은 react-naver-maps에만 해당하는 것이 아니라, 모든 React 래퍼 라이브러리에 적용되는 범용 패턴이다.

---

## 14. Marker `fromCoordToPoint` 에러

### 문제

NaverMap + Marker를 함께 렌더링하면 `Cannot read properties of undefined (reading 'clone')` 에러 발생.

### 원인

맵의 `init` 이벤트가 발생하기 전에 Marker를 생성하면, 맵의 projection이 아직 초기화되지 않아 좌표 변환(`fromCoordToPoint`) 단계에서 실패한다.

### 해결

이 문제는 #13의 `mapTypeId: undefined` 문제와 동일 근본 원인이었다. 맵이 정상적으로 init되면 Marker 생성 시점에 projection이 준비되어 있으므로 에러가 발생하지 않는다.

맵의 `init` 완료 후에만 자식(Marker 등)이 렌더되도록 하는 것이 이상적이지만, 현재 구현에서는 맵의 `useEffect` → `setMap` → re-render → Marker의 `useEffect` 순서로, Marker 생성 시점에 이미 맵이 생성된 상태다. 맵이 정상 초기화되면 projection도 빠르게 준비되므로 실제로 문제가 없다.

### 인사이트

`init` 이벤트 전에 오버레이를 추가하면 네이버맵 내부의 `_pendingOptions` 큐에 쌓이다가 init 후 처리된다 — 하지만 이는 맵이 정상 초기화될 때만 동작한다.

---

## 15. Vitest browser mode에서 포트 충돌

### 문제

dev 서버(vite)가 3000 포트를 사용 중일 때 `pnpm test`를 실행하면, vitest도 3000 포트를 사용하려 하여 충돌.

### 증상

```
Port 3000 is in use, trying another one...
```

Vitest가 3001, 3002... 등으로 자동 폴백하면 NCP API 키 인증이 실패하여 테스트 실패.

### 해결

dev 서버와 테스트를 동시에 실행하지 않는다. 테스트 실행 시에는 dev 서버를 중지해야 한다.

### 향후 개선

NCP 콘솔에서 여러 포트를 등록하거나, 테스트용 별도 API 키를 사용하는 방안 검토.

---

## 전체 인사이트 요약

### 네이버맵 API에 대해

1. 생성자에 명시적 undefined 전달 금지 → `omitUndefined()` 필수
2. `destroy()`가 이벤트 리스너를 완전히 정리하지 않음 → `clearInstanceListeners()` 별도 호출
3. `init` 이벤트 전에는 projection 미준비 → 오버레이 좌표 변환 불가
4. NCP API 키는 도메인+포트에 묶임 → 개발/테스트 환경 포트 고정 필요

### React 19 + 외부 라이브러리 래핑에 대해

1. DOM을 직접 조작하는 외부 라이브러리는 반드시 effect에서 초기화
2. `use()` + Suspense 패턴은 `@testing-library/react`와 호환 이슈 있음
3. ref callback의 참조 안정성이 중요 → `useState` setter나 `useCallback` 사용
4. `useSyncExternalStore`는 외부 상태(KVO) 동기화에 이상적
5. React 19의 `<Context value={}>` 직접 사용으로 코드가 간결해짐

### 디버깅 방법론에 대해

1. 바닐라 대조 실험으로 React 문제 vs 라이브러리 문제 빠르게 구분
2. 이분 탐색: 복잡한 시스템에서 문제를 좁힐 때 가장 효과적
3. "동일 조건"을 정의할 때 JavaScript의 미묘한 차이(undefined in object 등)에 주의
4. Silent failure는 콘솔 에러 없이 발생 → 적극적으로 init/lifecycle 이벤트를 모니터링
