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

export function UserAvatar({ size = 32 }: { size?: number }) {
  const account = useAccount();
  const art = useAvatarArt(account.data?.avatar_scryfall_id);
  const name = account.data?.display_name || account.data?.email || '';

  return (
    <Avatar src={art?.url} alt={name} size={size} radius="xl" color="blue">
      {initials(name)}
    </Avatar>
  );
}
