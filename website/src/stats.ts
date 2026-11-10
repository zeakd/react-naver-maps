// 홈과 위쪽 막대에 보이는 저장소 신호(GitHub 별·기여자, npm 주간 내려받기). 빌드할 때 한 번 받는다.
// 받지 못하면(오프라인, 요청 제한) 그 값만 빼고 빌드는 계속한다.

export type Stats = {
  stars: number | null;
  contributors: number | null;
  weekly: number | null;
};

let cached: Promise<Stats> | null = null;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { 'user-agent': 'react-naver-maps-docs' },
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function load(): Promise<Stats> {
  const [repo, contributors, downloads] = await Promise.allSettled([
    getJson('https://api.github.com/repos/zeakd/react-naver-maps'),
    getJson(
      'https://api.github.com/repos/zeakd/react-naver-maps/contributors?per_page=100',
    ),
    getJson('https://api.npmjs.org/downloads/point/last-week/react-naver-maps'),
  ]);
  const val = <T>(
    r: PromiseSettledResult<unknown>,
    pick: (v: any) => T,
  ): T | null => {
    if (r.status !== 'fulfilled') return null;
    try {
      return pick(r.value) ?? null;
    } catch {
      return null;
    }
  };
  return {
    stars: val(repo, (v) => v.stargazers_count as number),
    contributors: val(contributors, (v) =>
      Array.isArray(v) ? v.length : null,
    ),
    weekly: val(downloads, (v) => v.downloads as number),
  };
}

export function githubStats(): Promise<Stats> {
  cached ??= load();
  return cached;
}

/** 3878 → '3.9천', 12345 → '1.2만' */
export function compact(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}천`;
  return String(n);
}
