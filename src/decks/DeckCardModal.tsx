import { Alert, Center, Divider, Grid, Group, Loader, Modal, Select, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, Deck, DeckBoard } from '../api/types';
import { useUpdateCard } from '../cards/api';
import { copyIds } from '../cards/copies';
import { CardImage } from '../cards/CardImage';
import { PrintPrice } from '../cards/price';
import { CardRulesText } from '../scryfall/CardRulesText';
import { useBackImage } from '../scryfall/hooks';
import { useAllStorages, useStorageOptions } from '../storages/api';
import { StorageFieldLabel } from '../storages/StorageLabel';
import { FoilSticker, ProxySticker } from '../theme/Sticker';
import { isCommanderFormat, useMoveDeckCards } from './api';
import { movedMessage } from './boards';
import { BoardPicker } from './BoardSection';
import { CardTagsInput } from './CardTagsInput';
import { CommanderControl } from './CommanderControl';
import { cardSlot, type CommanderSlot } from './commanders';
import { DeckQuantityControl } from './DeckQuantityControl';
import { type EditionSource, EditionSwitcher } from './EditionSwitcher';

interface DeckCardModalProps {
  deck: Deck;
  deckCardIds: Set<number>;
  card: Card | null;
  board: DeckBoard;
  imageUrl: string | undefined;
  loading: boolean;
  onClose: () => void;
  onSwapped: (next: EditionSource) => void;
}

export function DeckCardModal({
  deck,
  deckCardIds,
  card,
  board,
  imageUrl,
  loading,
  onClose,
  onSwapped,
}: DeckCardModalProps) {
  const lastShown = useRef<{ card: Card; board: DeckBoard; imageUrl: string | undefined } | null>(null);
  if (card && !loading) {
    lastShown.current = { card, board, imageUrl };
  }
  const shown = lastShown.current;

  return (
    <Modal opened={card !== null} onClose={onClose} title={card?.name ?? shown?.card.name} size="xl">
      {loading ? (
        <Center mih={400}>
          <Stack align="center" gap="xs">
            <Loader />
            <Text size="sm" c="dimmed">
              Changement d'édition…
            </Text>
          </Stack>
        </Center>
      ) : (
        shown && (
          <DeckCardDetail
            key={shown.card.id}
            deck={deck}
            commanderSlot={cardSlot(deck, shown.card.id)}
            deckCardIds={deckCardIds}
            card={shown.card}
            board={shown.board}
            imageUrl={shown.imageUrl}
            onClose={onClose}
            onSwapped={onSwapped}
          />
        )
      )}
    </Modal>
  );
}

interface DeckCardDetailProps {
  deck: Deck;
  commanderSlot: CommanderSlot | null;
  deckCardIds: Set<number>;
  card: Card;
  board: DeckBoard;
  imageUrl: string | undefined;
  onClose: () => void;
  onSwapped: (next: EditionSource) => void;
}

function DeckCardDetail({
  deck,
  commanderSlot,
  deckCardIds,
  card,
  board,
  imageUrl,
  onClose,
  onSwapped,
}: DeckCardDetailProps) {
  const deckId = deck.id;
  const isCommander = commanderSlot !== null;
  const move = useMoveDeckCards();
  const ids = copyIds(card);
  const backImage = useBackImage(card.scryfall_id);
  const storageOptions = useStorageOptions();
  const storages = useAllStorages();
  const updateCard = useUpdateCard();
  const [storageId, setStorageId] = useState<string | null>(card.storage_id ? String(card.storage_id) : null);

  function moveToStorage(next: string | null) {
    const previous = storageId;
    setStorageId(next);
    updateCard.mutate(
      { id: card.id, changes: { storage_id: next ? Number(next) : null } },
      {
        onSuccess: () => {
          const label = storages.data?.find((storage) => String(storage.id) === next)?.name;
          notifications.show({
            color: 'green',
            message: label ? `${card.name} est rangée dans ${label}.` : `${card.name} n'est plus dans un rangement.`,
          });
        },
        onError: () => setStorageId(previous),
      },
    );
  }

  function ignore() {}

  function moveToBoard(next: DeckBoard) {
    move
      .mutateAsync({ deckId, cardIds: ids, board: next })
      .then(() => notifications.show({ color: 'green', message: movedMessage(card.name, ids.length, next) }), ignore);
  }

  const error = updateCard.error ?? move.error;

  return (
    <Stack gap="lg">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <CardImage name={card.name} url={imageUrl} backUrl={backImage} loading={false} />
          <PrintPrice scryfallId={card.scryfall_id} foil={card.foil} ta="center" mt="xs" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7 }}>
          <Stack>
            <div>
              <Title order={3} size="h4">
                {card.name}
              </Title>
              <Text size="sm" c="dimmed">
                {card.set_code.toUpperCase()} · #{card.collector_number}
              </Text>
              {(card.foil || card.proxy) && (
                <Group gap={6} mt={6}>
                  {card.foil && <FoilSticker size="sm" />}
                  {card.proxy && <ProxySticker size="sm" />}
                </Group>
              )}
            </div>

            {(card.quantity ?? 1) > 1 && (
              <Text size="sm" c="dimmed">
                {card.quantity} exemplaires identiques dans ce deck (même édition, même rangement) : le rangement ne
                change que pour l'un d'eux.
              </Text>
            )}

            <CardRulesText scryfallId={card.scryfall_id} />

            <CardTagsInput deckId={deckId} cardName={card.name} />

            {error && <Alert color="red">{errorMessage(error)}</Alert>}

            <BoardPicker
              value={board}
              onChange={moveToBoard}
              disabled={isCommander || move.isPending}
              description={
                isCommander
                  ? 'Le commandant reste dans le deck principal.'
                  : (card.quantity ?? 1) > 1
                    ? `Les ${card.quantity} exemplaires identiques changent de section ensemble.`
                    : undefined
              }
            />

            {(isCommander || isCommanderFormat(deck.format)) && (
              <CommanderControl
                deck={deck}
                name={card.name}
                scryfallId={card.scryfall_id}
                slot={commanderSlot}
                target={{ cardId: card.id }}
              />
            )}
            <Select
              label={<StorageFieldLabel>Rangement</StorageFieldLabel>}
              placeholder="Aucun rangement"
              data={storageOptions}
              value={storageId}
              onChange={moveToStorage}
              clearable
              searchable
              disabled={updateCard.isPending}
            />
            <Divider />
            <DeckQuantityControl
              deckId={deckId}
              card={card}
              board={board}
              source={{ kind: 'owned', copyIds: ids, commanderSlot }}
              onChanged={onClose}
            />
          </Stack>
        </Grid.Col>
      </Grid>
      <Divider />
      <EditionSwitcher
        deckId={deckId}
        source={{ kind: 'card', card, board }}
        deckCardIds={deckCardIds}
        commanderSlot={commanderSlot}
        onSwapped={onSwapped}
      />
    </Stack>
  );
}
