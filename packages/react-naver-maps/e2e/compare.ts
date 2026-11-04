// 같은 시나리오(`e2e/scenarios`)를 기준선과 이 저장소의 소스에 돌려 동작 차이를 표로 낸다.
// 기준선은 배포된 버전이나 git 커밋이다.
//
//   pnpm compare:scenarios              # 배포된 0.3.0 과 비교
//   pnpm compare:scenarios 0.2.2        # 다른 배포 버전과 비교
//   pnpm compare:scenarios git:v0.4     # 그 커밋을 빌드해 비교(내부 정리의 동작 보존 확인)
//   pnpm compare:scenarios harness:v0.4 # 그 커밋의 하네스로 돌린 궤적과 비교(하네스 정리의 동작 보존 확인)
//   pnpm compare:scenarios harness:HEAD # 같은 코드끼리 비교(실행마다 흔들리는 필드 찾기)
//   pnpm compare:scenarios -- -g 드래그  # playwright 인자를 덧붙인다
//   pnpm compare:scenarios 0.3.0 --reuse # 다시 돌리지 않고 지난 실행 보고서로 표만 다시 낸다
//
// 배포 버전과의 차이는 `scenarios/compare-expected.ts` 에 이유와 함께 적은 것만 허용한다.
// git·harness 기준선에는 허용 목록이 없다. 동작을 바꾸지 않는 정리를 확인하는 용도라서 차이가 하나라도
// 나면 실패다. 의도한 동작 변경은 정리와 다른 PR 로 나누고 배포 버전 비교에 적는다.
// git 은 라이브러리만 바꿔 끼우고 하네스는 지금 것을 쓴다. 그래서 하네스를 바꾼 변경은 git 으로
// 증명되지 않는다. harness 는 그 커밋을 임시 작업 트리에 꺼내 그 트리의 하네스로 돈다. 라이브러리
// 소스(`src/`)가 지금 작업 트리와 다르면 시작하지 않는다.
// 적지 않은 차이가 있으면 실패로 끝난다. 결과는 `e2e/.compare/<기준선>/` 에 남는다.
//
// 실제 SDK 인증이 localhost:4321 에서만 통과하므로 두 실행을 차례로 돌린다. 두 실행 내내 포트를
// 잡고(`port.ts`), 포트에 서버가 떠 있으면 시작하지 않는다.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseBase, prepareTarget, withTree } from './baseline.ts';
import { holdPort, listener, PORT } from './port.ts';
import { expectedDifferences } from './scenarios/compare-expected.ts';
import type { FieldKind } from './scenarios/fields.ts';
import type { TraceFrame } from './scenarios/types.ts';

const here = import.meta.dirname;
const pkgDir = resolve(here, '..');

const args = process.argv.slice(2);
const dashdash = args.indexOf('--');
const own = dashdash === -1 ? args : args.slice(0, dashdash);
const passthrough = dashdash === -1 ? [] : args.slice(dashdash + 1);
const reuse = own.includes('--reuse');

const base = parseBase(own.find((a) => !a.startsWith('--')) ?? '0.3.0');

type Outcome = {
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

/** 시나리오 앱이 target 에서 값으로 가져오는 이름(`scenarios/app/target-imports.ts` 한 곳에 모여 있다). */
function imported(): string[] {
  const file = join(here, 'scenarios', 'app', 'target-imports.ts');
  const block = readFileSync(file, 'utf8').match(
    /export\s*\{([^}]*)\}\s*from\s*'\.\.\/target\.js'/,
  );
  if (!block) throw new Error(`${file} 에서 target export 블록을 찾지 못했다`);
  return block[1]!
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

type JsonSuite = { title: string; specs?: JsonSpec[]; suites?: JsonSuite[] };
type JsonSpec = {
  title: string;
  tests: {
    results: {
      status: string;
      attachments?: { name: string; body?: string }[];
      errors?: { message?: string }[];
    }[];
  }[];
};

function collect(suites: JsonSuite[], out: Map<string, Outcome>): void {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const result = spec.tests[0]?.results.at(-1);
      if (!result) continue;
      const body = result.attachments?.find(
        (a) => a.name === 'trace.json',
      )?.body;
      const unstable = result.attachments?.find(
        (a) => a.name === 'unstable.json',
      )?.body;
      const fields = result.attachments?.find(
        (a) => a.name === 'fields.json',
      )?.body;
      out.set(spec.title, {
        status:
          result.status === 'passed' || result.status === 'skipped'
            ? result.status
            : 'failed',
        trace: body
          ? (JSON.parse(
              Buffer.from(body, 'base64').toString('utf8'),
            ) as TraceFrame[])
          : undefined,
        unstable: unstable
          ? (JSON.parse(
              Buffer.from(unstable, 'base64').toString('utf8'),
            ) as string[])
          : [],
        fields: fields
          ? (JSON.parse(Buffer.from(fields, 'base64').toString('utf8')) as Record<
              string,
              FieldKind
            >)
          : {},
        error: result.errors?.[0]?.message?.split('\n')[0],
      });
    }
    collect(suite.suites ?? [], out);
  }
}

/** `cwd` 는 돌릴 패키지 폴더다. harness 기준선은 임시 작업 트리의 패키지 폴더에서 돈다. */
function run(
  label: string,
  target: string | undefined,
  outDir: string,
  cwd = pkgDir,
): Map<string, Outcome> {
  const report = join(outDir, `${label}.json`);
  if (reuse) return read(report, label);
  console.log(`\n▶ ${label} 실행`);
  const r = spawnSync(
    'pnpm',
    [
      'exec',
      'playwright',
      'test',
      '--config',
      'e2e/scenarios.config.ts',
      'scenarios.spec.ts',
      '--reporter=json',
      ...passthrough,
    ],
    {
      cwd,
      stdio: ['ignore', 'ignore', 'inherit'],
      env: {
        ...process.env,
        RNM_COMPARE: '1',
        ...(target ? { RNM_TARGET: target } : {}),
        PLAYWRIGHT_JSON_OUTPUT_NAME: report,
      },
    },
  );
  if (!existsSync(report)) {
    throw new Error(
      `${label}: playwright 보고서가 없다 (종료 코드 ${r.status})`,
    );
  }
  return read(report, label);
}

function read(report: string, label: string): Map<string, Outcome> {
  if (!existsSync(report))
    throw new Error(`${label}: ${report} 가 없다. --reuse 없이 먼저 돌린다.`);
  const json = JSON.parse(readFileSync(report, 'utf8')) as {
    suites: JsonSuite[];
    errors?: { message?: string }[];
  };
  // 실행 자체가 성립하지 않은 보고서(globalSetup 실패, 서버를 띄우지 못함)는 비교하지 않는다. 그대로 두면
  // 양쪽 다 빈 결과라 "차이 없음" 으로 끝났다.
  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `${label}: 실행이 성립하지 않았다: ${json.errors[0]?.message?.split('\n')[0] ?? '(내용 없음)'} (${report})`,
    );
  }
  const out = new Map<string, Outcome>();
  collect(json.suites, out);
  if (out.size === 0) throw new Error(`${label}: 검사 결과가 하나도 없다 (${report})`);
  return out;
}

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
function ignored(kind: FieldKind): boolean {
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
      first.set(k, `${k} 의 분류가 다르다 ${JSON.stringify(ka)} → ${JSON.stringify(kb)}`);
      continue;
    }
    const kind = kb ?? ka;
    if (!kind) {
      first.set(k, `${k} 의 분류가 없다(scenarios/fields.ts)`);
      continue;
    }
    if (ignored(kind)) continue;
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

type Row = {
  name: string;
  kind: '같음' | '예상한 차이' | '예상 밖 차이' | '건너뜀';
  detail: string;
};

function compare(
  before: Map<string, Outcome>,
  head: Map<string, Outcome>,
): Row[] {
  const names = [...new Set([...before.keys(), ...head.keys()])];
  return names.map((name): Row => {
    const missing: Outcome = { status: 'missing', unstable: [], fields: {} };
    const a = before.get(name) ?? missing;
    const b = head.get(name) ?? missing;
    if (a.status === 'skipped' || b.status === 'skipped') {
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
    if (a.status !== b.status)
      changed.set('status', `판정 ${a.status} → ${b.status}`);
    if (a.trace && b.trace) {
      const skip = new Set<string>([...a.unstable, ...b.unstable]);
      for (const [field, text] of differences(
        a.trace,
        b.trace,
        a.fields,
        b.fields,
        skip,
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

function table(rows: Row[], title: string): string {
  return [
    `# 시나리오 비교: ${title} → 소스`,
    '',
    '| 시나리오 | 결과 | 내용 |',
    '|---|---|---|',
    ...rows.map((r) => `| ${esc(r.name)} | ${r.kind} | ${esc(r.detail)} |`),
    '',
  ].join('\n');
}

/** harness 기준선은 라이브러리가 같아야 하네스만의 차이가 된다. 커밋하지 않은 변경도 본다. */
function assertSameLibrary(sha: string): void {
  const git = (argv: string[]) =>
    spawnSync('git', argv, { cwd: pkgDir, encoding: 'utf8' });
  const diff = git(['diff', '--name-only', sha, '--', 'src']).stdout.trim();
  const added = git([
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    'src',
  ]).stdout.trim();
  const changed = [diff, added].filter(Boolean).join('\n');
  if (changed) {
    console.error(
      `harness 기준선 ${sha.slice(0, 7)} 과 라이브러리 소스가 다르다. 하네스만 바꾼 변경에 쓴다:\n${changed}`,
    );
    process.exit(2);
  }
}

if (!reuse) {
  holdPort(`compare:scenarios ${base.label}`);
  const l = listener();
  if (l) {
    console.error(
      `포트 ${PORT} 에 서버가 떠 있다(pid ${l.pid}, 작업 폴더 ${l.cwd}). 비교는 실행마다 서버를 새로 띄운다.`,
    );
    process.exit(2);
  }
}
const outDir = join(here, '.compare', base.label);
mkdirSync(outDir, { recursive: true });
let baseRun: Map<string, Outcome>;
if (base.kind === 'harness') {
  assertSameLibrary(base.sha);
  baseRun = reuse
    ? read(join(outDir, `${base.label}.json`), base.label)
    : withTree(base.sha, (pkg) => run(base.label, undefined, outDir, pkg));
} else {
  prepareTarget(base, imported());
  baseRun = run(base.label, base.label, outDir);
}
const head = run('source', undefined, outDir);
const rows = compare(baseRun, head);
const md = table(
  rows,
  base.kind === 'release' ? base.label : `${base.ref} (${base.label})`,
);
writeFileSync(join(outDir, 'report.md'), md);
console.log(`\n${md}`);
const stale = (
  base.kind === 'release' ? Object.keys(expectedDifferences) : []
).filter((name) => rows.find((r) => r.name === name)?.kind === '같음');
if (stale.length > 0) {
  console.log(`차이가 사라진 허용 항목(지워도 된다): ${stale.join(', ')}`);
}
const unexpected = rows.filter((r) => r.kind === '예상 밖 차이');
console.log(`보고서: ${join(outDir, 'report.md')}`);
process.exit(unexpected.length > 0 ? 1 : 0);
