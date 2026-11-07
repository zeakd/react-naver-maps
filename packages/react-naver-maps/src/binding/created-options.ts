/**
 * 인스턴스를 만들 때 생성자에 넘긴 옵션. 값 동기화의 첫 비교 기준이다.
 *
 * 인스턴스는 바깥 컴포넌트의 layout effect 에서 만들어지고 값 동기화는 그다음 렌더에 처음 돈다. 그 사이
 * 부모의 layout effect 가 prop 을 바꾸면 첫 동기화가 보는 prop 은 생성자가 받은 값이 아니다. 그래서 "첫
 * 동기화의 prop 은 이미 들어갔다" 로 치지 않고 실제로 넘긴 값과 견준다.
 */
const created = new WeakMap<object, Record<string, unknown>>();

export function rememberCreatedOptions<T extends object>(
  instance: T,
  options: Record<string, unknown>,
): T {
  created.set(instance, options);
  return instance;
}

export function createdOptionsOf(
  instance: object,
): Record<string, unknown> | undefined {
  return created.get(instance);
}
