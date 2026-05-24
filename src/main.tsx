import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import { App } from './ui/App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // StrictMode is disabled for now to avoid noisy warnings from third-party libs like react-quill.
  // Re-enable it once the editor dependency updates or we swap editors.
  <App />,
);
