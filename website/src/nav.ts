// 사이트 탐색 구조. 위쪽 메뉴의 세 영역(시작하기·예제·API)마다 사이드바가 따로 있다.
// 문서 id 는 src/content/docs 아래 경로(확장자 없음). 목록에 없는 문서는 사이드바에 나오지 않는다.

export type Section = 'docs' | 'examples' | 'api';

export const docsNav: { label: string; items: string[] }[] = [
  {
    label: '시작하기',
    items: ['guides/introduction', 'guides/quickstart', 'guides/auth'],
  },
  {
    label: '핵심 개념',
    items: [
      'guides/core-concepts',
      'guides/events',
      'guides/values',
      'guides/suspensed-use-navermaps',
      'guides/use-map',
    ],
  },
  {
    label: '가이드',
    items: [
      'guides/customize-overlays',
      'guides/map-types',
      'guides/addons',
      'guides/performance',
      'guides/nextjs',
    ],
  },
  {
    label: '버전 올리기',
    items: ['guides/migration-from-03', 'guides/migration-from-v1'],
  },
  { label: '참여하기', items: ['guides/contributing'] },
];

export const apiNav: { label: string; items: string[] }[] = [
  { label: '지도', items: ['navermaps-provider', 'container', 'naver-map'] },
  {
    label: '오버레이',
    items: [
      'marker',
      'info-window',
      'custom-overlay',
      'custom-control',
      'ground-overlay',
    ],
  },
  {
    label: '도형',
    items: ['circle', 'rectangle', 'ellipse', 'polygon', 'polyline'],
  },
  { label: '데이터 레이어', items: ['geo-json'] },
  {
    label: '지도 유형과 레이어',
    items: [
      'layer',
      'traffic-layer',
      'bicycle-layer',
      'cadastral-layer',
      'street-layer',
      'label-layer',
    ],
  },
  {
    label: '서브모듈',
    items: ['visualization', 'drawing', 'geocoder', 'panorama'],
  },
  {
    label: '훅',
    items: [
      'use-navermaps',
      'use-map',
      'use-listener',
      'use-kvo',
      'use-controlled-kvo',
      'use-overlay',
    ],
  },
].map((g) => ({ ...g, items: g.items.map((s) => `api-references/${s}`) }));

/** 공식 예제 분류. 네이버 공식 튜토리얼의 분류·순서와 같다. */
export const exampleCategories: { id: string; label: string }[] = [
  ['tutorial-map', '지도'],
  ['tutorial-control', '컨트롤'],
  ['tutorial-event', '이벤트'],
  ['tutorial-maptype', '지도 유형'],
  ['tutorial-layer', '레이어'],
  ['tutorial-marker', '마커'],
  ['tutorial-infowindow', '정보 창'],
  ['tutorial-shape', '도형'],
  ['tutorial-overlay', '사용자 정의 오버레이'],
  ['tutorial-data', '데이터 레이어'],
  ['tutorial-visualization', '시각화'],
  ['tutorial-drawing', '그리기'],
  ['tutorial-geocoder', '지오코딩'],
  ['tutorial-panorama', '거리뷰'],
  ['tutorial-gl', 'GL'],
].map(([id, label]) => ({ id, label }));

/** React 예제(우리가 따로 만든 예제)의 category 값. */
export const REACT_EXAMPLES = 'react-examples';

export function sectionOf(id: string): Section {
  if (id.startsWith('examples/')) return 'examples';
  if (id.startsWith('api-references/')) return 'api';
  return 'docs';
}

export const GITHUB = 'https://github.com/zeakd/react-naver-maps';
