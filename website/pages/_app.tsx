import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { NaverMapsProvider } from 'react-naver-maps';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NaverMapsProvider ncpClientId='6tdrlcyvpt'>
      <Component {...pageProps} />
    </NaverMapsProvider>
  );
}

export default MyApp;
