import { Box, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

const BAR_COLOR = 'var(--mantine-primary-color-filled)';

export interface BarDatum {
  key: string;
  label: ReactNode;
  value: number;
  color?: string;
}

interface BarListProps {
  data: BarDatum[];
  ariaLabel: string;
  labelWidth?: number;
}

export function BarList({ data, ariaLabel, labelWidth = 110 }: BarListProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Stack gap={6} role="list" aria-label={ariaLabel}>
      {data.map((d) => (
        <Group key={d.key} gap="sm" wrap="nowrap" role="listitem">
          <Text size="sm" w={labelWidth} style={{ flexShrink: 0 }}>
            {d.label}
          </Text>
          <Box style={{ flex: 1 }}>
            <Box
              h={10}
              w={`${(d.value / max) * 100}%`}
              miw={d.value > 0 ? 2 : 0}
              style={{
                background: d.color ?? BAR_COLOR,
                borderRadius: '0 4px 4px 0',
                boxShadow: d.color ? 'inset 0 0 0 1px var(--mantine-color-default-border)' : undefined,
              }}
            />
          </Box>
          <Text size="sm" c="dimmed" w={32} ta="right" style={{ flexShrink: 0 }}>
            {d.value}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}
