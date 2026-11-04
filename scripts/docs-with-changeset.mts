// 라이브러리 소스를 바꾸고 changeset 을 더한 변경은 문서 사이트도 함께 바꾼다.
//
// 사용자에게 보이는 동작이 changeset 에만 적히고 문서에는 몇 PR 뒤에 들어간 일이 있었다(center 되울림:
// #241 은 코드와 changeset 만, 문서는 #247). 그래서 같은 PR 에서 문서를 바꾸게 한다. 문서가 필요 없는
// 변경이면 PR 본문에 `docs: none (이유)` 를 한 줄 적는다. 이 검사는 문서를 건드렸는지만 보고 맞는지는
// 보지 않는다. 그것은 리뷰가 본다.
//
//   node scripts/docs-with-changeset.mts [base] [head]   # 기본 origin/v0.4 와 HEAD
//
// CI 는 PR 의 base 를 넘기고, PR 본문은 GITHUB_EVENT_PATH(pull_request 이벤트)에서 읽는다.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [base = 'origin/v0.4', head = 'HEAD'] = process.argv.slice(2);

const changed = execFileSync(
  'git',
  ['diff', '--name-status', '--no-renames', `${base}...${head}`],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [status, path] = line.split('\t') as [string, string];
    return { status, path };
  });

const changesets = changed.filter(
  (c) =>
    c.status === 'A' &&
    /^\.changeset\/[^/]+\.md$/.test(c.path) &&
    !c.path.endsWith('README.md'),
);
const library = changed.filter(
  (c) =>
    c.path.startsWith('packages/react-naver-maps/src/') &&
    !c.path.includes('/__tests__/') &&
    !/\.(spec|test)\.tsx?$/.test(c.path),
);
const docs = changed.filter((c) =>
  c.path.startsWith('website/src/content/docs/'),
);

function prBody(): string {
  const event = process.env.GITHUB_EVENT_PATH;
  if (!event) return process.env.PR_BODY ?? '';
  const json = JSON.parse(readFileSync(event, 'utf8')) as {
    pull_request?: { body?: string | null };
  };
  return json.pull_request?.body ?? '';
}

if (changesets.length === 0 || library.length === 0 || docs.length > 0) {
  console.log('문서 검사: 해당 없음 또는 문서도 바뀜');
  process.exit(0);
}
const waiver = /^docs:\s*none\s*\((.+)\)\s*$/m.exec(prBody());
if (waiver) {
  console.log(`문서 검사: 문서 없음 (${waiver[1]})`);
  process.exit(0);
}
console.error(
  [
    '라이브러리 소스를 바꾸고 changeset 을 더했는데 문서(website/src/content/docs/)가 그대로다.',
    `  changeset: ${changesets.map((c) => c.path).join(', ')}`,
    `  소스: ${library
      .slice(0, 5)
      .map((c) => c.path)
      .join(', ')}${library.length > 5 ? ' …' : ''}`,
    '사용자에게 보이는 동작을 바꿨으면 관련 문서를 함께 고친다. 문서가 필요 없으면 PR 본문에',
    '`docs: none (이유)` 를 한 줄 적는다.',
  ].join('\n'),
);
process.exit(1);
