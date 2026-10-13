import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './theme/tamiyo.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';

import { restoreSession } from './auth/session';
import { queryClient } from './queryClient';
import { router } from './router';
import { TamiyoThemeProvider } from './theme/TamiyoThemeProvider';

void restoreSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TamiyoThemeProvider>
        <RouterProvider router={router} />
      </TamiyoThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
