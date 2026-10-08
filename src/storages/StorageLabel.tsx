import { Group, Text } from '@mantine/core';

export function StorageIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z" />
      <path d="M19 16h-12a2 2 0 0 0 -2 2" />
      <path d="M9 8h6" />
    </svg>
  );
}

interface StorageLabelProps {
  name: string | null;
  unknown?: boolean;
}

export function StorageLabel({ name, unknown = false }: StorageLabelProps) {
  const missing = name === null;
  return (
    <Group gap={4} wrap="nowrap" c="dimmed" style={{ minWidth: 0 }}>
      <StorageIcon />
      <Text size="xs" c="dimmed" fs={missing ? 'italic' : undefined} lineClamp={1}>
        {name ?? (unknown ? 'Rangement inconnu' : 'Sans rangement')}
      </Text>
    </Group>
  );
}
