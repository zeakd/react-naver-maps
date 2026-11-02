import { NavermapsProvider } from 'react-naver-maps';

// 서버 컴포넌트에서 직접 import 한다. 'use client' 가 빠지면 빌드가 실패한다.
export default function Page() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">server import</NavermapsProvider>
  );
}
