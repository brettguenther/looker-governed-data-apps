import { Buffer } from 'buffer';

// Polyfill Buffer in browser environment for @looker/sdk-rtl error formatting
if (typeof window !== 'undefined') {
  (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
