import { Anchor, Popover, Stack, Text, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import type { Storage } from '../api/types';
import { useAllDecks } from '../decks/api';
import { LockStickerIcon } from '../theme/Sticker';

const HOVER_CLOSE_DELAY = 120;

interface StorageLockStickerProps {
  storage: Pick<Storage, 'locked' | 'allowed_deck_ids'>;
  size?: 'xs' | 'sm' | 'md';
}

export function StorageLockSticker({ storage, size = 'sm' }: StorageLockStickerProps) {
  const decks = useAllDecks(storage.locked);
  const canHover = useMediaQuery('(hover: hover)') ?? false;
  const [opened, setOpened] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  if (!storage.locked) {
    return null;
  }

  const deckNames = new Map((decks.data ?? []).map((deck) => [deck.id, deck.name]));
  const allowed = storage.allowed_deck_ids.flatMap((id) => {
    const name = deckNames.get(id);
    return name ? [{ id, name }] : [];
  });
  const reserved = storage.allowed_deck_ids.length > 0;
  const label = reserved
    ? `Rangement réservé à ${allowed.map((deck) => deck.name).join(', ')}`
    : 'Rangement verrouillé pour tous les decks';

  function hoverOpen() {
    window.clearTimeout(closeTimer.current);
    setOpened(true);
  }

  function hoverClose() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpened(false), HOVER_CLOSE_DELAY);
  }

  const hoverHandlers = canHover ? { onMouseEnter: hoverOpen, onMouseLeave: hoverClose } : {};

  return (
    <Popover opened={opened} onChange={setOpened} withArrow shadow="md" position="bottom-start">
      <Popover.Target>
        <UnstyledButton
          className="tamiyo-sticker"
          data-tone="prune"
          data-size={size}
          aria-label={label}
          aria-expanded={opened}
          style={{ transform: 'rotate(-3deg)' }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpened((current) => !current);
          }}
          {...hoverHandlers}
        >
          <LockStickerIcon />
          <span className="tamiyo-sticker-text">{reserved ? 'réservé' : 'verrouillé'}</span>
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown onClick={(event) => event.stopPropagation()} {...hoverHandlers}>
        {reserved ? (
          <Stack gap={4}>
            <Text size="sm">Réservé à :</Text>
            {allowed.map((deck) => (
              <Anchor key={deck.id} component={Link} to={`/decks/${deck.id}`} size="sm">
                {deck.name}
              </Anchor>
            ))}
          </Stack>
        ) : (
          <Text size="sm">Verrouillé pour tous les decks : aucun deck n'y pioche</Text>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
