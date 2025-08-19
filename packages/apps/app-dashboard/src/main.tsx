import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import routes from './routes';
import { initializeTheme } from '@/lib/theme';

import './index.css';

// Initialize theme before React renders
initializeTheme();

Sentry.init({
  dsn: 'https://e2a7f8b83a3eb071263ddf054cb33e91@o4509482456842240.ingest.us.sentry.io/4509638895075328',
  sendDefaultPii: true,
});

function App() {
  return useRoutes(routes);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
