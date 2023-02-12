import { css } from '@emotion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
};

export function Layout(props: Props) {
  return (
    <div>
      <div
        css={{
          position: 'relative',
          zIndex: 0,
          display: 'flex',
          overflow: 'auto',
          marginTop: 60,
          boxSizing: 'border-box',
          padding: '0 24px',
          maxWidth: 1440,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          css={{ width: 280 }}
        >
          <Sidebar />
        </div>
        <div
          css={{
            width: '100%',
            minWidth: 0,
          }}
        >
          <Main>
            {props.children}
          </Main>
        </div>
      </div>
      <Header></Header>
    </div>
  );
}

type HeaderProps = {
  children?: ReactNode;
};

function Header(props: HeaderProps) {
  return (
    <header
      css={css({
        width: '100%',
        position: 'fixed',
        zIndex: 0,
        top: 0,
        left: 0,
        height: 60,
        background: 'white',
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
      })}
    >
      <div
        css={css({
          boxSizing: 'border-box',
          padding: '0 24px',
          maxWidth: 1440,
          height: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        })}
      >
        <div>
          <Link href='/'><a
            css={css({
              fontWeight: 700,
              fontFamily: 'sans-serif',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
            })}
          >
            <svg
              width="35.86" height="34" viewBox="0 0 192 182" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M91 0L169.808 45.5V136.5L91 182L12.1917 136.5V45.5L91 0Z" fill="url(#paint0_linear_2_85)"/>
              <line x1="130.005" y1="168.138" x2="119.005" y2="9.13804" stroke="white" strokeWidth="4"/>
              <line x1="69.1094" y1="174.652" x2="20.1094" y2="32.6524" stroke="white" strokeWidth="4"/>
              <line x1="38.7607" y1="166.43" x2="190.761" y2="46.4302" stroke="white" strokeWidth="4"/>
              <defs>
                <linearGradient id="paint0_linear_2_85" x1="12.5" y1="46" x2="91" y2="182" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#66DE6F"/>
                  <stop offset="1" stopColor="#66DEDE"/>
                </linearGradient>
              </defs>
            </svg>
            <div css={{ paddingTop: 4 }}>
              <span
                css={{ marginLeft: 7, verticalAlign: 'text-bottom' }}
              >
            React Naver Maps
              </span>
            </div>
          </a></Link>
        </div>
        <nav>
          {props.children}
        </nav>
      </div>
    </header>
  );
}

const menu = [
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
        name: 'loadNavermapsScript',
        href: '/api-references/load-navermaps-script',
      },
    ],
  },
] as const;

function Sidebar() {
  return (
    <div>
      <div
        css={{ height: 100 }}
      >

      </div>
      <div css={{ paddingRight : 24, fontSize: 16 }}>
        {menu.map((item, idx) => {
          if (item.type === 'category') {
            return (
              <div key={idx}>
                <div css={{ padding: '24px 0 8px' }}>
                  <span css={{ fontSize: '1.0em', fontWeight: 700 }}>
                    {item.name}
                  </span>
                </div>
                <div css={{
                  boxSizing: 'border-box',
                  paddingLeft: 10,
                }}>
                  {item.contents.map(({ name, href }) => {
                    return (
                      <div
                        key={name}
                        css={{ marginBottom: '0.2em' }}
                      >
                        <Link
                          href={href}
                        >
                          <a css={{
                            textDecoration: '',
                            cursor: 'pointer',
                            fontSize: '1.0em',
                            whiteSpace: 'pre-wrap',
                          }}>{name}</a>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>)
            ;
          }

          return;
        })}
      </div>
    </div>
  );
}

type MainProps = {
  children?: ReactNode;
};

function Main(props: MainProps) {
  return (
    <div
      css={css({ width: '100%' })}
    >
      {props.children}
    </div>
  );
}
