// 같은 시나리오(`e2e/scenarios`)를 배포된 버전과 이 저장소의 소스에 돌려 동작 차이를 표로 낸다.
//
//   pnpm compare:scenarios            # 0.3.0 과 비교
//   pnpm compare:scenarios 0.2.2      # 다른 배포 버전과 비교
//   pnpm compare:scenarios -- -g 드래그 # playwright 인자를 덧붙인다
//   pnpm compare:scenarios 0.3.0 --reuse # 다시 돌리지 않고 지난 실행 보고서로 표만 다시 낸다
//
// 차이는 `scenarios/compare-expected.ts` 에 이유와 함께 적은 것만 허용한다. 적지 않은 차이가
// 있으면 실패로 끝난다. 결과는 `e2e/.compare/<버전>/` 에 남는다.
//
// 실제 SDK 인증이 localhost:4321 에서만 통과하므로 두 실행을 차례로 돌린다. 포트가 쓰이고 있으면
// 시작하지 않는다.
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { expectedDifferences } from './scenarios/compare-expected.ts';
import type { TraceFrame } from './scenarios/types.ts';

const PORT = 4321;
const here = import.meta.dirname;
const pkgDir = resolve(here, '..');

const args = process.argv.slice(2);
const dashdash = args.indexOf('--');
const own = dashdash === -1 ? args : args.slice(0, dashdash);
const passthrough = dashdash === -1 ? [] : args.slice(dashdash + 1);
const reuse = own.includes('--reuse');
const version = own.find((a) => !a.startsWith('--')) ?? '0.3.0';

type Outcome = {
  status: 'passed' | 'failed' | 'skipped' | 'missing';
  trace?: TraceFrame[];
  error?: string;
};

function prepareTarget(v: string): void {
  const dir = join(here, '.targets', v);
  if (!existsSync(join(dir, 'package', 'package.json'))) {
    mkdirSync(dir, { recursive: true });
    // 저장소 안에서는 devEngines 때문에 npm 이 멈추므로 임시 폴더에서 받는다.
    const tmp = mkdtempSync(join(tmpdir(), 'rnm-pack-'));
    const name = execFileSync(
      'npm',
      ['pack', `react-naver-maps@${v}`, '--silent'],
      { cwd: tmp, encoding: 'utf8' },
    ).trim();
    execFileSync('tar', ['-xzf', join(tmp, name), '-C', dir]);
    // 배포본의 source map 은 없는 소스를 가리켜 Vite 가 경고를 쏟아낸다. 검사에는 필요 없다.
    execFileSync('find', [
      join(dir, 'package', 'dist'),
      '-name',
      '*.map',
      '-delete',
    ]);
  }
  // 앱이 import 하는 이름(scenarios/target.ts)을 배포본에 맞춘다. 배포본에 없는 export 는
  // 쓰면 바로 알 수 있게 던진다. 그런 시나리오는 since 로 건너뛴다.
  writeFileSync(
    join(dir, 'target.js'),
    [
      `export * from './package/dist/react-naver-maps.js';`,
      `export { loadScript } from './package/dist/load-script.js';`,
      `export function useAutoResize() { throw new Error('${v} 에는 useAutoResize 가 없다'); }`,
      `export const TARGET = '${v}';`,
      '',
    ].join('\n'),
  );
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
  base: Map<string, Outcome>,
  head: Map<string, Outcome>,
): Row[] {
  const names = [...new Set([...base.keys(), ...head.keys()])];
  return names.map((name): Row => {
    const a = base.get(name) ?? { status: 'missing' };
    const b = head.get(name) ?? { status: 'missing' };
    if (a.status === 'skipped' || b.status === 'skipped') {
      return { name, kind: '건너뜀', detail: `${a.status} / ${b.status}` };
    }
    const changed = new Map<string, string>();
    if (a.status !== b.status)
      changed.set('status', `판정 ${a.status} → ${b.status}`);
    if (a.trace && b.trace) {
      for (const [field, text] of differences(a.trace, b.trace))
        changed.set(field, text);
    } else if (a.trace || b.trace) {
      changed.set('trace', '한쪽에만 궤적이 있다');
    }
    if (changed.size === 0) return { name, kind: '같음', detail: '' };
    const detail = [...changed.values()].join('; ');
    // 허용은 필드 단위다. 허용한 필드 밖에서 생긴 차이는 이유가 있어도 예상 밖으로 친다.
    const expected = expectedDifferences[name];
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
prepareTarget(version);
const outDir = join(here, '.compare', version);
mkdirSync(outDir, { recursive: true });
const base = run(version, version, outDir);
const head = run('source', undefined, outDir);
const rows = compare(base, head);
const md = table(rows, version);
writeFileSync(join(outDir, 'report.md'), md);
console.log(`\n${md}`);
const stale = Object.keys(expectedDifferences).filter(
  (name) => rows.find((r) => r.name === name)?.kind === '같음',
);
if (stale.length > 0) {
  console.log(`차이가 사라진 허용 항목(지워도 된다): ${stale.join(', ')}`);
}
const unexpected = rows.filter((r) => r.kind === '예상 밖 차이');
console.log(`보고서: ${join(outDir, 'report.md')}`);
process.exit(unexpected.length > 0 ? 1 : 0);
