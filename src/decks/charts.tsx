import { Box, Group, Stack, Text, Tooltip } from '@mantine/core';

const BAR_COLOR = 'var(--mantine-primary-color-filled)';
const CURVE_HEIGHT = 140;

export interface BarDatum {
  label: string;
  value: number;
}

export function ColumnChart({ data, ariaLabel, describe }: { data: BarDatum[]; ariaLabel: string; describe: (d: BarDatum) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Group gap={8} align="flex-end" wrap="nowrap" role="list" aria-label={ariaLabel} style={{ overflowX: 'auto' }}>
      {data.map((d) => (
        <Tooltip key={d.label} label={describe(d)} withArrow>
          <Stack
            gap={4}
            align="center"
            role="listitem"
            aria-label={describe(d)}
            style={{ flex: '1 0 28px', maxWidth: 56 }}
          >
            <Text size="xs" c="dimmed">
              {d.value}
            </Text>
            <Box
              w="100%"
              h={Math.max(d.value > 0 ? 2 : 0, (d.value / max) * CURVE_HEIGHT)}
              style={{ background: BAR_COLOR, borderRadius: '4px 4px 0 0' }}
            />
            <Text size="xs" fw={500}>
              {d.label}
            </Text>
          </Stack>
        </Tooltip>
      ))}
    </Group>
  );
}

export function BarList({ data, ariaLabel }: { data: BarDatum[]; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Stack gap={6} role="list" aria-label={ariaLabel}>
      {data.map((d) => (
        <Group key={d.label} gap="sm" wrap="nowrap" role="listitem">
          <Text size="sm" w={110} style={{ flexShrink: 0 }}>
            {d.label}
          </Text>
          <Box style={{ flex: 1 }}>
            <Box
              h={10}
              w={`${(d.value / max) * 100}%`}
              miw={d.value > 0 ? 2 : 0}
              style={{ background: BAR_COLOR, borderRadius: '0 4px 4px 0' }}
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
