// 배포 형태 패키지를 프레임워크별 앱에 설치해 빌드, SSR, 하이드레이션, 인증, 지도 조작을 확인한다.
// 결과는 표로 출력하고 RNM_FRAMEWORK_REPORT 또는 test-results/frameworks.json 에 JSON 으로 쓴다.
// 사용: pnpm verify:frameworks [앱 이름...]. Maps 키 때문에 앱을 localhost:4321 에서 하나씩 띄운다.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';
import { apps, type FixtureApp } from './apps/manifest.ts';
import { holdPort, PORT } from './port.ts';

holdPort('verify:frameworks');
const URL_BASE = `http://localhost:${PORT}`;
const AUTH_GRACE_MS = 3000;
const TARGET = { lat: 37.57, lng: 126.99 };
const here = import.meta.dirname;
const packageDir = path.resolve(here, '..');

type Step =
  | 'install'
  | 'build'
  | 'serve'
  | 'ssr'
  | 'hydrate'
  | 'auth'
  | 'interact';
type Report = { app: string } & Partial<Record<Step, boolean | 'n/a'>> & {
    error?: string;
  };

function run(command: string, args: string[], cwd: string) {
  execFileSync(command, args, {
    cwd,
    stdio: 'pipe',
    env: { ...process.env, CI: '1', pnpm_config_strict_dep_builds: 'false' },
  });
}

function packTarball(dir: string) {
  run('pnpm', ['pack', '--pack-destination', dir], packageDir);
  const file = fs.readdirSync(dir).find((f) => f.endsWith('.tgz'));
  if (!file) throw new Error('tgz 를 만들지 못했다');
  return path.join(dir, file);
}

function prepare(app: FixtureApp, tarball: string, root: string) {
  const dir = path.join(root, app.name);
  fs.cpSync(path.join(here, 'apps', app.name), dir, { recursive: true });
  fs.mkdirSync(path.dirname(path.join(dir, app.mapCheck)), { recursive: true });
  fs.copyFileSync(
    path.join(here, 'apps/_shared/map-check.tsx'),
    path.join(dir, app.mapCheck),
  );
  const manifest = path.join(dir, 'package.json');
  fs.writeFileSync(
    manifest,
    fs.readFileSync(manifest, 'utf8').replace('__TGZ__', `file:${tarball}`),
  );
  return dir;
}

// fetch 는 keep-alive 연결을 다시 쓴다. 서버가 listen 을 멈춰도 남은 워커가 그 연결에 답해
// 포트가 계속 쓰이는 것처럼 보였다(CI, next 뒤). 매번 새 TCP 연결로 listen 여부만 본다.
function listening(host: string) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ port: PORT, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function portInUse() {
  const [v4, v6] = await Promise.all([
    listening('127.0.0.1'),
    listening('::1'),
  ]);
  return v4 || v6;
}

/** 이 스크립트가 띄운 서버와 그 자손. 프로세스 번호와 프로세스 그룹 번호. */
type Owned = { pids: Set<number>; groups: Set<number> };

/**
 * root 와 그 자손을 지금 찾는다. 서버를 그룹째 끈 뒤에는 남은 자손의 부모가 바뀌어(init) 찾을 수 없으므로
 * 끄기 전에 부른다. Next 는 next-server 를 자기 프로세스 그룹으로 띄워 그룹 종료 신호가 닿지 않을 수
 * 있어 그룹 번호도 기록한다.
 */
function ownedBy(root: number): Owned {
  const rows = new Map<number, { ppid: number; pgid: number }>();
  try {
    const out = execFileSync('ps', ['-A', '-o', 'pid=,ppid=,pgid='], {
      encoding: 'utf8',
    });
    for (const line of out.trim().split('\n')) {
      const [pid, ppid, pgid] = line.trim().split(/\s+/).map(Number);
      if (pid) rows.set(pid, { ppid: ppid!, pgid: pgid! });
    }
  } catch {
    // ps 가 없으면 root 만 안다.
  }
  const pids = new Set([root]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const [pid, { ppid }] of rows) {
      if (!pids.has(pid) && pids.has(ppid)) {
        pids.add(pid);
        grew = true;
      }
    }
  }
  const groups = new Set(
    [...pids].map((p) => rows.get(p)?.pgid).filter((g): g is number => !!g),
  );
  return { pids, groups };
}

/**
 * 포트를 쥔 프로세스 가운데 이 스크립트가 띄운 것(owned)만. 포트에 접속한 다른 프로세스(사용자 브라우저,
 * 다른 도구)는 연결의 반대편으로 함께 나오므로 소유를 확인하지 않으면 그것까지 죽였다(2026-11-05 리뷰).
 * listen 을 멈추고 연결만 쥔 서버 워커도 owned 이면 정리한다.
 */
function portHolders(owned: Owned): number[] {
  let out: string;
  try {
    out = execFileSync('lsof', ['-ti', `tcp:${PORT}`], { encoding: 'utf8' });
  } catch {
    // lsof 는 대상이 없으면 실패로 끝난다. lsof 가 없는 환경도 여기로 온다.
    return [];
  }
  const now = ownedBy(process.pid);
  return [...new Set(out.split('\n').filter(Boolean).map(Number))].filter(
    (pid) => {
      if (pid === process.pid) return false;
      if (owned.pids.has(pid)) return true;
      // 이 스크립트의 다른 자손(검사용 브라우저 등)은 서버가 아니다.
      if (now.pids.has(pid)) return false;
      try {
        const pgid = Number(
          execFileSync('ps', ['-o', 'pgid=', '-p', String(pid)], {
            encoding: 'utf8',
          }).trim(),
        );
        return owned.groups.has(pgid);
      } catch {
        return false; // 그새 끝났다
      }
    },
  );
}

function killPortHolders(owned: Owned) {
  for (const pid of portHolders(owned)) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // 그새 끝난 프로세스
    }
  }
}

/** 포트를 놓지 않을 때 원인을 볼 수 있게 누가 쥐고 있는지 적는다. */
function describePort(): string {
  for (const [cmd, args] of [
    ['lsof', ['-nP', `-iTCP:${PORT}`]],
    ['ss', ['-ltnp', `sport = :${PORT}`]],
  ] as const) {
    try {
      return `${cmd}: ${execFileSync(cmd, [...args], { encoding: 'utf8' }).trim()}`;
    } catch {
      // 다음 도구로
    }
  }
  return '포트를 쥔 프로세스를 찾지 못했다 (lsof, ss 실패)';
}

async function waitForPortFree(owned: Owned) {
  const graceEnd = Date.now() + 2000;
  const deadline = Date.now() + 15000;
  while (await portInUse()) {
    if (Date.now() > deadline) {
      throw new Error(`포트 ${PORT} 이 비지 않았다. ${describePort()}`);
    }
    // 한 번 죽여도 서버가 자식을 다시 띄우거나 늦게 뜬 프로세스가 있을 수 있어 매번 확인한다.
    if (Date.now() > graceEnd) killPortHolders(owned);
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function waitForServer(server: ChildProcess) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error(`서버 종료 코드 ${server.exitCode}`);
    try {
      await fetch(URL_BASE);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('서버가 뜨지 않았다');
}

async function check(app: FixtureApp, browser: Browser, report: Report) {
  const url = `${URL_BASE}${app.path ?? '/'}`;
  const html = await (await fetch(url)).text();
  report.ssr = app.ssr ? html.includes('id="move"') : 'n/a';

  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.addInitScript(() => {
    Object.assign(window, {
      authFailed: false,
      navermap_authFailure: () => Object.assign(window, { authFailed: true }),
    });
  });
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/v3/auth'), {
      timeout: 20000,
    }),
    page.goto(url).then(() =>
      page.waitForFunction(() => 'map' in window, undefined, {
        timeout: 20000,
      }),
    ),
  ]);
  await page.waitForTimeout(AUTH_GRACE_MS);
  report.auth = !(await page.evaluate(
    () => (window as unknown as { authFailed: boolean }).authFailed,
  ));

  await page.click('#move');
  await page.waitForFunction(
    (t) => {
      const c = (
        window as unknown as { map: naver.maps.Map }
      ).map.getCenter() as naver.maps.LatLng;
      return (
        Math.abs(c.lat() - t.lat) < 1e-5 && Math.abs(c.lng() - t.lng) < 1e-5
      );
    },
    TARGET,
    { timeout: 5000 },
  );
  report.interact = true;

  const relevant = errors.filter((e) => !/favicon|404/.test(e));
  report.hydrate = relevant.length === 0;
  if (relevant.length) report.error = relevant[0].slice(0, 300);
  await page.close();
}

async function verify(
  app: FixtureApp,
  tarball: string,
  root: string,
  browser: Browser,
) {
  const report: Report = { app: app.name };
  let server: ChildProcess | undefined;
  try {
    const dir = prepare(app, tarball, root);
    run('pnpm', ['install', '--ignore-workspace'], dir);
    report.install = true;
    run('pnpm', ['run', 'build'], dir);
    report.build = true;
    server = spawn('pnpm', ['run', 'start'], {
      cwd: dir,
      stdio: 'ignore',
      detached: true,
    });
    await waitForServer(server);
    report.serve = true;
    await check(app, browser, report);
  } catch (e) {
    const err = e as Error & { stderr?: Buffer; stdout?: Buffer };
    const detail = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim();
    report.error = (detail || err.message).slice(-400);
  } finally {
    const owned: Owned = server?.pid
      ? ownedBy(server.pid)
      : { pids: new Set(), groups: new Set() };
    if (server?.pid) {
      try {
        process.kill(-server.pid);
      } catch {
        // 이미 끝난 서버
      }
    }
    await waitForPortFree(owned);
  }
  return report;
}

const only = process.argv.slice(2);
const targets = only.length ? apps.filter((a) => only.includes(a.name)) : apps;
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rnm-frameworks-'));
const browser = await chromium.launch();
const reports: Report[] = [];
try {
  if (await portInUse()) throw new Error(`포트 ${PORT} 을 이미 쓰고 있다`);
  const tarball = packTarball(root);
  for (const app of targets) {
    const report = await verify(app, tarball, root, browser);
    reports.push(report);
    console.log(JSON.stringify(report));
  }
} finally {
  await browser.close();
  fs.rmSync(root, { recursive: true, force: true });
}

const steps: Step[] = [
  'install',
  'build',
  'serve',
  'ssr',
  'hydrate',
  'auth',
  'interact',
];
const passed = (r: Report) =>
  !r.error && steps.every((s) => r[s] === true || r[s] === 'n/a');
const output =
  process.env.RNM_FRAMEWORK_REPORT ??
  path.join(packageDir, 'test-results/frameworks.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ reports }, null, 2));
console.table(reports.map((r) => ({ ...r, error: r.error?.slice(0, 60) })));
process.exit(reports.every(passed) ? 0 : 1);
