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
 * 같은 실행의 자식이면(환경 변수로 안다) 아무것도 하지 않는다. 프로세스가 끝날 때 푼다(아래 시그널 처리 참고).
 *
 * 잠금 파일은 배타 생성(`wx`)으로 만든다. 동시에 시작한 두 실행 중 하나만 이긴다. 확인과 쓰기를 따로
 * 하면 둘 다 "없음" 을 읽고 둘 다 썼다(2026-11-05, 같은 순간 시작한 두 프로세스 40회 중 28회).
 * 죽은 실행이 남긴 잠금(SIGKILL 등)은 저절로 치우지 않고 알린다. 치우기와 다른 실행의 새 잠금 만들기가
 * 겹치면 치우는 쪽이 새 잠금을 지워 둘 다 얻었다(2026-11-05 리뷰에서 재현).
 */
export function holdPort(command: string): void {
  const owner = Number(process.env[OWNER_ENV]);
  if (owner && alive(owner)) return;
  mkdirSync(dirname(LOCK), { recursive: true });
  const lock: Lock = {
    pid: process.pid,
    cwd: process.cwd(),
    command,
    since: new Date().toISOString(),
  };
  try {
    writeFileSync(LOCK, JSON.stringify(lock), { flag: 'wx' });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    const held = readLock();
    const who = held
      ? `pid ${held.pid}, ${held.command}, 작업 폴더 ${held.cwd}, ${held.since} 부터`
      : '(내용을 읽지 못함)';
    throw new Error(
      held && !alive(held.pid)
        ? [
            `포트 ${PORT} 잠금이 남아 있다. 잡았던 실행(${who})은 이미 끝났다.`,
            `  다른 실행이 없는지 확인하고 지운다: rm ${LOCK}`,
          ].join('\n')
        : [
            `포트 ${PORT} 를 다른 실행이 쓰고 있다: ${who}`,
            `  끝나기를 기다린다.`,
          ].join('\n'),
    );
  }
  process.env[OWNER_ENV] = String(process.pid);
  const release = () => {
    if (readLock()?.pid === process.pid) rmSync(LOCK, { force: true });
  };
  process.on('exit', release);
  // 시그널을 처리하는 곳이 없으면 프로세스는 exit 이벤트 없이 멈춘다. 그때만 풀고 같은 시그널로 다시 멈춘다.
  // 다른 처리기(Playwright 등)가 있으면 그쪽이 정리를 마치고 exit 하므로 그때(exit 이벤트) 푼다. 시그널을
  // 받자마자 풀면 Playwright 가 정리하는 동안 다른 실행이 포트를 잡았다(2026-11-05 리뷰에서 재현).
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.once(signal, () => {
      if (process.listenerCount(signal) > 0) return;
      release();
      process.kill(process.pid, signal);
    });
  }
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
