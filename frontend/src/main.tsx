// Import global polyfill first
import './polyfills/global';

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

import RootApp from './RootApp';
import './style/index.css'; // Make sure to import global styles

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
