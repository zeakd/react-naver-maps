import 'normalize.css';
import type { AppProps } from 'next/app';
import { NaverMapsProvider } from 'react-naver-maps';
import { Layout } from '../components/layout';
import { MDXProvider } from '@mdx-js/react';
import { Prism } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ComponentPropsWithoutRef } from 'react';

function code({ className, ...props }: ComponentPropsWithoutRef<'code'>) {
  const match = /language-(\w+)/.exec(className || '');
  return match
    ? <Prism language={match[1]} PreTag="div" {...props} style={dracula} />
    : <code className={className} {...props} />;
}


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NaverMapsProvider ncpClientId='6tdrlcyvpt'>
      <MDXProvider components={{ code }}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </MDXProvider>
    </NaverMapsProvider>
  );
}

export default MyApp;
