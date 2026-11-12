// 저장소 README(GitHub)와 패키지 README(npm)는 같은 내용이어야 한다.
// npm 페이지는 packages/react-naver-maps/README.md 를 보여 주는데, 따로 고치다 0.2 내용이 남은 채로
// 0.4 직전까지 간 일이 있었다. 루트 README.md 를 고치고 `--write` 로 복사한다.
//
//   node scripts/check-readme.mts          # 다르면 실패
//   node scripts/check-readme.mts --write  # 루트 README 를 패키지로 복사
import { copyFileSync, readFileSync } from 'node:fs';

const root = 'README.md';
const pkg = 'packages/react-naver-maps/README.md';

if (process.argv.includes('--write')) {
  copyFileSync(root, pkg);
  console.log(`${root} → ${pkg}`);
} else if (readFileSync(root, 'utf8') !== readFileSync(pkg, 'utf8')) {
  console.error(`${pkg} 가 ${root} 와 다르다. 루트 README 를 고친 뒤 \`node scripts/check-readme.mts --write\` 로 복사한다.`);
  process.exit(1);
}
