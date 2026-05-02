import { useEffect, useRef } from 'react';

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
 * production 빌드(`process.env.NODE_ENV === 'production'`)에서는 effect 자체가 죽은 코드로
 * 제거되거나 no-op으로 남는다. 번들러(Vite, webpack 등)가 이 분기를 inline하면 0 비용.
 */
export function useStaticProp<T>(
  componentName: string,
  propName: string,
  value: T,
): void {
  const initialRef = useRef(value);
  const settledRef = useRef(value !== undefined);
  useEffect(() => {
    // production 빌드에서 dead-code-elimination 되도록 globalThis 경유로 접근.
    // 번들러(Vite/webpack)가 NODE_ENV를 inline하면 이 분기는 통째로 제거된다.
    const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
      .process;
    if (proc?.env?.NODE_ENV === 'production') return;

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
      `[react-naver-maps] <${componentName} ${propName}={...} />: '${propName}'은 static prop입니다. 마운트 이후 변경이 SDK에 반영되지 않습니다. 값을 바꾸려면 React 'key' prop으로 컴포넌트를 재마운트하세요.`,
    );
  }, [value, componentName, propName]);
}
