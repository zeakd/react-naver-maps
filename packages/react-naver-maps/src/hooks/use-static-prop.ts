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
 * `useStaticPropProd`(no-op)이 export되어 hook 호출 자체가 사라지므로 ref/effect 슬롯을
 * 차지하지 않는다. dev 빌드에선 `useStaticPropDev`가 사용되어 정상 동작.
 *
 * `process.env.NODE_ENV === 'production'`을 번들러(Vite/webpack)가 inline하면 모듈 최상단의
 * 분기에서 `useStaticPropDev` 가지가 dead-code-eliminate된다.
 */
function useStaticPropDev<T>(
  componentName: string,
  propName: string,
  value: T,
): void {
  const initialRef = useRef(value);
  const settledRef = useRef(value !== undefined);
  useEffect(() => {
    // grace period: 첫 비-undefined 값을 mount 값으로 정착시킴
    if (!settledRef.current) {
      if (value !== undefined) {
        initialRef.current = value;
        settledRef.current = true;
      }
      return;
    }

    if (Object.is(initialRef.current, value)) return;
    // eslint-disable-next-line no-console
    console.warn(
      `[react-naver-maps] <${componentName} ${propName}={...} />: '${propName}' is a static prop. Changes after mount are not applied to the SDK. To change the value, remount the component using a React 'key' prop.\n` +
        `'${propName}'은(는) static prop입니다. 마운트 이후 변경은 SDK에 반영되지 않습니다. 값을 바꾸려면 React 'key' prop으로 컴포넌트를 재마운트하세요.`,
    );
  }, [value, componentName, propName]);
}

function useStaticPropProd<T>(
  _componentName: string,
  _propName: string,
  _value: T,
): void {
  // production: no-op. 번들러가 호출 시점부터 inline해 죽은 코드로 제거 가능.
}

export const useStaticProp: typeof useStaticPropDev = isDev
  ? useStaticPropDev
  : useStaticPropProd;

/**
 * dev 환경 여부. 호출자도 `if (isDev) useStaticProp(...)` 가드를 둘 수 있지만,
 * production에서 useStaticProp 자체가 no-op이라 가드 없어도 사실상 비용 없음.
 */
export { isDev };
