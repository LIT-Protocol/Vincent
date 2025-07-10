import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router';
import routes from './routes';

import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

Sentry.init({
  dsn: 'https://e2a7f8b83a3eb071263ddf054cb33e91@o4509482456842240.ingest.us.sentry.io/4509638895075328',
  sendDefaultPii: true,
});

function App() {
  return useRoutes(routes);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
