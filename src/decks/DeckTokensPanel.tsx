import { Box, Center, Loader, Stack, Text, Tooltip } from '@mantine/core';

import type { Deck, DeckBoard } from '../api/types';
import { cardDisplay, displayFromStored, useCardDisplay } from '../cards/CardDisplay';
import { CardGrid } from '../cards/CardLayout';
import { CardCopyItems, useCardContextMenu } from '../cards/CardContextMenu';
import { CardImage } from '../cards/CardImage';
import { showCardPreview } from '../layout/cardPreview';
import { useCardImages, useRelatedTokens } from '../scryfall/hooks';
import { EmptyNote } from '../theme/EmptyNote';
import { useDeckCards, usePendingCards } from './api';
import { deckEntries } from './deckEntries';
import { mainBoardScryfallIds } from './tokenSources';
import { useDeckView } from './view';

export function DeckTokensView({ scryfallIds, columns }: { scryfallIds: string[]; columns: number }) {
  const tokens = useRelatedTokens(scryfallIds);
  const images = useCardImages((tokens.data ?? []).map((token) => token.id));
  const contextMenu = useCardContextMenu();
  const display = cardDisplay({ mode: 'images', columns, showManaCost: false, showDetails: false }, () => undefined);

  if (tokens.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }
  if (!tokens.data?.length) {
    return <EmptyNote title="Aucune carte du deck ne mentionne de jeton." />;
  }
  return (
    <>
      <CardGrid
        display={display}
        cards={tokens.data.map((token) => ({ ...token, key: token.id }))}
        renderTile={(token) => {
          const imageUrl = images.data[token.id];
          return (
            <Tooltip
              key={token.id}
              multiline
              withArrow
              position="bottom"
              label={
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    Cartes liées
                  </Text>
                  {token.relatedCards.map((name) => (
                    <Text key={name} size="sm">
                      {name}
                    </Text>
                  ))}
                </Stack>
              }
            >
              <Box
                onMouseEnter={() => showCardPreview({ name: token.name, scryfallId: token.id, imageUrl })}
                onContextMenu={(event) =>
                  contextMenu.open(event, <CardCopyItems card={{ name: token.name }} imageUrl={imageUrl} />)
                }
              >
                <CardImage name={token.name} frontUrl={imageUrl} loading={images.isLoading} />
              </Box>
            </Tooltip>
          );
        }}
      />
      {contextMenu.element}
    </>
  );
}

// A shared deck has no saved view: the viewer's own column count applies.
export function SharedDeckTokensPanel({ cards }: { cards: { board: DeckBoard; scryfall_id: string }[] }) {
  const { columns } = useCardDisplay();
  return <DeckTokensView scryfallIds={mainBoardScryfallIds(cards)} columns={columns} />;
}

export function DeckTokensPanel({ deck }: { deck: Deck }) {
  const view = useDeckView(deck.id);
  const cards = useDeckCards(deck.id, 'mana_value');
  const pending = usePendingCards(deck.id);
  if (view.isLoading || cards.isLoading || pending.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }
  const ids = mainBoardScryfallIds(deckEntries(cards.data ?? [], pending.data ?? []));
  return <DeckTokensView scryfallIds={ids} columns={displayFromStored(view.data).columns} />;
}
