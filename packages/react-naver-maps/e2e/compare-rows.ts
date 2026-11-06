// 시나리오 비교의 판정. 실행과 보고서 읽기는 `compare.ts` 가 맡고, 여기는 두 실행의 결과로 표를 만든다.
// 실행 없이 시험한다(`src/__tests__/compare-rows.spec.ts`).
import { isDeepStrictEqual } from 'node:util';
import type { FieldKind } from './scenarios/fields.js';
import type { TraceFrame } from './scenarios/types.js';

/** 배포 버전 기준선만 허용 목록과 `since` 를 쓴다. */
export type CompareBase =
  | { kind: 'release'; version: string }
  | { kind: 'git' | 'harness' };

export type ExpectedDifferences = Record<
  string,
  { fields: readonly string[]; reason: string }
>;

export type Outcome = {
  status: 'passed' | 'failed' | 'skipped' | 'missing';
  trace?: TraceFrame[];
  /** 시나리오가 실행마다 달라질 수 있다고 적은 필드(Scenario.unstable). 비교에서 뺀다. */
  unstable: string[];
  /**
   * 그 실행의 하네스가 붙인 필드 분류(`scenarios/fields.ts`). 분류를 붙이기 전의 하네스(harness 기준선의
   * 옛 커밋)면 비어 있고, 그때는 다른 쪽 실행의 분류를 쓴다.
   */
  fields: Record<string, FieldKind>;
  error?: string;
};

/** 화면 픽셀 값 묶음(`pixels`)을 max(3px, 1%) 안에서 견준다(`scenarios/fields.ts`). */
function samePixels(a: unknown, b: unknown): boolean {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return isDeepStrictEqual(a, b);
  }
  const x = a as Record<string, number>;
  const y = b as Record<string, number>;
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  return [...keys].every((k) => {
    if (typeof x[k] !== 'number' || typeof y[k] !== 'number') return false;
    return Math.abs(x[k] - y[k]) <= Math.max(3, 0.01 * Math.max(x[k], y[k]));
  });
}

/** `major.minor` 로 version 이 since 보다 오래됐는가. */
function olderThan(version: string, since: string): boolean {
  const [a = 0, b = 0] = version.split('.').map(Number);
  const [c = 0, d = 0] = since.split('.').map(Number);
  return a < c || (a === c && b < d);
}

/** 이 기준선에서 그 분류의 필드를 견주지 않는가. */
function ignored(kind: FieldKind, base: CompareBase): boolean {
  if (kind === 'measured') return true;
  if (typeof kind === 'object') {
    return base.kind === 'release' && olderThan(base.version, kind.since);
  }
  return false;
}

/**
 * 두 궤적에서 달라진 필드마다 처음 갈라지는 프레임과 값. 필드는 두 궤적에 나온 키의 합집합이다
 * (한쪽에만 생긴 필드도 차이다). 분류(kinds)가 없는 필드, 두 실행의 분류가 다른 필드도 차이로 낸다.
 */
function differences(
  a: TraceFrame[],
  b: TraceFrame[],
  kindsA: Record<string, FieldKind>,
  kindsB: Record<string, FieldKind>,
  skip: Set<string>,
  base: CompareBase,
): Map<string, string> {
  const first = new Map<string, string>();
  if (a.length !== b.length) {
    first.set('frames', `프레임 수 ${a.length} → ${b.length}`);
    return first;
  }
  const keys = new Set<string>();
  for (const f of [...a, ...b]) for (const k of Object.keys(f)) keys.add(k);
  for (const k of keys) {
    if (skip.has(k)) continue;
    const ka = kindsA[k];
    const kb = kindsB[k];
    if (ka && kb && !isDeepStrictEqual(ka, kb)) {
      first.set(
        k,
        `${k} 의 분류가 다르다 ${JSON.stringify(ka)} → ${JSON.stringify(kb)}`,
      );
      continue;
    }
    const kind = kb ?? ka;
    if (!kind) {
      first.set(k, `${k} 의 분류가 없다(scenarios/fields.ts)`);
      continue;
    }
    if (ignored(kind, base)) continue;
    for (let i = 0; i < a.length; i++) {
      const va = (a[i] as Record<string, unknown>)[k];
      const vb = (b[i] as Record<string, unknown>)[k];
      const same =
        kind === 'pixels' ? samePixels(va, vb) : isDeepStrictEqual(va, vb);
      if (same) continue;
      first.set(k, `${k}@${i} ${JSON.stringify(va)} → ${JSON.stringify(vb)}`);
      break;
    }
  }
  return first;
}

export type Row = {
  name: string;
  kind: '같음' | '예상한 차이' | '예상 밖 차이' | '건너뜀';
  detail: string;
};

/**
 * 기준선과 소스의 결과를 시나리오마다 판정한다. 궤적이 같으면 판정(통과·실패)까지 같아야 같음이다.
 *
 * 허용 목록의 `status` 는 기준선에서 실패하던 것이 소스에서 통과하는 방향만 뜻한다. 소스에서 새로
 * 실패하는 것은 어떤 허용 항목으로도 지나가지 않는다. 양쪽이 같은 궤적으로 실패하면 같음이다: 비교는
 * 동작이 달라졌는지를 보고, 시나리오의 실패 자체는 `test:scenarios` 가 잡는다.
 */
export function compareRows(
  before: Map<string, Outcome>,
  head: Map<string, Outcome>,
  base: CompareBase,
  expectedDifferences: ExpectedDifferences,
): Row[] {
  const names = [...new Set([...before.keys(), ...head.keys()])];
  return names.map((name): Row => {
    const missing: Outcome = { status: 'missing', unstable: [], fields: {} };
    const a = before.get(name) ?? missing;
    const b = head.get(name) ?? missing;
    if (a.status === 'skipped' || b.status === 'skipped') {
      // 건너뛴 쪽은 비교할 수 없다. 그래도 다른 쪽이 실패했거나 없으면 그것은 차이다(배포본에 없는 API 라
      // 기준선이 건너뛴 사이 소스가 실패하는 경우 등). git·harness 기준선은 같은 환경·같은 since 로 돌므로
      // 한쪽만 건너뛴 것 자체가 차이다.
      const other = a.status === 'skipped' ? b : a;
      const oneSided = a.status !== b.status;
      if (
        other.status === 'failed' ||
        other.status === 'missing' ||
        (oneSided && base.kind !== 'release')
      ) {
        return {
          name,
          kind: '예상 밖 차이',
          detail: `판정 ${a.status} → ${b.status}${other.error ? `: ${other.error}` : ''}`,
        };
      }
      return { name, kind: '건너뜀', detail: `${a.status} / ${b.status}` };
    }
    // 궤적 없이 끝난 검사(SDK 를 불러오지 못함, 시간 초과)는 지도 동작을 비교하지 못했다. 양쪽이 같은
    // 이유로 실패해도 같음이 아니다. 궤적이 없는 검사라도 통과했으면 비교할 궤적이 없는 검사다(결정성 검사 등).
    const unrun = (
      [
        ['기준선', a],
        ['소스', b],
      ] as const
    ).filter(([, o]) => !o.trace && o.status !== 'passed');
    if (unrun.length > 0) {
      const detail = unrun
        .map(
          ([side, o]) =>
            `${side} 이 궤적 없이 끝났다(${o.status}${o.error ? `: ${o.error}` : ''})`,
        )
        .join('; ');
      return { name, kind: '예상 밖 차이', detail };
    }
    const changed = new Map<string, string>();
    if (a.status !== b.status) {
      // 허용 목록에 쓸 수 있는 이름은 `status` 뿐이라 반대 방향은 허용되지 않는다.
      const improved = a.status === 'failed' && b.status === 'passed';
      changed.set(
        improved ? 'status' : 'status(나빠짐)',
        `판정 ${a.status} → ${b.status}`,
      );
    }
    if (a.trace && b.trace) {
      const skip = new Set<string>([...a.unstable, ...b.unstable]);
      for (const [field, text] of differences(
        a.trace,
        b.trace,
        a.fields,
        b.fields,
        skip,
        base,
      )) {
        changed.set(field, text);
      }
    } else if (a.trace || b.trace) {
      changed.set('trace', '한쪽에만 궤적이 있다');
    }
    if (changed.size === 0) return { name, kind: '같음', detail: '' };
    const detail = [...changed.values()].join('; ');
    // 허용은 필드 단위다. 허용한 필드 밖에서 생긴 차이는 이유가 있어도 예상 밖으로 친다.
    const expected =
      base.kind === 'release' ? expectedDifferences[name] : undefined;
    const outside = [...changed.keys()].filter(
      (f) => !expected?.fields.includes(f as never),
    );
    return expected && outside.length === 0
      ? { name, kind: '예상한 차이', detail: `${detail} — ${expected.reason}` }
      : {
          name,
          kind: '예상 밖 차이',
          detail: expected
            ? `${detail} (허용 밖: ${outside.join(', ')})`
            : detail,
        };
  });
}

const esc = (text: string) => text.replaceAll('|', '\\|');

export function table(rows: Row[], title: string): string {
  return [
    `# 시나리오 비교: ${title} → 소스`,
    '',
    '| 시나리오 | 결과 | 내용 |',
    '|---|---|---|',
    ...rows.map((r) => `| ${esc(r.name)} | ${r.kind} | ${esc(r.detail)} |`),
    '',
  ].join('\n');
}
