// 같은 시나리오(`e2e/scenarios`)를 기준선과 이 저장소의 소스에 돌려 동작 차이를 표로 낸다.
// 기준선은 배포된 버전이나 git 커밋이다.
//
//   pnpm compare:scenarios              # 배포된 0.3.0 과 비교
//   pnpm compare:scenarios 0.2.2        # 다른 배포 버전과 비교
//   pnpm compare:scenarios git:v0.4     # 그 커밋을 빌드해 비교(내부 정리의 동작 보존 확인)
//   pnpm compare:scenarios -- -g 드래그  # playwright 인자를 덧붙인다
//   pnpm compare:scenarios 0.3.0 --reuse # 다시 돌리지 않고 지난 실행 보고서로 표만 다시 낸다
//
// 배포 버전과의 차이는 `scenarios/compare-expected.ts` 에 이유와 함께 적은 것만 허용한다.
// git 기준선에는 허용 목록이 없다. 동작을 바꾸지 않는 정리를 확인하는 용도라서 차이가 하나라도
// 나면 실패다. 의도한 동작 변경은 정리와 다른 PR 로 나누고 배포 버전 비교에 적는다.
// 적지 않은 차이가 있으면 실패로 끝난다. 결과는 `e2e/.compare/<기준선>/` 에 남는다.
//
// 실제 SDK 인증이 localhost:4321 에서만 통과하므로 두 실행을 차례로 돌린다. 포트가 쓰이고 있으면
// 시작하지 않는다.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseBase, prepareTarget } from './baseline.ts';
import {
  expectedDifferences,
  NEW_API_FIELDS,
} from './scenarios/compare-expected.ts';
import type { TraceFrame } from './scenarios/types.ts';

const PORT = 4321;
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
  error?: string;
};

/** 시나리오 앱(app.tsx)이 target 에서 값으로 import 하는 이름. */
function imported(): string[] {
  const app = readFileSync(join(here, 'scenarios', 'app.tsx'), 'utf8');
  const block = app.match(/import\s*\{([^}]*)\}\s*from\s*'\.\/target\.js'/);
  if (!block) throw new Error('app.tsx 에서 target import 를 찾지 못했다');
  return block[1]!
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

function portInUse(): boolean {
  const r = spawnSync('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN'], {
    encoding: 'utf8',
  });
  return r.stdout.trim().length > 0;
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
        error: result.errors?.[0]?.message?.split('\n')[0],
      });
    }
    collect(suite.suites ?? [], out);
  }
}

function run(
  label: string,
  target: string | undefined,
  outDir: string,
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
      cwd: pkgDir,
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
  };
  const out = new Map<string, Outcome>();
  collect(json.suites, out);
  return out;
}

/** 두 궤적에서 달라진 필드마다 처음 갈라지는 프레임과 값. */
function differences(a: TraceFrame[], b: TraceFrame[]): Map<string, string> {
  const first = new Map<string, string>();
  if (a.length !== b.length) {
    first.set('frames', `프레임 수 ${a.length} → ${b.length}`);
    return first;
  }
  for (let i = 0; i < a.length; i++) {
    const fa = a[i]!;
    const fb = b[i]!;
    for (const k of Object.keys(fa) as (keyof TraceFrame)[]) {
      if (first.has(k) || isDeepStrictEqual(fa[k], fb[k])) continue;
      first.set(
        k,
        `${k}@${i} ${JSON.stringify(fa[k])} → ${JSON.stringify(fb[k])}`,
      );
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
    const a: Outcome = before.get(name) ?? { status: 'missing', unstable: [] };
    const b: Outcome = head.get(name) ?? { status: 'missing', unstable: [] };
    if (a.status === 'skipped' || b.status === 'skipped') {
      return { name, kind: '건너뜀', detail: `${a.status} / ${b.status}` };
    }
    const changed = new Map<string, string>();
    if (a.status !== b.status)
      changed.set('status', `판정 ${a.status} → ${b.status}`);
    if (a.trace && b.trace) {
      const skip = new Set<string>([
        ...a.unstable,
        ...b.unstable,
        ...(base.kind === 'release' ? NEW_API_FIELDS : []),
      ]);
      for (const [field, text] of differences(a.trace, b.trace)) {
        if (!skip.has(field)) changed.set(field, text);
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

function table(rows: Row[], base: string): string {
  return [
    `# 시나리오 비교: ${base} → 소스`,
    '',
    '| 시나리오 | 결과 | 내용 |',
    '|---|---|---|',
    ...rows.map((r) => `| ${esc(r.name)} | ${r.kind} | ${esc(r.detail)} |`),
    '',
  ].join('\n');
}

if (!reuse && portInUse()) {
  console.error(
    `포트 ${PORT} 를 다른 프로세스가 쓰고 있다. lsof -nP -iTCP:${PORT} -sTCP:LISTEN 으로 확인한다.`,
  );
  process.exit(2);
}
prepareTarget(base, imported());
const outDir = join(here, '.compare', base.label);
mkdirSync(outDir, { recursive: true });
const baseRun = run(base.label, base.label, outDir);
const head = run('source', undefined, outDir);
const rows = compare(baseRun, head);
const md = table(
  rows,
  base.kind === 'git' ? `${base.ref} (${base.label})` : base.label,
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
