import { Avatar } from '@mantine/core';

import { useCardArts } from '../scryfall/hooks';
import { useAccount } from './account';

function initials(name: string) {
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => [...part][0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export function useAvatarArt(scryfallId: string | null | undefined) {
  const arts = useCardArts([scryfallId]);
  return scryfallId ? (arts.data?.[scryfallId] ?? null) : null;
}

interface ProfileAvatarProps {
  scryfallId: string | null | undefined;
  name: string;
  size?: number;
}

export function ProfileAvatar({ scryfallId, name, size = 32 }: ProfileAvatarProps) {
  const art = useAvatarArt(scryfallId);
  return (
    <Avatar src={art?.url} alt={name} size={size} radius="xl" color="blue">
      {initials(name)}
    </Avatar>
  );
}

export function UserAvatar({ size = 32 }: { size?: number }) {
  const account = useAccount();
  return (
    <ProfileAvatar
      scryfallId={account.data?.avatar_scryfall_id}
      name={account.data?.display_name || account.data?.email || ''}
      size={size}
    />
  );
}
