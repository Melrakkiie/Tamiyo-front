import { ActionIcon } from '@mantine/core';

export function StarIcon({ filled = false, size = 16 }: { filled?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
    </svg>
  );
}

interface FavoriteToggleProps {
  favorite: boolean;
  onToggle: () => void;
  onImage?: boolean;
}

export function FavoriteToggle({ favorite, onToggle, onImage = false }: FavoriteToggleProps) {
  const label = favorite ? 'Retirer des favoris' : 'Ajouter aux favoris';
  return (
    <ActionIcon
      variant="subtle"
      size="sm"
      color={favorite ? 'yellow' : onImage ? 'white' : 'gray'}
      aria-label={label}
      aria-pressed={favorite}
      title={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      style={{ flexShrink: 0 }}
    >
      <StarIcon filled={favorite} />
    </ActionIcon>
  );
}
