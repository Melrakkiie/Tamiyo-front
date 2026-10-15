import { Box } from '@mantine/core';
import { Outlet } from 'react-router';

import { FanContentNotice } from './FanContentNotice';

export function PageWithFooter() {
  return (
    <>
      <Box mih="calc(100dvh - var(--app-shell-header-offset, 0rem))">
        <Outlet />
      </Box>
      <FanContentNotice />
    </>
  );
}
