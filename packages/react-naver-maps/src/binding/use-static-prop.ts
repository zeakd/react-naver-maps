import { useEffect, useRef } from 'react';

const isDev =
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV !== 'production';

/**
 * static prop이 마운트 이후 변경되면 dev 환경에서 한 번 경고한다.
 *
 * static prop은 SDK가 런타임 변경을 지원하지 않거나 비용이 크거나 의미 없는 옵션이다.
 * 변경하려면 컴포넌트를 React `key`로 재마운트한다.
 *
 * ## undefined grace period
 *
 * 초기 마운트 시 값이 `undefined`면 "아직 정해지지 않은 값"으로 간주하고
 * 첫 비-undefined 값을 mount 값으로 갱신한다. 다음 패턴을 false positive로 잡지 않기 위함:
 *
 * ```tsx
 * const config = useFetchedConfig();         // 처음엔 undefined
 * <NaverMap gl={config?.gl} />               // 비동기 로드 후 true가 들어옴
 * ```
 *
 * 이후엔 정상 비교 — settled 값과 다른 값이 들어오면 경고.
 *
 * ## production DCE
 *
 * 모듈 init에서 `isDev`로 dev/prod 구현을 한 번 결정한다. production 빌드에선
 * `useStaticPropsProd`(no-op)이 export되어 hook 호출 자체가 사라지므로 ref/effect 슬롯을
 * 차지하지 않는다. dev 빌드에선 `useStaticPropsDev`가 사용되어 정상 동작.
 *
 * `process.env.NODE_ENV === 'production'`을 번들러(Vite/webpack)가 inline하면 모듈 최상단의
 * 분기에서 `useStaticPropsDev` 가지가 dead-code-eliminate된다.
 *
 * ## 여러 prop
 *
 * values 의 prop 마다 위 규칙을 따로 적용한다. 값이 지난 렌더와 같으면 다시 보지 않아 한 번 바뀐
 * 값으로 렌더가 이어져도 경고는 한 번이다. values 의 키는 렌더마다 같아야 한다.
 */
function useStaticPropsDev(
  componentName: string,
  values: Record<string, unknown>,
): void {
  type State = { initial: unknown; settled: boolean; seen: unknown };
  const statesRef = useRef(new Map<string, State>());
  useEffect(() => {
    const states = statesRef.current;
    for (const [propName, value] of Object.entries(values)) {
      const state = states.get(propName);
      if (!state) {
        // 마운트: 첫 값을 기억한다(useStaticProp 의 useRef(value) 와 같다).
        states.set(propName, {
          initial: value,
          settled: value !== undefined,
          seen: value,
        });
        continue;
      }
      // useStaticProp 의 effect deps([value]) 와 같다: 값이 바뀐 렌더에서만 본다.
      if (Object.is(state.seen, value)) continue;
      state.seen = value;
      if (!state.settled) {
        if (value !== undefined) {
          state.initial = value;
          state.settled = true;
        }
        continue;
      }
      if (Object.is(state.initial, value)) continue;
      // eslint-disable-next-line no-console
      console.warn(
        `[react-naver-maps] <${componentName} ${propName}={...} />: '${propName}' is a static prop. Changes after mount are not applied to the SDK. To change the value, remount the component using a React 'key' prop.\n` +
          `'${propName}'은(는) static prop입니다. 마운트 이후 변경은 SDK에 반영되지 않습니다. 값을 바꾸려면 React 'key' prop으로 컴포넌트를 재마운트하세요.`,
      );
    }
  });
}

function useStaticPropsProd(
  _componentName: string,
  _values: Record<string, unknown>,
): void {}

export const useStaticProps: typeof useStaticPropsDev = isDev
  ? useStaticPropsDev
  : useStaticPropsProd;

/** prop 하나짜리 useStaticProps. */
export function useStaticProp<T>(
  componentName: string,
  propName: string,
  value: T,
): void {
  useStaticProps(componentName, { [propName]: value });
}

/**
 * dev 환경 여부. 호출자도 `if (isDev) useStaticProp(...)` 가드를 둘 수 있지만,
 * production에서 useStaticProp 자체가 no-op이라 가드 없어도 사실상 비용 없음.
 */
export { isDev };
