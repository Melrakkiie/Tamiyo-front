import { Box } from '@mantine/core';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

export const MoonLoader = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<'span'>>(
  ({ className, ...others }, ref) => (
    <Box component="span" className={['tamiyo-moon-loader', className].filter(Boolean).join(' ')} {...others} ref={ref}>
      <span className="tamiyo-moon-shadow" />
    </Box>
  ),
);

MoonLoader.displayName = 'MoonLoader';
