// 문서 코드 블록이 공개 API 와 맞는지 타입으로 본다. import 한 이름과 prop 이 없어지면 실패한다.
//
// 문서의 코드는 조각이라 앞에서 만든 변수를 쓰고 그 정의는 없다. 그래서 정의를 못 찾는 오류는 보지 않고
// 라이브러리를 가져오는 블록만 본다. 빌드한 `dist` 의 타입을 쓰므로 빌드 뒤에 돈다.
//
//   node scripts/check-doc-code.mts
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = join(root, 'packages/react-naver-maps');
const docs = join(root, 'website/src/content/docs');

// 조각이라 나는 오류: 정의 없는 이름, 비슷한 이름 제안, 함수 밖 await.
const IGNORED = new Set(['TS2304', 'TS2552', 'TS1309', 'TS1308']);

const dir = mkdtempSync(join(tmpdir(), 'rnm-doc-code-'));
let blocks = 0;
const written = new Set<string>();
for (const entry of readdirSync(docs, { recursive: true, encoding: 'utf8' })) {
  if (!entry.endsWith('.mdx')) continue;
  const text = readFileSync(join(docs, entry), 'utf8');
  let index = 0;
  for (const [, lang, code] of text.matchAll(
    /```(tsx|ts|jsx|js)\n(.*?)```/gs,
  )) {
    index += 1;
    // 타입 보강 예제는 설명용 이름을 선언해 다른 블록의 판정을 바꾼다.
    if (!code!.includes('react-naver-maps') || code!.includes('declare module'))
      continue;
    const ext = lang === 'tsx' || lang === 'jsx' ? 'tsx' : 'ts';
    // 문서 경로 전체를 이름에 넣는다. 파일 이름만 쓰면 guides/use-map 과 api-references/use-map 처럼
    // 이름이 같은 문서끼리 덮어써 한쪽을 검사하지 않는다.
    const name = `${entry.replace(/\.mdx$/, '').replaceAll(/[\\/]/g, '__')}-${index}.${ext}`;
    if (written.has(name)) throw new Error(`검사 파일 이름이 겹친다: ${name}`);
    written.add(name);
    writeFileSync(join(dir, name), `export {};\n${code}`);
    blocks += 1;
  }
}

const types = (name: string) => join(pkg, 'node_modules/@types', name);
writeFileSync(
  join(dir, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      jsx: 'react-jsx',
      module: 'nodenext',
      moduleResolution: 'nodenext',
      target: 'es2022',
      noEmit: true,
      skipLibCheck: true,
      strict: false,
      types: ['navermaps'],
      typeRoots: [join(pkg, 'node_modules/@types')],
      paths: {
        'react-naver-maps': [join(pkg, 'dist/index.d.ts')],
        'react-naver-maps/*': [join(pkg, 'dist/*/index.d.ts')],
        react: [types('react')],
        'react/jsx-runtime': [types('react/jsx-runtime')],
        'react-dom': [types('react-dom')],
      },
    },
    include: ['*.ts', '*.tsx'],
  }),
);

const tsc = spawnSync(
  'pnpm',
  ['exec', 'tsc', '-p', join(dir, 'tsconfig.json')],
  {
    cwd: pkg,
    encoding: 'utf8',
  },
);
rmSync(dir, { recursive: true, force: true });

// 컴파일러가 실행되지 못했거나(실행 오류·시그널) 진단 없이 실패했으면 검사하지 못한 것이다. 통과로 치지 않는다.
const output = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`;
const diagnostics = output
  .split('\n')
  .filter((line) => /error TS\d+/.test(line));
if (tsc.error || tsc.signal || (tsc.status !== 0 && diagnostics.length === 0)) {
  console.error(
    `tsc 를 실행하지 못했다(status ${tsc.status}, signal ${tsc.signal ?? '-'}): ${tsc.error?.message ?? output.trim()}`,
  );
  process.exit(1);
}
const errors = diagnostics
  .filter((line) => !IGNORED.has(/error (TS\d+)/.exec(line)![1]!))
  .map((line) => line.replace(/^.*?([^/\\]+\.tsx?\()/, '$1'));

if (blocks === 0) {
  console.error('문서에서 코드 블록을 찾지 못했다');
  process.exit(1);
}
if (errors.length > 0) {
  console.error(
    `문서 코드 블록이 공개 API 와 맞지 않는다(파일 이름은 <문서 경로, / 는 __>-<블록 번호>):\n${errors.join('\n')}`,
  );
  process.exit(1);
}
console.log(`문서 코드 블록 ${blocks}개가 공개 API 와 맞다`);
