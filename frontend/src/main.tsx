// Import global polyfill first
import './polyfills/global';

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

import RootApp from './RootApp';
import './style/index.css'; // Make sure to import global styles

const root = createRoot(document.getElementById('root') as HTMLElement);
const app = <RootApp />;
// StrictMode intentionally double-invokes lifecycle hooks in dev to surface
// side effects — keep it in dev only to avoid the overhead in production.
root.render(import.meta.env.DEV ? <StrictMode>{app}</StrictMode> : app);
