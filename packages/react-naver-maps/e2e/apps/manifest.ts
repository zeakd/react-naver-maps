export type FixtureApp = {
  name: string;
  /** _shared/map-check.tsx 를 복사할 위치 */
  mapCheck: string;
  /** 서버가 HTML 에 버튼까지 그려 보내는가 */
  ssr: boolean;
  /** 지도 페이지 경로 */
  path?: string;
};

export const apps: FixtureApp[] = [
  { name: 'vite', mapCheck: 'src/map-check.tsx', ssr: false },
  { name: 'next', mapCheck: 'app/map-check.tsx', ssr: true },
  { name: 'react-router', mapCheck: 'app/map-check.tsx', ssr: true },
  { name: 'tanstack-start', mapCheck: 'src/map-check.tsx', ssr: true },
  { name: 'astro', mapCheck: 'src/components/map-check.tsx', ssr: true },
];
