import { Badge } from '@mantine/core';

export type PendingStatus =
  | { kind: 'missing' }
  | { kind: 'other-printing'; owned: number }
  | { kind: 'owned'; owned: number };

const paths: Record<PendingStatus['kind'], string> = {
  missing: 'M12 5v14M5 12h14',
  'other-printing': 'M7 7h11l-3-3M17 17H6l3 3',
  owned: 'M5 12l5 5 9-10',
};

const labels: Record<PendingStatus['kind'], string> = {
  missing: 'Manquante',
  'other-printing': 'Autre édition',
  owned: 'Dans ta collection',
};

const colors: Record<PendingStatus['kind'], string> = {
  missing: 'orange',
  'other-printing': 'teal',
  owned: 'teal',
};

function copies(count: number) {
  return `${count} exemplaire${count > 1 ? 's' : ''}`;
}

export function pendingStatusDescription(status: PendingStatus) {
  switch (status.kind) {
    case 'missing':
      return 'Pas dans ta collection, dans aucune édition';
    case 'other-printing':
      return `Tu en as ${copies(status.owned)} dans une autre édition, hors de ce deck`;
    case 'owned':
      return `Tu as ${copies(status.owned)} de cette édition, hors de ce deck`;
  }
}

function StatusIcon({ status }: { status: PendingStatus }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d={paths[status.kind]} />
    </svg>
  );
}

interface PendingBadgeProps {
  status: PendingStatus;
  compact?: boolean;
  size?: 'xs' | 'sm';
}

export function PendingBadge({ status, compact = false, size = 'sm' }: PendingBadgeProps) {
  const description = pendingStatusDescription(status);
  return (
    <Badge
      size={size}
      variant="filled"
      color={colors[status.kind]}
      leftSection={<StatusIcon status={status} />}
      title={description}
      aria-label={description}
      style={{ textTransform: 'none', boxShadow: 'var(--mantine-shadow-sm)', flexShrink: 0 }}
      px={compact ? 4 : undefined}
    >
      {compact ? null : labels[status.kind]}
    </Badge>
  );
}
