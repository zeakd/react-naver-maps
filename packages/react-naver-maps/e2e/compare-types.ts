// 공개 타입을 기준선과 비교한다. 내부 정리가 공개 API 모양을 바꾸지 않았는지 확인하는 용도다.
//
//   pnpm compare:types git:v0.4    # 그 커밋을 빌드해 진입점마다 내보내는 이름과 타입을 비교
//
// 기준선과 이 작업 트리를 각각 빌드하고, package.json `exports` 의 진입점마다 `.d.ts` 가 내보내는
// 이름을 모은다. 이름마다 "두 타입이 같다"는 단언을 한 파일에 써서 tsc 로 판정한다. 값 export 는
// `typeof`, 타입 export 는 그대로 비교한다. 제네릭 타입은 타입 인자를 any 로 채워 비교한다
// (인자 자리의 제약 변경은 못 본다).
//
// 이름이 생기거나 없어져도, 타입이 하나라도 다르면 실패다. 결과는 `e2e/.compare/<기준선>/types.md`.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { exportedNames, parseBase, prepareTarget } from './baseline.ts';

const here = import.meta.dirname;
const pkgDir = resolve(here, '..');

const arg = process.argv[2];
if (!arg) {
  console.error('기준선을 준다. 예: pnpm compare:types git:v0.4');
  process.exit(2);
}
const base = parseBase(arg);
const basePkg = prepareTarget(base, []);
console.log('\n▶ 이 작업 트리 빌드');
execFileSync('pnpm', ['run', 'build'], {
  cwd: pkgDir,
  stdio: ['ignore', 'ignore', 'inherit'],
});

type Entry = { subpath: string; types: string; js: string };

/** package.json `exports` 의 진입점마다 .d.ts 와 .js 의 절대 경로. */
function entries(pkg: string): Entry[] {
  const json = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as {
    exports: Record<string, { types: string; default: string }>;
  };
  return Object.entries(json.exports).map(([subpath, e]) => ({
    subpath,
    types: join(pkg, e.types),
    js: join(pkg, e.default),
  }));
}

/** .d.ts 가 내보내는 이름. 값인지는 .js 의 export 로 가린다. */
function exportsOf(entry: Entry): Map<string, 'value' | 'type'> {
  const dts = readFileSync(entry.types, 'utf8');
  if (/export\s*\*/.test(dts)) {
    throw new Error(`${entry.types} 의 export * 는 이름을 셀 수 없다`);
  }
  const names = new Set<string>();
  for (const m of dts.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(',')) {
      const name = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .at(-1);
      if (name) names.add(name);
    }
  }
  for (const m of dts.matchAll(
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:function|const|let|var|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.add(m[1]!);
  }
  const values = exportedNames(readFileSync(entry.js, 'utf8'), entry.js);
  return new Map(
    [...names].map((n) => [n, values.has(n) ? 'value' : 'type'] as const),
  );
}

type Row = { entry: string; name: string; result: string };

const outDir = join(here, '.compare', base.label, 'types');
mkdirSync(outDir, { recursive: true });
const checkFile = join(outDir, 'check.ts');
const spec = (p: string) => {
  const r = relative(outDir, p);
  return r.startsWith('.') ? r : `./${r}`;
};

const rows: Row[] = [];
/** check.ts 의 줄 번호 → 그 줄이 비교하는 이름 */
const lineOf = new Map<number, Row>();
const lines = [
  '// compare-types.ts 가 만든다. 고치지 않는다.',
  'type Same<A, B> =',
  '  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2',
  '    ? true',
  '    : false;',
];
const headEntries = new Map(entries(pkgDir).map((e) => [e.subpath, e]));
entries(basePkg).forEach((b, i) => {
  const h = headEntries.get(b.subpath);
  if (!h) {
    rows.push({ entry: b.subpath, name: '(진입점)', result: '없어짐' });
    return;
  }
  headEntries.delete(b.subpath);
  const before = exportsOf(b);
  const after = exportsOf(h);
  lines.push(
    `import type * as B${i} from '${spec(b.types).replace(/\.d\.ts$/, '.js')}';`,
    `import type * as H${i} from '${spec(h.types).replace(/\.d\.ts$/, '.js')}';`,
  );
  for (const [name, kind] of before) {
    const row: Row = { entry: b.subpath, name, result: '같음' };
    rows.push(row);
    if (!after.has(name)) {
      row.result = '없어짐';
      continue;
    }
    if (after.get(name) !== kind) {
      row.result = `${kind} → ${after.get(name)}`;
      continue;
    }
    const [x, y] =
      kind === 'value'
        ? [`typeof B${i}.${name}`, `typeof H${i}.${name}`]
        : [`B${i}.${name}`, `H${i}.${name}`];
    lines.push(`export const c${rows.length}: Same<${x}, ${y}> = true;`);
    lineOf.set(lines.length, row);
  }
  for (const name of after.keys()) {
    if (!before.has(name)) {
      rows.push({ entry: b.subpath, name, result: '생김' });
    }
  }
});
for (const subpath of headEntries.keys()) {
  rows.push({ entry: subpath, name: '(진입점)', result: '생김' });
}

/** tsc 를 돌려 줄마다 오류를 모은다. 제네릭 인자가 빠졌다는 오류는 any 로 채워 다시 돈다. */
function typecheck(): Map<number, string> {
  writeFileSync(checkFile, lines.join('\n') + '\n');
  writeFileSync(
    join(outDir, 'tsconfig.json'),
    JSON.stringify({
      extends: spec(join(here, 'tsconfig.json')),
      compilerOptions: { rootDir: spec(pkgDir) },
      include: ['check.ts'],
    }),
  );
  const r = spawnSync(
    'pnpm',
    ['exec', 'tsc', '-p', join(outDir, 'tsconfig.json'), '--pretty', 'false'],
    { cwd: pkgDir, encoding: 'utf8' },
  );
  const errors = new Map<number, string>();
  for (const m of r.stdout.matchAll(
    /check\.ts\((\d+),\d+\): error (TS\d+: .*)/g,
  )) {
    const line = Number(m[1]);
    if (!errors.has(line)) errors.set(line, m[2]!);
  }
  if (r.status !== 0 && errors.size === 0) {
    throw new Error(`tsc 가 check.ts 밖에서 실패했다:\n${r.stdout}${r.stderr}`);
  }
  return errors;
}

let errors = typecheck();
const generic = [...errors].filter(([, e]) => e.startsWith('TS2314'));
if (generic.length > 0) {
  for (const [line, e] of generic) {
    const count = Number(/requires (\d+) type argument/.exec(e)?.[1] ?? 1);
    const args = `<${Array(count).fill('any').join(', ')}>`;
    lines[line - 1] = lines[line - 1]!.replace(
      /Same<(B\d+\.\w+), (H\d+\.\w+)>/,
      `Same<$1${args}, $2${args}>`,
    );
  }
  errors = typecheck();
}
for (const [line, error] of errors) {
  const row = lineOf.get(line);
  if (!row)
    throw new Error(`check.ts:${line} 오류를 이름에 잇지 못했다: ${error}`);
  row.result = error.startsWith('TS2322') ? '다름' : `확인 못 함 (${error})`;
}

const changed = rows.filter((r) => r.result !== '같음');
const md = [
  `# 공개 타입 비교: ${base.kind === 'git' ? `${base.ref} (${base.label})` : base.label} → 작업 트리`,
  '',
  `비교한 이름 ${rows.length}개, 다른 것 ${changed.length}개.`,
  '',
  '| 진입점 | 이름 | 결과 |',
  '|---|---|---|',
  ...(changed.length > 0 ? changed : rows).map(
    (r) => `| ${r.entry} | ${r.name} | ${r.result.replaceAll('|', '\\|')} |`,
  ),
  '',
].join('\n');
writeFileSync(join(dirname(outDir), 'types.md'), md);
console.log(`\n${md}`);
console.log(`단언 파일: ${checkFile}`);
process.exit(changed.length > 0 ? 1 : 0);
