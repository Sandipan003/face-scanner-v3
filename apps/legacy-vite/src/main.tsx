import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept all API calls to route them to the VITE_BACKEND_URL if it exists
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl && typeof input === 'string' && input.startsWith('/api')) {
    input = backendUrl + input;
    
    // Auto-inject Localtunnel bypass headers so API calls don't get blocked by the warning screen
    init = init || {};
    init.headers = {
      ...init.headers,
      'Bypass-Tunnel-Reminder': 'true'
    };
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
