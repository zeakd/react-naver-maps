# react-naver-maps v2 — Phase 0 + Phase 1 작업 기록

작업일: 2026-03-02

## 목표

React 19 전용 신규 패키지 `packages/react-naver-maps-v2/` 생성.
Phase 0(프로젝트 세팅) + Phase 1(코어 인프라 + NaverMap + Marker) 구현.

---

## Phase 0: 프로젝트 세팅

### 생성한 설정 파일

| 파일 | 용도 |
|------|------|
| `package.json` | ESM only, `exports` 단일 진입점, peerDeps react 19 |
| `tsconfig.json` | `nodenext`, `es2023`, `verbatimModuleSyntax`, `types: ["navermaps"]` |
| `.oxlintrc.json` | oxlint 설정 (react 19, typescript, unicorn, import 플러그인) |
| `.oxfmtrc.json` | oxfmt 설정 (싱글 따옴표, 2스페이스, trailing comma) |
| `vitest.config.ts` | Vitest browser mode (Playwright chromium, port 3000) |
| `.gitignore` | `dist/`, `node_modules/` |

### 설계 결정

- **진입점**: `src/react-naver-maps.ts` 하나로 모든 공개 API export. 하위 디렉토리에 `index.ts` 없음.
- **빌드**: `tsc -b` (TypeScript 6.0 beta). ESM only, `nodenext` resolution (`.js` 확장자 필수).
- **타겟**: `es2023` — `Array.prototype.toSorted()` 사용을 위해 es2022에서 변경.
- **런타임 의존성**: 0개. `peerDependencies`만 react/react-dom 19.
- **테스트 포트**: 3000 고정 — NCP API 키 인증이 특정 도메인/포트에 묶여있음.

---

## Phase 1: 코어 인프라 + NaverMap + Marker

### 파일 구조

```
src/
├── react-naver-maps.ts          ← 공개 API barrel export
├── load-script.ts               ← 네이버맵 스크립트 로더
├── provider.tsx                 ← NavermapsProvider
├── container.tsx                ← Container (맵 div + Suspense)
├── naver-map.tsx                ← NaverMap 컴포넌트
├── marker.tsx                   ← Marker 컴포넌트
├── contexts/
│   ├── client-options.ts        ← NCP 옵션 Context
│   ├── container.ts             ← 맵 div Element Context
│   └── naver-map.ts             ← Map 인스턴스 Context
├── hooks/
│   ├── use-navermaps.ts         ← use() + Promise 캐시 → Suspense 스크립트 로딩
│   ├── use-map.ts               ← NaverMapContext 소비
│   ├── use-kvo.ts               ← useSyncExternalStore + KVO 이벤트 구독
│   └── use-controlled-kvo.ts    ← 양방향 KVO prop 동기화
├── utils/
│   └── omit-undefined.ts        ← undefined 키 제거 유틸리티
└── __tests__/
    └── smoke.spec.tsx           ← 통합 테스트 (실제 API)
    hooks/__tests__/
    ├── use-kvo.spec.tsx         ← KVO 훅 단위 테스트
    └── use-controlled-kvo.spec.tsx ← controlled KVO 단위 테스트
```

### 공개 API

```typescript
// Components
export { NavermapsProvider } from './provider.js';
export { Container } from './container.js';
export { NaverMap } from './naver-map.js';
export { Marker } from './marker.js';

// Hooks
export { useNavermaps, preloadNavermaps } from './hooks/use-navermaps.js';
export { useMap } from './hooks/use-map.js';
export { useKVO } from './hooks/use-kvo.js';
export { useControlledKVO } from './hooks/use-controlled-kvo.js';

// Types
export type { LoadOptions } from './load-script.js';
export type { NavermapsProviderProps } from './provider.js';
export type { ContainerProps } from './container.js';
export type { NaverMapProps } from './naver-map.js';
export type { MarkerProps } from './marker.js';
```

### 각 모듈 상세

#### `load-script.ts` — 스크립트 로더

- `<script>` 태그를 동적으로 삽입하여 `naver.maps` 로드.
- `Promise<typeof naver.maps>` 반환. 모듈 스코프 `Map<string, Promise>` 캐시로 중복 로드 방지.
- 쿼리 파라미터: `ncpClientId` (NCP 콘솔의 Client ID).
- `submodules` 옵션으로 추가 모듈(geocoder, drawing 등) 로드 지원.

#### `provider.tsx` — NavermapsProvider

- `ClientOptionsContext`에 NCP 옵션을 제공.
- React 19 `preconnect('https://oapi.map.naver.com')` 호출 → DNS prefetch.
- React 19 `<Context value={...}>` 직접 사용 (`.Provider` 불필요).

#### `container.tsx` — Container

- 외부 div (`position: relative` + 사용자 style) 안에 내부 div (`width: 100%; height: 100%`) 생성.
- 내부 div를 `ContainerContext`로 제공 → NaverMap이 이 div 위에 맵 생성.
- `ref={setMapDiv}` — useState setter를 ref로 사용 (안정적 함수 identity → 무한 루프 방지).
- 자식은 `<Suspense>` 안에 렌더 → `useNavermaps()`의 `use()` 서스펜스 지원.

#### `naver-map.tsx` — NaverMap

- `useEffect` 안에서 `new navermaps.Map(container, options)` 호출.
- `omitUndefined()`로 undefined 옵션 제거 후 전달 (**중요 — 아래 버그 섹션 참조**).
- `useState`로 맵 인스턴스 관리. 맵이 set되면 `NaverMapInner` 렌더.
- `NaverMapInner`: `useControlledKVO`로 `center`/`zoom` 양방향 동기화 + UI 이벤트 바인딩.
- cleanup: `clearInstanceListeners()` → `destroy()`.
- React 19: `ref` as prop (forwardRef 불필요), `useImperativeHandle`로 맵 인스턴스 노출.

#### `marker.tsx` — Marker

- NaverMap과 동일 패턴: `useEffect` + `omitUndefined()` + `useState` + Inner 컴포넌트.
- `useMap()` 훅으로 부모 `NaverMapContext`에서 맵 인스턴스 획득.
- KVO 동기화: position, visible, clickable, draggable, zIndex, icon, title.
- cleanup: `clearInstanceListeners()` → `setMap(null)`.

#### `use-kvo.ts` — KVO 읽기 (useSyncExternalStore)

```
subscribe: naver.maps.Event.addListener(target, `${property}_changed`, callback)
getSnapshot: target.get(property)
```

- React의 concurrent mode 안전한 외부 스토어 구독.
- KVO 속성 변경 시 자동으로 React 리렌더 트리거.

#### `use-controlled-kvo.ts` — KVO 양방향 동기화

```
[읽기] KVO → useSyncExternalStore → React 상태
[쓰기] props 변경 → useEffect → equals 비교 → setter 호출
```

- `value === undefined`이면 uncontrolled → 쓰기 스킵.
- `kvoEquals()`: `===` 비교 후, 객체면 `.equals()` 메서드 사용 (LatLng 등의 epsilon 비교).
- 무한 루프 방지: equals가 true면 setter 미호출.
- setter 이름 규칙: `set{Property}()` 메서드가 있으면 사용, 없으면 `target.set(property, value)`.

#### `omit-undefined.ts` — undefined 키 제거

```typescript
export function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T>
```

네이버맵 생성자에 `{ mapTypeId: undefined }` 같은 명시적 undefined를 전달하면 내부 초기화가 실패하므로, undefined 키를 제거하여 네이버맵이 기본값을 사용하도록 한다.

---

## 발견한 버그 및 해결

### 1. `mapTypeId: undefined` → 맵 초기화 실패 (Critical)

**증상**: 맵 DOM 구조는 생성되지만 (tabindex, cursor 등) 타일이 로드되지 않고 `init` 이벤트가 발생하지 않음.

**원인**: `naver.maps.Map` 생성자에 `{ mapTypeId: undefined, minZoom: undefined, ... }` 형태로 명시적 undefined 값을 전달하면, 네이버맵 내부에서 기본값 대신 undefined를 사용하여 mapType 설정을 건너뜀. `in` 연산자로 키 존재 여부를 체크하는 내부 로직이 원인으로 추정.

**재현**: 바닐라 JS에서도 동일 재현.
```javascript
// ❌ 타일 로드 안됨
new naver.maps.Map(div, { center: {...}, zoom: 16, mapTypeId: undefined });

// ✅ 정상 동작
new naver.maps.Map(div, { center: {...}, zoom: 16 });
```

**해결**: `omitUndefined()` 유틸리티로 생성자 옵션에서 undefined 값을 가진 키를 제거.

**영향 범위**: NaverMap, Marker 생성자 모두 적용. 향후 추가될 오버레이 컴포넌트에도 동일 패턴 적용 필요.

### 2. `ncpKeyId` vs `ncpClientId` 쿼리 파라미터

**증상**: 스크립트 로드 후 API 인증 실패.

**원인**: NCP 콘솔 API URL의 쿼리 파라미터명은 `ncpClientId`. 라이브러리 prop명 `ncpKeyId`와 혼동.

**해결**: `load-script.ts`에서 `ncpClientId: options.ncpKeyId`로 매핑.

### 3. `@types/navermaps`에 `naver.maps.Util` 미포함

**증상**: `naver.maps.Util.equals()` 타입 에러.

**원인**: `@types/navermaps` 패키지에 `Util` 네임스페이스가 정의되어 있지 않음.

**해결**: 커스텀 `kvoEquals()` 함수 — 인스턴스의 `.equals()` 메서드가 있으면 사용, 없으면 `===` 비교.

### 4. Container ref callback 무한 루프

**증상**: 맵이 계속 재생성되며 무한 리렌더.

**원인**: 인라인 화살표 함수 `ref={(el) => { ... }}`는 매 렌더마다 새 참조 → React가 cleanup + re-call.

**해결**: `ref={setMapDiv}` — `useState`의 setter 함수는 안정적 identity.

### 5. ES2022 target에서 `toSorted()` 타입 에러

**원인**: `Array.prototype.toSorted()`는 ES2023에 추가됨.

**해결**: `tsconfig.json`의 `target`을 `es2023`으로 변경.

---

## 테스트

### 테스트 파일 (10개 테스트)

| 파일 | 테스트 수 | 방식 |
|------|----------|------|
| `hooks/__tests__/use-kvo.spec.tsx` | 3 | Mock KVO 객체 |
| `hooks/__tests__/use-controlled-kvo.spec.tsx` | 4 | Mock KVO + spy |
| `__tests__/smoke.spec.tsx` | 3 | 실제 네이버맵 API (port 3000) |

### smoke 테스트 내용

- `useNavermaps` Suspense 해소 확인
- NaverMap 렌더링 (맵 div 생성 확인)
- Marker 렌더링 (맵 위에 마커 앵커 생성 확인)

### 실행 방법

```bash
cd packages/react-naver-maps-v2
pnpm test          # vitest run (browser mode, port 3000)
pnpm test:watch    # vitest (watch mode)
```

---

## 개발용 예제

```bash
pnpm dev           # vite dev server → http://localhost:3000
```

`example/main.tsx`: NavermapsProvider + Container + NaverMap + Marker 최소 예제.

---

## 검증 결과

| 항목 | 결과 |
|------|------|
| `pnpm build` (tsc -b) | ✅ 통과 |
| `pnpm lint` (oxlint) | ✅ 0 warnings, 0 errors |
| `pnpm fmt:check` (oxfmt) | ✅ 통과 |
| `pnpm test` (vitest) | ✅ 10/10 통과 |
| 브라우저 확인 (localhost:3000) | ✅ 맵 타일 + 마커 정상 렌더링 |

---

## 루트 레포 변경사항

| 파일 | 변경 내용 |
|------|----------|
| `.gitignore` | `.playwright-mcp/`, `docs/`, `tmp/` 추가 |
| `pnpm-workspace.yaml` | `website-2` 추가, `overrides` 섹션 추가 |
| `package.json` | `dependencies.react` link 추가 (workspace 호환) |

---

## 다음 단계 (Phase 2+)

- [ ] 오버레이 시스템: InfoWindow, Circle, Polyline, Polygon, Rectangle, Ellipse, GroundOverlay
- [ ] 팩토리 패턴으로 오버레이 컴포넌트 생성 통합
- [ ] 타입 augmentation (`@types/navermaps` 확장)
- [ ] 이벤트 타입 시스템 정리
