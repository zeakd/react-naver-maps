// Playwright globalSetup: webServer 가 뜬 뒤(또는 떠 있는 서버를 재사용하기로 한 뒤) 테스트 전에 돈다.
// 그 서버가 이 설정의 webServer.cwd 에서 뜬 것인지 확인한다(`port.ts`).
import type { FullConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { checkServer } from './port.ts';

export default function portSetup(config: FullConfig): void {
  const server = config.webServer;
  if (!server?.cwd || !config.configFile) return;
  checkServer(resolve(dirname(config.configFile), server.cwd));
}
