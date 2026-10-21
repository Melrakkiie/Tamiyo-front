import { Group, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

export function Crescent({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path
        d="M10 1 a7 7 0 1 0 5 12 a5.5 5.5 0 0 1 -5 -12 z"
        fill="var(--mantine-color-lune-3)"
        stroke="var(--mantine-color-lune-7)"
        strokeWidth={1}
      />
    </svg>
  );
}

interface SectionTitleProps {
  children: ReactNode;
  count?: ReactNode;
}

export function SectionTitle({ children, count }: SectionTitleProps) {
  return (
    <Group gap={8} wrap="nowrap" align="center">
      <Title order={4} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Title>
      {count !== undefined && (
        <Text span className="tamiyo-hand" c="dimmed" size="lg" style={{ flexShrink: 0 }}>
          {count}
        </Text>
      )}
      <span className="tamiyo-flight" />
      <Crescent />
    </Group>
  );
}
