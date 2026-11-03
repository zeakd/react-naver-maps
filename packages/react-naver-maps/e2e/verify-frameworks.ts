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

const PORT = 4321;
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

// 시작할 때 포트가 비어 있음을 확인했으므로 지금 포트를 쥔 프로세스는 이 스크립트가 띄운 서버다.
// Next 는 next-server 를 자기 프로세스 그룹으로 띄워 그룹 종료 신호가 닿지 않을 수 있다.
// listen 을 멈추고 연결만 쥔 워커도 정리한다. 이 스크립트 자신(연결의 반대편)은 뺀다.
function portHolders(): number[] {
  try {
    const out = execFileSync('lsof', ['-ti', `tcp:${PORT}`], {
      encoding: 'utf8',
    });
    return [...new Set(out.split('\n').filter(Boolean).map(Number))].filter(
      (pid) => pid !== process.pid,
    );
  } catch {
    // lsof 는 대상이 없으면 실패로 끝난다. lsof 가 없는 환경도 여기로 온다.
    return [];
  }
}

function killPortHolders() {
  for (const pid of portHolders()) {
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

async function waitForPortFree() {
  const graceEnd = Date.now() + 2000;
  const deadline = Date.now() + 15000;
  while (await portInUse()) {
    if (Date.now() > deadline) {
      throw new Error(`포트 ${PORT} 이 비지 않았다. ${describePort()}`);
    }
    // 한 번 죽여도 서버가 자식을 다시 띄우거나 늦게 뜬 프로세스가 있을 수 있어 매번 확인한다.
    if (Date.now() > graceEnd) killPortHolders();
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
    if (server?.pid) {
      try {
        process.kill(-server.pid);
      } catch {
        // 이미 끝난 서버
      }
    }
    await waitForPortFree();
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
