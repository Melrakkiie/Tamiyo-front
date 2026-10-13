import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';

import { useTamiyoColorScheme } from './colorScheme';
import { cssVariablesResolver, theme } from './theme';

export function TamiyoThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useTamiyoColorScheme();

  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme={colorScheme}>
      <Notifications />
      {children}
    </MantineProvider>
  );
}
