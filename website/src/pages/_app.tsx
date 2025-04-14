import 'normalize.css';
import { css, Global } from '@emotion/react';
import { MDXProvider } from '@mdx-js/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { ComponentPropsWithoutRef, useEffect } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { NavermapsProvider } from 'react-naver-maps';
import { Prism } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { Layout } from '../components/layout';
import * as gtag from '../lib/gtag';

const WEBSITE_BASE_PATH = process.env.NEXT_PUBLIC_WEBSITE_BASE_PATH || '';

// import { useIsDarkMode } from '../hooks/useIsDarkMode';

function Code({ className, ...props }: ComponentPropsWithoutRef<'code'>) {
  // const isDarkMode = useIsDarkMode();

  const match = /language-(\w+)/.exec(className || '');
  return match
    ? (
      <Prism
        language={match[1]} {...props} style={materialLight}
        customStyle={{ fontSize: '0.8em' }}
      />
    )
    : (
      <span
        css={{
          background: '#fafafa',
          fontSize: '1.0em',
          color: 'rgb(97, 130, 184)',
          verticalAlign: 'baseline',
          padding: '0 0.2em',
        }}
      >
        <code className={className} {...props}
          css={{ fontSize: '0.8em', verticalAlign: 'baseline' }}
        />
      </span>
    );
}

function Anchor({ href, ...restProps }: ComponentPropsWithoutRef<'a'>) {
  const isExternal = /https?:\/\//.test(href || '');

  if (isExternal) {
    return (
      <span css={{ verticalAlign: 'baseline' }}>
        <a href={href} {...restProps} css={{
          textDecoration: 'underline',
          color: 'black',
          ':hover': { color: 'rgb(102, 222, 111)' },
        }} target='_blank' rel='noreferrer'/>
        <FiExternalLink css={{ verticalAlign: 'top' }} />
      </span>
    );
  }

  return (
    <span css={{ verticalAlign: 'baseline' }}>
      <Link href={href || ''}>
        <a {...restProps} css={{
          textDecoration: 'underline',
          color: 'black',
          ':hover': { color: 'rgb(102, 222, 111)' },
        }} />
      </Link>
    </span>
  );
}

function UL(props: ComponentPropsWithoutRef<'ul'>) {
  return (
    <ul {...props} css={{ padding: '0 15px' }} />
  );
}

const mdxComponents = { code: Code, a: Anchor, ul: UL };

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${WEBSITE_BASE_PATH}/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${WEBSITE_BASE_PATH}/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${WEBSITE_BASE_PATH}/favicon-16x16.png`} />
        <link rel="manifest" href={`${WEBSITE_BASE_PATH}/site.webmanifest`} />
        <link rel="mask-icon" href={`${WEBSITE_BASE_PATH}/safari-pinned-tab.svg`} color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />

        <title>React Naver Maps</title>
      </Head>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtag.GA_TRACKING_ID}', {
            cookie_flags: 'SameSite=None;Secure',
            cookie_domain: 'zeakd.github.io'
          });
        `}
      </Script>
      <Global styles={css({
        html: { fontFamily: '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif' },
        a: {
          color: 'black',
          cursor: 'pointer',
        },
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
      <NavermapsProvider ncpKeyId='6tdrlcyvpt'>
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
