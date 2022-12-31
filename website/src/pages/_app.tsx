import 'normalize.css';
import { MDXProvider } from '@mdx-js/react';
import type { AppProps } from 'next/app';
import { ComponentPropsWithoutRef } from 'react';
import { NaverMapsProvider } from 'react-naver-maps';
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

const mdxComponents = { code: Code };

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <NaverMapsProvider ncpClientId='6tdrlcyvpt'>
        <MDXProvider components={mdxComponents}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </MDXProvider>
      </NaverMapsProvider>
    </>
  );
}

export default App;
