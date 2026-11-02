import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MapCheck } from './map-check';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapCheck />
  </StrictMode>,
);
