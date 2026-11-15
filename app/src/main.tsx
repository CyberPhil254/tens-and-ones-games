import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Fonts ship with the app: no request to a font service from a child's device, and they work offline.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import './ui/tokens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
