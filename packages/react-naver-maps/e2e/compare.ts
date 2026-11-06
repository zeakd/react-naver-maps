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
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parseBase, prepareTarget, withTree } from './baseline.ts';
import { compareRows, table } from './compare-rows.ts';
import type { Outcome } from './compare-rows.ts';
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
          ? (JSON.parse(
              Buffer.from(fields, 'base64').toString('utf8'),
            ) as Record<string, FieldKind>)
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
  // 지난 실행의 보고서를 지운다. 이번 실행이 보고서를 만들지 못하고 끝나면(설정 오류, 실행 파일 없음)
  // 남은 보고서를 이번 결과로 읽었다(2026-11-05 리뷰).
  rmSync(report, { force: true });
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
  // 검사 실패는 종료 코드 1 이고 보고서가 있다. 실행이 시작되지 못했거나 시그널로 끊긴 것은 결과가 아니다.
  if (r.error || r.signal) {
    throw new Error(
      `${label}: playwright 를 끝까지 돌리지 못했다 (${r.error?.message ?? r.signal})`,
    );
  }
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
  if (out.size === 0)
    throw new Error(`${label}: 검사 결과가 하나도 없다 (${report})`);
  return out;
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
const rows = compareRows(baseRun, head, base, expectedDifferences);
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
