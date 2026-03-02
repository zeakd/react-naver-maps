import { createRoot } from 'react-dom/client';
import {
  NavermapsProvider,
  Container,
  NaverMap,
  Marker,
} from '../src/react-naver-maps.js';

function App() {
  return (
    <NavermapsProvider ncpKeyId="6tdrlcyvpt">
      <Container style={{ width: '100vw', height: '100vh' }}>
        <NaverMap
          defaultCenter={{ lat: 37.5666, lng: 126.9784 }}
          defaultZoom={16}
        >
          <Marker position={{ lat: 37.5666, lng: 126.9784 }} />
        </NaverMap>
      </Container>
    </NavermapsProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
