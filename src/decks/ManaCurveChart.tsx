import { Box, Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';

import type { ManaCurveBucket } from '../api/types';

const PERMANENT_COLOR = 'var(--mantine-primary-color-filled)';
const NON_PERMANENT_COLOR = 'var(--mantine-color-gray-7)';
const CURVE_HEIGHT = 140;

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

export function describeBucket(bucket: ManaCurveBucket) {
  return `${plural(bucket.count, 'carte')} à ${bucket.mana_value} : ${plural(bucket.permanents, 'permanent')}, ${plural(bucket.non_permanents, 'non-permanent')}`;
}

export function fullCurve(curve: ManaCurveBucket[]): ManaCurveBucket[] {
  const byValue = new Map(curve.map((bucket) => [bucket.mana_value, bucket]));
  const max = Math.max(0, ...curve.map((bucket) => bucket.mana_value));
  return Array.from(
    { length: max + 1 },
    (_, mv) => byValue.get(mv) ?? { mana_value: mv, count: 0, permanents: 0, non_permanents: 0, cards: [] },
  );
}

export function CurveLegend() {
  return (
    <Group gap="md">
      {[
        { label: 'Permanents', color: PERMANENT_COLOR },
        { label: 'Non-permanents', color: NON_PERMANENT_COLOR },
      ].map((entry) => (
        <Group key={entry.label} gap={6}>
          <Box w={10} h={10} style={{ background: entry.color, borderRadius: 2 }} />
          <Text size="xs" c="dimmed">
            {entry.label}
          </Text>
        </Group>
      ))}
    </Group>
  );
}

interface ManaCurveChartProps {
  buckets: ManaCurveBucket[];
  selected: number | null;
  onSelect: (manaValue: number | null) => void;
}

export function ManaCurveChart({ buckets, selected, onSelect }: ManaCurveChartProps) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <Group gap={8} align="flex-end" wrap="nowrap" aria-label="Courbe de mana" style={{ overflowX: 'auto' }}>
      {buckets.map((bucket) => {
        const isSelected = selected === bucket.mana_value;
        const dimmed = selected !== null && !isSelected;
        return (
          <Tooltip key={bucket.mana_value} label={describeBucket(bucket)} withArrow>
            <UnstyledButton
              onClick={() => onSelect(isSelected ? null : bucket.mana_value)}
              disabled={bucket.count === 0}
              aria-pressed={isSelected}
              aria-label={describeBucket(bucket)}
              style={{ flex: '1 0 28px', maxWidth: 56, opacity: dimmed ? 0.4 : 1, transition: 'opacity 120ms' }}
            >
              <Stack gap={4} align="center">
                <Text size="xs" c="dimmed">
                  {bucket.count}
                </Text>
                <Stack
                  gap={0}
                  w="100%"
                  h={Math.max(bucket.count > 0 ? 2 : 0, (bucket.count / max) * CURVE_HEIGHT)}
                  style={{ borderRadius: '4px 4px 0 0', overflow: 'hidden' }}
                >
                  <Box style={{ flex: bucket.non_permanents, background: NON_PERMANENT_COLOR }} />
                  <Box style={{ flex: bucket.permanents, background: PERMANENT_COLOR }} />
                </Stack>
                <Text size="xs" fw={isSelected ? 700 : 500} td={isSelected ? 'underline' : undefined}>
                  {bucket.mana_value}
                </Text>
              </Stack>
            </UnstyledButton>
          </Tooltip>
        );
      })}
    </Group>
  );
}
