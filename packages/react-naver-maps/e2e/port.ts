// 실제 SDK 검사가 함께 쓰는 포트 4321 을 한 실행만 쓰게 하고, 떠 있는 서버가 이 작업 트리의 것인지 확인한다.
//
// Maps 키의 Web 서비스 URL 에 http://localhost:4321 만 등록되어 있어서 시나리오(`scenarios.config.ts`),
// 문서 사이트 검사(`playwright.config.ts`), 프레임워크 검증(`verify-frameworks.ts`), 비교(`compare.ts`)가
// 모두 이 포트를 쓴다. 작업 트리가 여럿이면 두 가지가 틀어진다.
// - 떠 있는 서버를 재사용하는 실행이 다른 작업 트리의 서버를 검사하고 통과를 낸다.
// - 두 실행을 차례로 도는 비교 사이에 다른 실행이 포트를 잡는다.
// 그래서 실행 전체 동안 잠금 파일을 잡고(`holdPort`), 테스트 전에 서버 프로세스의 작업 폴더를
// 확인한다(`checkServer`). 잠금은 사용자 홈에 두어 같은 기기의 모든 작업 트리가 같은 파일을 본다.
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const PORT = 4321;

const LOCK = join(homedir(), '.cache', 'react-naver-maps', `port-${PORT}.lock`);
/** 잠금을 잡은 프로세스. 자식 프로세스(playwright 워커, compare 가 띄운 playwright)는 이 값으로 같은 실행임을 안다. */
const OWNER_ENV = 'RNM_PORT_OWNER';

type Lock = { pid: number; cwd: string; command: string; since: string };

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM 은 다른 사용자의 살아 있는 프로세스다.
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function readLock(): Lock | undefined {
  try {
    return JSON.parse(readFileSync(LOCK, 'utf8')) as Lock;
  } catch {
    return undefined;
  }
}

/**
 * 이 실행이 끝날 때까지 포트를 잡는다. 다른 실행이 잡고 있으면 그 실행을 알려 주고 던진다.
 * 같은 실행의 자식이면(환경 변수로 안다) 아무것도 하지 않는다. 잡은 프로세스가 끝나면 풀린다.
 */
export function holdPort(command: string): void {
  const owner = Number(process.env[OWNER_ENV]);
  if (owner && alive(owner)) return;
  const held = readLock();
  if (held && held.pid !== process.pid && alive(held.pid)) {
    throw new Error(
      [
        `포트 ${PORT} 를 다른 실행이 쓰고 있다: pid ${held.pid}, ${held.command}`,
        `  작업 폴더 ${held.cwd}, ${held.since} 부터`,
        `  끝나기를 기다린다. 남은 잠금이면 ${LOCK} 를 지운다.`,
      ].join('\n'),
    );
  }
  mkdirSync(dirname(LOCK), { recursive: true });
  const lock: Lock = {
    pid: process.pid,
    cwd: process.cwd(),
    command,
    since: new Date().toISOString(),
  };
  writeFileSync(LOCK, JSON.stringify(lock));
  process.env[OWNER_ENV] = String(process.pid);
  process.on('exit', () => {
    if (readLock()?.pid === process.pid) rmSync(LOCK, { force: true });
  });
}

/** 포트에서 듣고 있는 프로세스와 그 작업 폴더. 없으면 undefined. */
export function listener(): { pid: number; cwd: string } | undefined {
  const r = spawnSync('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t'], {
    encoding: 'utf8',
  });
  const pid = Number(r.stdout.trim().split('\n')[0]);
  if (!pid) return undefined;
  const c = spawnSync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
    encoding: 'utf8',
  });
  const cwd = c.stdout
    .split('\n')
    .find((l) => l.startsWith('n'))
    ?.slice(1);
  return { pid, cwd: cwd ?? '' };
}

/**
 * 포트의 서버가 `expectedCwd` 에서 뜬 것인지 확인한다. Playwright 의 webServer 는 설정의 `cwd` 에서
 * 서버를 띄우므로 서버 프로세스의 작업 폴더가 그 경로다. 다른 작업 트리나 다른 종류의 서버
 * (시나리오 페이지 대신 문서 사이트)면 던진다. lsof 가 없는 환경(CI 등)에서는 확인하지 않는다.
 */
export function checkServer(expectedCwd: string): void {
  if (spawnSync('lsof', ['-v']).error) return;
  const l = listener();
  if (!l) throw new Error(`포트 ${PORT} 에 서버가 없다`);
  const want = realpathSync(expectedCwd);
  if (l.cwd !== want) {
    throw new Error(
      [
        `포트 ${PORT} 의 서버(pid ${l.pid})는 이 실행의 서버가 아니다.`,
        `  서버 작업 폴더 ${l.cwd || '(알 수 없음)'}`,
        `  기대한 폴더   ${want}`,
        '  다른 작업 트리가 띄운 서버를 재사용했다. 그 서버를 끄고 다시 돌린다.',
      ].join('\n'),
    );
  }
}
