import 'normalize.css';
import { css, Global } from '@emotion/react';
import { MDXProvider } from '@mdx-js/react';
import type { AppProps } from 'next/app';
import { ComponentPropsWithoutRef } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { NavermapsProvider } from 'react-naver-maps';
import { Prism } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { Layout } from '../components/layout';
import { useIsDarkMode } from '../hooks/useIsDarkMode';

function Code({ className, ...props }: ComponentPropsWithoutRef<'code'>) {
  const isDarkMode = useIsDarkMode();

  const match = /language-(\w+)/.exec(className || '');
  return match
    ? (
      <Prism
        language={match[1]} {...props} style={isDarkMode ? materialDark: materialLight}
        customStyle={{ fontSize: '0.8em' }}
      />
    )
    : <code className={className} {...props} />;
}

function Link({ href, ...props }: ComponentPropsWithoutRef<'a'>) {

  return (
    <span css={{ verticalAlign: 'baseline' }}>
      <a {...props} css={{ textDecoration: 'underline' }} />
      {/https?:\/\//.test(href || '') && <FiExternalLink css={{ verticalAlign: 'top' }} />}
    </span>
  );
}

const mdxComponents = { code: Code, a: Link };

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Global styles={css({
        'a:hover': {
          color: 'inherit',
          textDecoration: 'underline',
        },
        'a:active': {
          color: 'inherit',
          textDecoration: 'underline',
        },
        'a:visited': { color: 'inherit' },
      })}/>
      <NavermapsProvider ncpClientId='6tdrlcyvpt'>
        <MDXProvider components={mdxComponents}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </MDXProvider>
      </NavermapsProvider>
    </>
  );
}

export default App;
