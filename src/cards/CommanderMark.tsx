import { ThemeIcon } from '@mantine/core';

export function CrownIcon({ size = 14 }: { size?: number }) {
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
      <path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4z" />
    </svg>
  );
}

export function CommanderBadge() {
  return (
    <ThemeIcon
      size="md"
      radius="xl"
      variant="default"
      title="Commandant"
      aria-label="Commandant"
      style={{ boxShadow: 'var(--mantine-shadow-sm)' }}
    >
      <CrownIcon size={14} />
    </ThemeIcon>
  );
}

export function CommanderInlineMark() {
  return (
    <ThemeIcon
      size="sm"
      radius="xl"
      variant="default"
      title="Commandant"
      aria-label="Commandant"
      style={{ flexShrink: 0 }}
    >
      <CrownIcon size={12} />
    </ThemeIcon>
  );
}
