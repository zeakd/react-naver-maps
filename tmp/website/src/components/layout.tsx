import { css } from '@emotion/react';
import * as NavMenu from '@radix-ui/react-navigation-menu';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { FiChevronDown } from 'react-icons/fi';

import { menu } from '../menu';

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
          css={{
            width: 260,
            minWidth: 0,
          }}
        >
          <Sidebar />
        </div>
        <div
          css={{
            flex: 1,
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

const navItemCss = css({
  background: 'transparent',
  border: 'none',
  padding: '8px 12px',
  outline: 'none',
  userSelect: 'none',
  fontWeight: '500',
  lineHeight: 1,
  borderRadius: '4px',
  fontSize: '15px',

  display: 'flex',
  alignItems: 'center',
  ':hover': { backgroundColor: '#fafafa' },
  // color: var(--violet11);
});

function Header() {
  return (
    <header
      css={css({
        color: 'black',
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
        <div
          // css={{ minWidth: 0 }}
        >
          <Link href='/'><a
            css={css({
              fontWeight: 700,
              fontFamily: 'sans-serif',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
            })}
          >
            <svg width="29.5" height="34" viewBox="0 0 158 182" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M105.423 15.2554L79 0L12.2551 38.5352L49.3537 146.046L111.099 97.2991L105.423 15.2554ZM111.433 102.131L50.7358 150.051L57.4715 169.571L79 182L115.501 160.926L111.433 102.131ZM46.0282 148.671L8.72658 40.5724L0.19165 45.5V136.5L35.5712 156.926L46.0282 148.671ZM39.2998 159.079L47.4103 152.676L52.1873 166.52L39.2998 159.079ZM115.235 99.1299L157.808 65.5197V136.5L119.357 158.7L115.235 99.1299ZM157.808 60.4234L114.901 94.2976L109.6 17.6667L157.808 45.5V60.4234Z" fill="url(#paint0_linear_5_8)"/>
              <defs>
                <linearGradient id="paint0_linear_5_8" x1="0.500004" y1="46" x2="79" y2="182" gradientUnits="userSpaceOnUse">
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
        <nav
          // css={{ flex: 1 }}
        >
          <NavMenu.Root
            css={{
              position: 'relative',
              // display: 'flex',
              // justifyContent: 'center',
              // width: '100vw',
              zIndex: 100,
            }}
          >
            <NavMenu.List css={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '4px',
              borderRadius: '6px',
              listStyle: 'none',
              boxShadow: '0 2px 10px var(--blackA7)',
              margin: 0,
            }}>
              <NavMenu.Item>
                <NavMenu.Trigger
                  css={navItemCss}
                >
                  <span>v0.1</span>
                  <FiChevronDown css={{ marginLeft: 5 }}/>
                </NavMenu.Trigger>
                <NavMenu.Content
                  css={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    // animationDuration: '250ms',
                    // animationTimingFunction: 'ease',
                    padding: '5px 20px',
                  }}
                >
                  <p>
                    <NavMenu.Link href='https://zeakd.github.io/react-naver-maps/0.0.13/'>v0.0.13</NavMenu.Link>
                  </p>
                </NavMenu.Content>
              </NavMenu.Item>
              <NavMenu.Item>
                <NavMenu.Link css={navItemCss} href="https://github.com/zeakd/react-naver-maps">
                  Github
                </NavMenu.Link>
              </NavMenu.Item>
              <div css={{
                position: 'absolute',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                top: '100%',
                left: '0',
                perspective: '2000px',
              }}>
                <NavMenu.Viewport
                  css={{
                    position: 'relative',
                    transformOrigin: 'top center',
                    marginTop: '10px',
                    width: '100%',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
                    height: 'var(--radix-navigation-menu-viewport-height)',
                  }}
                />
              </div>
            </NavMenu.List>
          </NavMenu.Root>
        </nav>
      </div>
    </header>
  );
}


function Sidebar() {
  return (
    <div
      css={{
        position: 'fixed',
        top: 0,
        padding: '0 24px',
        boxSizing: 'border-box',
        height: '100%',
        width: 260,
        overflowY: 'scroll',
      }}
    >
      <div
        css={{ height: 100 }}
      >

      </div>
      <div css={{
        position: 'relative',
        paddingRight : 24, fontSize: 16,
      }}>
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
      css={css({
        width: '100%',
        paddingBottom: 160,
      })}
    >
      {props.children}
    </div>
  );
}
