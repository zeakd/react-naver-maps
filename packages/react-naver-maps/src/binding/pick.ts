/** props에서 keys의 값만 keys 순서로 모은다(없는 값은 undefined로 둔다). */
export function pick(
  props: object,
  keys: readonly string[],
): Record<string, unknown> {
  const source = props as Record<string, unknown>;
  return Object.fromEntries(keys.map((k) => [k, source[k]]));
}
