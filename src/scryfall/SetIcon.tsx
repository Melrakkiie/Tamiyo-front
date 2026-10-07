import { Box } from '@mantine/core';

import { useSetIcons } from './hooks';

export function SetIcon({ setCode, size = 14 }: { setCode: string; size?: number }) {
  const icons = useSetIcons();
  const url = icons.data?.[setCode.toLowerCase()];
  if (!url) {
    return null;
  }
  return (
    <Box
      component="span"
      aria-hidden
      w={size}
      h={size}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        backgroundColor: 'currentColor',
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  );
}
