
export const menu = [
  {
    type: 'category',
    name: 'Guides',
    contents: [
      {
        name: 'Introduction',
        href: '/',
      },
      {
        name: 'Quickstart',
        href: '/guides/quickstart',
      },
      {
        name: 'Core concepts',
        href: '/guides/core-concepts',
      },
      {
        name: 'Customize overlays',
        href: '/guides/customize-overlays',
      },
      {
        name: 'Suspensed useNavermaps',
        href: '/guides/suspensed-use-navermaps',
      },
      {
        name: 'Migration guide from v0.0',
        href: '/guides/migration-guide-from-0.0',
      },
    ],
  },
  {
    type: 'category',
    name: 'Examples',
    contents: [
      {
        name: '지도 기본 예제',
        href: '/examples/map-tutorial-1-simple',
      },
      {
        name: '지도 옵션 조정하기',
        href: '/examples/map-tutorial-2-options',
      },
      {
        name: '지도 유형 설정하기',
        href: '/examples/map-tutorial-3-types',
      },
      {
        name: '지도 좌표 경계 확인하기',
        href: '/examples/map-tutorial-4-bounds',
      },
      {
        name: '지도 이동하기',
        href: '/examples/map-tutorial-5-moves',
      },
      {
        name: 'HTML5 Geolocation API \n활용하기',
        href: '/examples/map-tutorial-6-geolocation',
      },
      {
        name: '마커 표시하기',
        href: '/examples/marker-tutorial-1-simple',
      },
      {
        name: '마커 클러스터화하기',
        href: '/examples/marker-cluster-tutorial',
      },
      {
        name: '사용자 정의 컨트롤 만들기',
        href: '/examples/control-tutorial-4-custom-p1',
      },
    ],
  },
  {
    type: 'category',
    name: 'API Reference',
    contents: [
      {
        name: 'NavermapsProvider',
        href: '/api-references/navermaps-provider',
      },
      {
        name: 'NaverMap',
        href: '/api-references/naver-map',
      },
      {
        name: 'Container',
        href: '/api-references/container',
      },
      {
        name: 'Circle',
        href: '/api-references/circle',
      },
      {
        name: 'Ellipse',
        href: '/api-references/ellipse',
      },
      {
        name: 'GroundOverlay',
        href: '/api-references/ground-overlay',
      },
      {
        name: 'InfoWindow',
        href: '/api-references/info-window',
      },
      {
        name: 'Marker',
        href: '/api-references/marker',
      },
      {
        name: 'Polygon',
        href: '/api-references/polygon',
      },
      {
        name: 'Polyline',
        href: '/api-references/polyline',
      },
      {
        name: 'Rectangle',
        href: '/api-references/rectangle',
      },
      {
        name: 'useNavermaps',
        href: '/api-references/use-navermaps',
      },
      {
        name: 'useListener',
        href: '/api-references/use-listener',
      },
      {
        name: 'Listener',
        href: '/api-references/listener',
      },
      {
        name: 'useMap',
        href: '/api-references/use-map',
      },
      {
        name: 'loadNavermapsScript',
        href: '/api-references/load-navermaps-script',
      },
    ],
  },
] as const;
