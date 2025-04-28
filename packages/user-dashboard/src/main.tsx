import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
// @ts-expect-error vite-plugin-pages creates routes with this import
import routes from '~react-pages';
import "@rainbow-me/rainbowkit/styles.css";

import './index.css';

// eslint-disable-next-line react-refresh/only-export-components
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
