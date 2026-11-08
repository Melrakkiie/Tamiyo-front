import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useEffect, type ReactNode } from 'react';

import { useTamiyoColorScheme } from './colorScheme';
import { cssVariablesResolver, palette, theme } from './theme';

export function TamiyoThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useTamiyoColorScheme();

  // The status bar follows Tamiyo's own scheme, not the phone's.
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', colorScheme === 'dark' ? palette.night : palette.paper);
  }, [colorScheme]);

  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} forceColorScheme={colorScheme}>
      <Notifications />
      {children}
    </MantineProvider>
  );
}
