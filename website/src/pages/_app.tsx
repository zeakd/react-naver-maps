import 'normalize.css';
import type { AppProps } from 'next/app';
import { NaverMapsProvider } from 'react-naver-maps';
import { Layout } from '../components/layout';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NaverMapsProvider ncpClientId='6tdrlcyvpt'>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </NaverMapsProvider>
  );
}

export default MyApp;
