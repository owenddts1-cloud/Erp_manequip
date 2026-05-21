import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Optimized Tailwind Import
import App from './App';
import { PreferencesProvider } from './contexts/PreferencesContext';
import './style.css';
import { Analytics } from '@vercel/analytics/react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PreferencesProvider>
      <App />
      <Analytics />
    </PreferencesProvider>
  </React.StrictMode>
);