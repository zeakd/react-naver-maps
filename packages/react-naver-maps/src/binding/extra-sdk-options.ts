import { useLayoutEffect, useRef } from 'react';
import { sdkAlive } from '../sdk/listeners.js';
import { createdOptionsOf } from './created-options.js';

const RESERVED = /^(?:on|default)[A-Z]/;

/** React·라이브러리가 소유해 SDK 로 넘기지 않는 이름을 handled 에 더한다. */
export function handledProps(names: readonly string[]): ReadonlySet<string> {
  return new Set(['ref', 'key', 'children', 'map', ...names]);
}

/**
 * 컴포넌트가 처리하지 않는 prop. SDK 에 새로 생긴 옵션을 라이브러리를 고치지 않고 쓰는 길이다
 * (TypeScript 는 Props 인터페이스를 보강한다). `onX`·`defaultX` 는 이벤트·초깃값 예약 이름이라 넘기지
 * 않는다. SDK 에 같은 이름의 옵션이 생기면 ref 로 SDK 메서드를 부른다. 알려진 prop 은 이 길을 타지 않는다.
 */
export function extraSdkOptions(
  props: object,
  handled: ReadonlySet<string>,
): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || handled.has(key) || RESERVED.test(key)) continue;
    extras[key] = value;
  }
  return extras;
}

/** 생성 뒤 바뀐 추가 옵션을 넣는 길. SDK 의 공개 `setOptions(객체)` 다. */
export function setExtraSdkOptions(
  target: unknown,
  options: Record<string, unknown>,
): void {
  (target as { setOptions(options: object): void }).setOptions(options);
}

/**
 * 추가 옵션은 값이 바뀔 때만 공개 setOptions 로 전달한다. getter 유무나
 * 내부 KVO 슬롯을 추측하지 않는다. 생성자에 넘긴 값은 다시 넘기지 않고, SDK 자체 변경은 되돌리지 않는다.
 * Object.is 로 비교하므로 객체 변경은 새 참조로 전달한다. 알 수 없는 SDK 값의 내부 구조는 비교하지 않는다.
 * 생략/undefined 는 제어 해제이며 SDK 값을 리셋하지 않는다. 다시 주면 같은 값이어도 다시 적용한다.
 */
export function useExtraSdkOptions<T extends object>(
  target: T,
  options: Record<string, unknown>,
  apply: ((target: T, options: Record<string, unknown>) => void) | undefined,
): void {
  const previous = useRef<{
    target: T;
    options: Record<string, unknown>;
  } | null>(null);

  useLayoutEffect(() => {
    if (!apply || !sdkAlive()) return;
    const last = previous.current;
    // 처음이거나 target 이 바뀌면 그 인스턴스의 생성자가 받은 값과 견준다. 생성과 첫 동기화 사이에 prop 이
    // 바뀌었을 수 있다(created-options.ts).
    const base =
      last?.target === target ? last.options : (createdOptionsOf(target) ?? {});
    const changed = Object.fromEntries(
      Object.entries(options).filter(
        ([key, value]) =>
          !Object.hasOwn(base, key) || !Object.is(base[key], value),
      ),
    );
    if (Object.keys(changed).length) apply(target, changed);
    previous.current = { target, options };
  });
}
