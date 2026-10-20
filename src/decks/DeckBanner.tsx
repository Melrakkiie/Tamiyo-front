import { Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

import type { Deck } from '../api/types';
import { useCardArts } from '../scryfall/hooks';
import { isCommanderFormat } from './api';
import { artBackground, artCredit, deckArtId } from './art';
import { BracketSticker } from './bracket';
import { FormatSticker } from './FormatSticker';
import { VisibilitySticker } from './visibility';

type OnImageSlot = (onImage: boolean) => ReactNode;

interface DeckBannerProps {
  deck: Pick<Deck, 'name' | 'format' | 'visibility' | 'bracket' | 'background_scryfall_id' | 'commander_scryfall_id'>;
  menu: OnImageSlot;
  like: OnImageSlot;
  value: OnImageSlot;
  byline?: OnImageSlot;
}

export function DeckBanner({ deck, menu, like, value, byline }: DeckBannerProps) {
  const artId = deckArtId(deck);
  const arts = useCardArts([artId]);
  const art = artId ? (arts.data?.[artId] ?? null) : null;
  const onImage = art !== null;

  return (
    <Paper
      radius="md"
      p={art ? 'lg' : 0}
      mih={art ? { base: 240, sm: 320 } : undefined}
      pos="relative"
      className={art ? 'tamiyo-banner-taped' : undefined}
      style={art ? { ...artBackground(art.url, 'light'), display: 'flex', flexDirection: 'column' } : undefined}
    >
      <Box pos="absolute" top={art ? 'var(--mantine-spacing-lg)' : 0} right={art ? 'var(--mantine-spacing-lg)' : 0}>
        {menu(onImage)}
      </Box>
      <Stack gap={6} pr={48} style={art ? { marginTop: 'auto' } : undefined}>
        <Title order={2} c={art ? 'white' : undefined}>
          {deck.name}
        </Title>
        <Group gap="xs">
          <FormatSticker format={deck.format} size="md" />
          <VisibilitySticker visibility={deck.visibility} size="md" />
          {isCommanderFormat(deck.format) && <BracketSticker bracket={deck.bracket} size="md" />}
          {like(onImage)}
          {value(onImage)}
        </Group>
        {byline?.(onImage)}
      </Stack>
      {art && (
        <Text size="xs" c="gray.4" ta="right" mt="xs">
          {artCredit(art.artist)}
        </Text>
      )}
    </Paper>
  );
}
