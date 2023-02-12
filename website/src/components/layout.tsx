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

type HeaderProps = {
  children?: ReactNode;
};

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

function Header(props: HeaderProps) {
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
                    <NavMenu.Link href='https://zeakd.github.io/react-naver-maps'>v0.0.13</NavMenu.Link>
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
