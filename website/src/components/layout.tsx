import { css } from '@emotion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  children?: ReactNode;
};

export function Layout(props: Props) {
  return (
    <div>
      <Header></Header>
      <div
        css={{
          display: 'flex',
          overflow: 'auto',
          marginTop: 60,
          maxWidth: 1080,
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
        top: 0,
        left: 0,
        height: 60,
      })}
    >
      <div
        css={css({
          maxWidth: 1080,
          marginLeft: 'auto',
          marginRight: 'auto',
        })}
      >
        <div>
          <Link href='/'><a>React Naver Maps</a></Link>
        </div>
        {props.children}
      </div>
    </header>
  );
}

const menu = [
  {
    name: 'Introduction',
    href: '/',
  },
  {
    name: 'map-simple',
    href: '/examples/tutorial-1-map-simple',
  },
  {
    name: 'map-options',
    href: '/examples/tutorial-2-map-options',
  },
  {
    name: 'map-types',
    href: '/examples/tutorial-3-map-types',
  },
  {
    name: 'map-bounds',
    href: '/examples/tutorial-4-map-bounds',
  },
];

function Sidebar() {
  return (
    <div>
      <div
        css={{ height: 100 }}
      >

      </div>
      <div>
        {menu.map(({ name, href }) => {
          return (
            <div
              key={name}
            >
              <Link
                href={href}
              >
                <a>{name}</a>
              </Link>
            </div>
          );
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
