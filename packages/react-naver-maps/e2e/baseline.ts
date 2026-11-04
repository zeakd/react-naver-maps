// 비교 기준선(배포된 버전, git 커밋)을 `e2e/.targets/<label>/package` 에 준비한다.
// 시나리오 비교(`compare.ts`)와 공개 타입 비교(`compare-types.ts`)가 쓴다.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const here = import.meta.dirname;
const pkgDir = resolve(here, '..');

/**
 * 비교 기준선. `release` 는 npm 에 배포된 버전, `git` 은 이 저장소의 커밋이다.
 * `label` 은 `.targets/`·`.compare/` 의 폴더 이름이자 시나리오 앱이 받는 RNM_TARGET 값이다.
 */
export type Base =
  | { kind: 'release'; label: string; version: string }
  | { kind: 'git'; label: string; ref: string; sha: string };

export function parseBase(arg: string): Base {
  if (!arg.startsWith('git:')) {
    return { kind: 'release', label: arg, version: arg };
  }
  const ref = arg.slice('git:'.length);
  const sha = execFileSync(
    'git',
    ['rev-parse', '--verify', `${ref}^{commit}`],
    { cwd: pkgDir, encoding: 'utf8' },
  ).trim();
  return { kind: 'git', label: `git-${sha.slice(0, 7)}`, ref, sha };
}

/** `.targets/<label>/package` 에 기준선 패키지를 풀어 두고 시나리오 앱이 쓸 진입점을 만든다. */
export function prepareTarget(b: Base, imports: string[]): string {
  const dir = join(here, '.targets', b.label);
  if (!existsSync(join(dir, 'package', 'package.json'))) {
    mkdirSync(dir, { recursive: true });
    const tgz = b.kind === 'release' ? packRelease(b.version) : packGit(b.sha);
    execFileSync('tar', ['-xzf', tgz, '-C', dir]);
    // source map 은 패키지에 없는 소스를 가리켜 Vite 가 경고를 쏟아낸다. 검사에는 필요 없으니
    // map 파일과 그것을 가리키는 주석을 함께 지운다.
    for (const file of readdirSync(join(dir, 'package', 'dist'), {
      recursive: true,
      encoding: 'utf8',
    })) {
      const path = join(dir, 'package', 'dist', file);
      if (file.endsWith('.map')) rmSync(path);
      else if (file.endsWith('.js')) {
        const code = readFileSync(path, 'utf8');
        writeFileSync(
          path,
          code.replace(/\n\/\/# sourceMappingURL=.*\s*$/, '\n'),
        );
      }
    }
  }
  writeShim(dir, b.label, imports);
  return join(dir, 'package');
}

/** npm 에 배포된 버전의 tarball 경로. */
function packRelease(v: string): string {
  // 저장소 안에서는 devEngines 때문에 npm 이 멈추므로 임시 폴더에서 받는다.
  const tmp = mkdtempSync(join(tmpdir(), 'rnm-pack-'));
  const name = execFileSync(
    'npm',
    ['pack', `react-naver-maps@${v}`, '--silent'],
    { cwd: tmp, encoding: 'utf8' },
  ).trim();
  return join(tmp, name);
}

/**
 * 커밋을 임시 작업 트리에 꺼내 새로 빌드하고 pack 한 tarball 경로. 이 작업 트리의 `dist` 를 쓰지
 * 않는 것은 `tsc -b` 가 지난 빌드의 파일을 지우지 않아 배포본과 내용이 달라질 수 있어서다.
 */
function packGit(sha: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'rnm-base-'));
  const tree = join(tmp, 'tree');
  const run = (cmd: string, argv: string[], cwd: string) =>
    execFileSync(cmd, argv, { cwd, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`\n▶ 기준선 ${sha.slice(0, 7)} 빌드`);
  run('git', ['worktree', 'add', '--detach', tree, sha], pkgDir);
  try {
    run(
      'pnpm',
      [
        'install',
        '--frozen-lockfile',
        '--prefer-offline',
        '--filter',
        'react-naver-maps',
      ],
      tree,
    );
    const pkg = join(tree, 'packages', 'react-naver-maps');
    run('pnpm', ['run', 'build'], pkg);
    run('pnpm', ['pack', '--pack-destination', tmp], pkg);
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', tree], {
      cwd: pkgDir,
    });
  }
  const tgz = readdirSync(tmp).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error(`${sha}: pack 결과가 없다`);
  return join(tmp, tgz);
}

/**
 * 시나리오 앱의 진입점(`scenarios/target.ts`)을 기준선 패키지로 바꾼 `target.js` 를 쓴다.
 * target.ts 의 `export … from '../../src/<경로>.js'` 마다 기준선의 `dist/<경로>.js` 를 쓴다.
 * 0.3 은 코어가 `dist/` 바로 아래에 있어 `core/` 를 떼고도 찾는다. 기준선에 없는 export 는
 * 쓰면 바로 알 수 있게 던지는 함수로 채운다. 그런 시나리오는 since 로 건너뛴다.
 */
function writeShim(dir: string, label: string, imports: string[]): void {
  const dist = join(dir, 'package', 'dist');
  const source = readFileSync(join(here, 'scenarios', 'target.ts'), 'utf8');
  const lines: string[] = [];
  const provided = new Set<string>();
  for (const m of source.matchAll(
    /export\s+(\*|\{[^}]*\})\s+from\s+'\.\.\/\.\.\/src\/([^']+)\.js'/g,
  )) {
    const [, what, path] = m as unknown as [string, string, string];
    const file = [path, path.replace(/^core\//, '')]
      .map((p) => `${p}.js`)
      .find((p) => existsSync(join(dist, p)));
    if (!file) continue;
    const names = exportedNames(readFileSync(join(dist, file), 'utf8'), file);
    if (what === '*') {
      lines.push(`export * from './package/dist/${file}';`);
      names.forEach((n) => provided.add(n));
    } else {
      const wanted = what
        .slice(1, -1)
        .split(',')
        .map((n) => n.trim());
      const have = wanted.filter((n) => n && names.has(n));
      if (have.length > 0) {
        lines.push(
          `export { ${have.join(', ')} } from './package/dist/${file}';`,
        );
      }
      have.forEach((n) => provided.add(n));
    }
  }
  const missing = imports.filter((name) => !provided.has(name));
  writeFileSync(
    join(dir, 'target.js'),
    [
      ...lines,
      ...missing.map(
        (name) =>
          `export function ${name}() { throw new Error('${label} 에는 ${name} 이 없다'); }`,
      ),
      `export const TARGET = '${label}';`,
      '',
    ].join('\n'),
  );
}

/** 빌드된 모듈이 내보내는 값 이름. `export *` 는 이름을 알 수 없어 거부한다. */
export function exportedNames(code: string, file: string): Set<string> {
  if (/export\s*\*/.test(code)) {
    throw new Error(
      `${file} 의 export * 는 이름을 셀 수 없다. writeShim 을 고친다.`,
    );
  }
  const names = new Set<string>();
  for (const m of code.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .at(-1);
      if (name) names.add(name);
    }
  }
  for (const m of code.matchAll(
    /export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.add(m[1]!);
  }
  return names;
}
