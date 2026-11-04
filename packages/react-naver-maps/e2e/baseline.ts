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
import { dirname, join, resolve } from 'node:path';

const here = import.meta.dirname;
const pkgDir = resolve(here, '..');

/**
 * 비교 기준선. `label` 은 `.targets/`·`.compare/` 의 폴더 이름이다.
 * - `release`: npm 에 배포된 버전을 지금 하네스로 돈다.
 * - `git`: 그 커밋의 라이브러리를 빌드해 지금 하네스로 돈다. 라이브러리 정리의 동작 보존 확인.
 * - `harness`: 그 커밋의 하네스와 라이브러리를 그 커밋의 작업 트리에서 그대로 돈다. 라이브러리 소스가
 *   지금과 같아야 하므로(`compare.ts` 가 확인), 하네스만 바꾼 변경의 동작 보존 확인이다.
 *   `harness:HEAD` 는 같은 코드끼리 돌리는 것이라 실행마다 흔들리는 필드를 찾는 데 쓴다.
 * release·git 의 label 은 시나리오 앱이 받는 RNM_TARGET 값이기도 하다.
 */
export type Base =
  | { kind: 'release'; label: string; version: string }
  | { kind: 'git' | 'harness'; label: string; ref: string; sha: string };

export function parseBase(arg: string): Base {
  const m = /^(git|harness):(.+)$/.exec(arg);
  if (!m) return { kind: 'release', label: arg, version: arg };
  const kind = m[1] as 'git' | 'harness';
  const ref = m[2]!;
  const sha = execFileSync(
    'git',
    ['rev-parse', '--verify', `${ref}^{commit}`],
    { cwd: pkgDir, encoding: 'utf8' },
  ).trim();
  return { kind, label: `${kind}-${sha.slice(0, 7)}`, ref, sha };
}

/** `.targets/<label>/package` 에 기준선 패키지를 풀어 두고 시나리오 앱이 쓸 진입점을 만든다. */
export function prepareTarget(b: Base, imports: string[]): string {
  const dir = join(here, '.targets', b.label);
  if (!existsSync(join(dir, 'package', 'package.json'))) {
    mkdirSync(dir, { recursive: true });
    const tgz = b.kind === 'release' ? packRelease(b.version) : packGit(b.sha);
    execFileSync('tar', ['-xzf', tgz, '-C', dir]);
    // tarball 을 받은 임시 폴더는 풀고 나면 필요 없다.
    rmSync(dirname(tgz), { recursive: true, force: true });
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
 * 커밋을 임시 작업 트리에 꺼내 새로 빌드하고 pack 한 tarball 경로. 지금 작업 트리의 `dist` 를 쓰지
 * 않는 것은 커밋하지 않은 변경과 지난 빌드의 파일이 섞이지 않게 하려는 것이다.
 */
function quiet(cmd: string, argv: string[], cwd: string): void {
  execFileSync(cmd, argv, { cwd, stdio: ['ignore', 'ignore', 'inherit'] });
}

function packGit(sha: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'rnm-base-'));
  console.log(`\n▶ 기준선 ${sha.slice(0, 7)} 빌드`);
  withTree(sha, (pkg) => {
    quiet('pnpm', ['run', 'build'], pkg);
    quiet('pnpm', ['pack', '--pack-destination', tmp], pkg);
  });
  const tgz = readdirSync(tmp).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error(`${sha}: pack 결과가 없다`);
  return join(tmp, tgz);
}

/**
 * 커밋을 임시 작업 트리에 꺼내 의존성을 설치하고, 그 트리의 패키지 폴더로 `fn` 을 부른 뒤 지운다.
 * 임시 폴더는 시스템 임시 폴더 아래라 이 저장소의 vite·tsconfig 설정과 섞이지 않는다.
 */
export function withTree<T>(sha: string, fn: (pkg: string) => T): T {
  const tmp = mkdtempSync(join(tmpdir(), 'rnm-tree-'));
  const tree = join(tmp, 'tree');
  quiet('git', ['worktree', 'add', '--detach', tree, sha], pkgDir);
  try {
    quiet(
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
    return fn(join(tree, 'packages', 'react-naver-maps'));
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', tree], {
      cwd: pkgDir,
    });
    rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * `scenarios/target.ts` 가 가져오는 소스 경로(확장자 없이) → 그 파일이 예전에 있던 경로. 기준선 커밋이
 * 옮기기 전이면 거기서 찾는다(src/core 를 역할별 폴더로 나눈 변경).
 */
const PREVIOUS_PATHS: Record<string, string[]> = {
  index: ['core/react-naver-maps'],
  'sdk/load-script': ['core/load-script'],
};

/**
 * 시나리오 앱의 진입점(`scenarios/target.ts`)을 기준선 패키지로 바꾼 `target.js` 를 쓴다.
 * target.ts 의 `export … from '../../src/<경로>.js'` 마다 기준선의 `dist/<경로>.js` 를 쓴다.
 * 옮겨진 파일은 PREVIOUS_PATHS 의 옛 자리에서도 찾는다. 0.3 은 그 옛 자리에서 `core/` 를 뗀 곳이다.
 * 기준선에 없는 export 는
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
    const file = [path, ...(PREVIOUS_PATHS[path] ?? [])]
      .flatMap((p) => [p, p.replace(/^core\//, '')])
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
