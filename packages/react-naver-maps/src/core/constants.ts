/**
 * SDK 상수를 이름으로도 받는다. `position: 'TOP_RIGHT'` 는 `naver.maps.Position.TOP_RIGHT` 와 같다.
 *
 * 이름은 SDK 를 불러온 뒤 그 자리의 SDK 객체에서 찾는다. 숫자 값을 라이브러리가 복사해 두지 않으므로
 * SDK 가 값을 바꿔도 따라간다. SDK 에 없는 이름이면 그 자리에서 던진다(SDK 상수로 쓰면 조용히
 * `undefined` 가 넘어가는 경우다. 예: `Service.CoordinatesType.UTMK`, 3.10.5 의 키는 `UTMNK`).
 * SDK 상수(숫자) 를 넘기면 그대로 쓴다.
 *
 * 바꾸는 것은 라이브러리가 prop 을 SDK 에 넘길 때뿐이다. `map.setOptions(...)` 처럼 SDK 를 직접 부를
 * 때는 SDK 상수를 쓴다.
 */

/** enum 값이나 그 이름. `@types/navermaps` 의 enum 선언에서 이름 목록을 얻는다. */
export type Named<E extends Record<string, string | number>> =
  | E[keyof E]
  | (keyof E & string);

export type PositionName = Named<typeof naver.maps.Position>;
export type AnimationName = Named<typeof naver.maps.Animation>;
export type ZoomControlStyleName = Named<typeof naver.maps.ZoomControlStyle>;
export type MapTypeControlStyleName = Named<
  typeof naver.maps.MapTypeControlStyle
>;
export type DrawingModeName = Named<typeof naver.maps.drawing.DrawingMode>;
export type DrawingStyleName = Named<typeof naver.maps.drawing.DrawingStyle>;

/** prop 경로 → 그 자리의 SDK 상수 표. 경로는 `a`, `a.b`, 배열이면 `a[]`. */
export type ConstantPaths = Readonly<
  Record<string, (navermaps: typeof naver.maps) => object>
>;

/** 이름이면 table 에서 찾아 바꾸고, 아니면 그대로 돌려준다. */
export function resolveConstant(
  table: object,
  value: unknown,
  where: string,
): unknown {
  if (typeof value !== 'string') return value;
  const t = table as Record<string, unknown>;
  // enum 의 역방향 키('1' → 'TOP_LEFT')나 Object 의 키를 이름으로 받지 않는다.
  if (Object.prototype.hasOwnProperty.call(t, value) && !/^\d+$/.test(value)) {
    return t[value];
  }
  throw new Error(
    `[react-naver-maps] ${where}: SDK 에 '${value}' 상수가 없다. 쓸 수 있는 이름: ${Object.keys(
      t,
    )
      .filter((k) => !/^\d+$/.test(k))
      .join(', ')}`,
  );
}

/**
 * props 에서 paths 의 자리를 SDK 값으로 바꾼 사본. 바꿀 것이 없으면 같은 객체를 돌려준다(렌더마다
 * 새 객체를 만들지 않는다). 중첩 객체(`zoomControlOptions.position`)는 그 객체만 새로 만든다.
 */
export function resolveConstants<P extends object>(
  navermaps: typeof naver.maps,
  props: P,
  paths: ConstantPaths | undefined,
  component: string,
): P {
  if (!paths) return props;
  let out: Record<string, unknown> | null = null;
  const source = props as Record<string, unknown>;
  for (const [path, tableOf] of Object.entries(paths)) {
    const array = path.endsWith('[]');
    const [head, child] = (array ? path.slice(0, -2) : path).split('.') as [
      string,
      string | undefined,
    ];
    const current = (out ?? source)[head];
    if (current === undefined || current === null) continue;
    const where = `<${component} ${path.replace('[]', '')}>`;
    let next: unknown = current;
    if (child === undefined && !array) {
      next = resolveConstant(tableOf(navermaps), current, where);
    } else if (array && Array.isArray(current)) {
      if (current.some((v) => typeof v === 'string')) {
        const table = tableOf(navermaps);
        next = current.map((v) => resolveConstant(table, v, where));
      }
    } else if (child !== undefined && typeof current === 'object') {
      const inner = (current as Record<string, unknown>)[child];
      if (typeof inner === 'string') {
        next = {
          ...(current as object),
          [child]: resolveConstant(tableOf(navermaps), inner, where),
        };
      }
    }
    if (next !== current) {
      out ??= { ...source };
      out[head] = next;
    }
  }
  return (out ?? props) as P;
}
