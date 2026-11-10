// 빌드한 문서 사이트(website/dist)의 내부 링크가 실제 페이지로 가는지 본다. 빌드가 성공해도 링크는
// 검사하지 않아서, 사이트 접두사(/react-naver-maps)나 페이지 위치를 잘못 계산한 링크가 404 로 배포됐다
// (2026-11-05 리뷰에서 16개).
//
//   node scripts/check-site-links.mts [dist 폴더]   # 기본 website/dist, 먼저 사이트를 빌드한다
//
// 내부 링크: 같은 사이트의 상대 경로와 / 로 시작하는 경로. 바깥 주소(http:, mailto: 등), 문서 안
// 앵커(#…)만 있는 링크, 옛 문서 보관본(/0.1.0/, /0.3.0/)은 보지 않는다.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, resolve } from 'node:path';

const BASE = '/react-naver-maps';
// 옛 버전 문서 보관본. 그때 빌드한 결과라 지금 사이트의 링크 규칙으로 보지 않는다.
const ARCHIVES = ['0.1.0', '0.3.0'];
const dist = resolve(process.argv[2] ?? 'website/dist');
if (!existsSync(dist)) {
  console.error(`${dist} 가 없다. 문서 사이트를 먼저 빌드한다.`);
  process.exit(2);
}

function* htmlFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (ARCHIVES.includes(relative(dist, p))) continue;
      yield* htmlFiles(p);
    } else if (name.endsWith('.html')) yield p;
  }
}

/** dist 안 파일 경로 → 그 페이지의 URL 경로(/react-naver-maps/a/b/). */
function pageUrl(file: string): string {
  const rel = relative(dist, file).split('\\').join('/');
  const dir = rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel;
  return posix.join(BASE, dir);
}

/** URL 경로가 dist 의 파일로 풀리는가. */
function exists(urlPath: string): boolean {
  if (!urlPath.startsWith(BASE)) return false;
  const rest = decodeURI(urlPath.slice(BASE.length)).replace(/^\//, '');
  const candidates = [rest, join(rest, 'index.html'), `${rest}.html`];
  return candidates.some((c) => {
    const p = join(dist, c);
    return existsSync(p) && statSync(p).isFile();
  });
}

const broken: string[] = [];
let checked = 0;
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const from = pageUrl(file);
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const href = m[1]!.replaceAll('&amp;', '&');
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('//')) {
      continue;
    }
    const path = href.split('#')[0]!.split('?')[0]!;
    if (!path) continue;
    const target = path.startsWith('/')
      ? path
      : posix.join(from.endsWith('/') ? from : `${posix.dirname(from)}/`, path);
    if (ARCHIVES.some((a) => target.startsWith(`${BASE}/${a}`))) continue;
    checked++;
    if (!exists(target)) broken.push(`${from} → ${href} (${target})`);
  }
}
const unique = [...new Set(broken)];
if (unique.length > 0) {
  console.error(`문서 사이트의 깨진 내부 링크 ${unique.length}개(검사 ${checked}개):`);
  for (const b of unique) console.error(`  ${b}`);
  process.exit(1);
}
console.log(`문서 사이트 내부 링크 ${checked}개 모두 페이지로 간다`);
