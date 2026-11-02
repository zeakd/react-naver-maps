// 배포 형태 패키지를 프레임워크별 앱에 설치해 빌드, SSR, 하이드레이션, 인증, 지도 조작을 확인한다.
// 결과는 표로 출력하고 RNM_FRAMEWORK_REPORT 또는 test-results/frameworks.json 에 JSON 으로 쓴다.
// 사용: pnpm verify:frameworks [앱 이름...]. Maps 키 때문에 앱을 localhost:4321 에서 하나씩 띄운다.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
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

async function portInUse() {
  try {
    await fetch(URL_BASE);
    return true;
  } catch {
    return false;
  }
}

async function waitForPortFree() {
  const deadline = Date.now() + 10000;
  while (await portInUse()) {
    if (Date.now() > deadline) throw new Error(`포트 ${PORT} 이 비지 않았다`);
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
    page
      .goto(url)
      .then(() =>
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
