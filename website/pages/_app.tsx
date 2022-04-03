import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useNavermaps } from 'react-naver-maps';

useNavermaps.config({ ncpClientId: '6tdrlcyvpt' });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Component {...pageProps} />
  );
}

export default MyApp;
