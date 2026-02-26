import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, defaultTheme } from '@adobe/react-spectrum';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider theme={defaultTheme}>
    <App />
  </Provider>,
);
