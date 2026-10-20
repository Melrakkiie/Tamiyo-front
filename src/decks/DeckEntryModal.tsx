import {
  Alert,
  Button,
  Center,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { useUpdateCard } from '../cards/api';
import { CardImage } from '../cards/CardImage';
import { PendingBadge, pendingStatusDescription } from '../cards/PendingBadge';
import { PrintPrice } from '../cards/price';
import { CardRulesText } from '../scryfall/CardRulesText';
import { useBackImage } from '../scryfall/hooks';
import { useAllStorages, useStorageOptions } from '../storages/api';
import { StorageFieldLabel } from '../storages/StorageLabel';
import { FoilSticker, ProxySticker } from '../theme/Sticker';
import { isCommanderFormat, useCommitPendingCards } from './api';
import { movedMessage } from './boards';
import { BoardPicker } from './BoardSection';
import { CardTagsInput } from './CardTagsInput';
import { CommanderControl } from './CommanderControl';
import { commanderSlotOf } from './commanders';
import { DeckQuantityControl } from './DeckQuantityControl';
import type { DeckEntry, OwnedEntry, PendingEntry } from './deckEntries';
import { type EditionSource, EditionSwitcher } from './EditionSwitcher';
import { pendingStatus } from './pendingCards';
import { useMoveEntry } from './useMoveEntry';

interface DeckEntryModalProps {
  deck: Deck;
  deckCardIds: Set<number>;
  entry: DeckEntry | null;
  imageUrl: string | undefined;
  loading: boolean;
  onClose: () => void;
  onSwapped: (next: EditionSource) => void;
}

export function DeckEntryModal({
  deck,
  deckCardIds,
  entry,
  imageUrl,
  loading,
  onClose,
  onSwapped,
}: DeckEntryModalProps) {
  const lastShown = useRef<{ entry: DeckEntry; imageUrl: string | undefined } | null>(null);
  if (entry && !loading) {
    lastShown.current = { entry, imageUrl };
  }
  const shown = lastShown.current;

  return (
    <Modal opened={entry !== null} onClose={onClose} title={entry?.name ?? shown?.entry.name} size="xl">
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
          <DeckEntryDetail
            key={shown.entry.key}
            deck={deck}
            deckCardIds={deckCardIds}
            entry={shown.entry}
            imageUrl={shown.imageUrl}
            onClose={onClose}
            onSwapped={onSwapped}
          />
        )
      )}
    </Modal>
  );
}

interface DeckEntryDetailProps {
  deck: Deck;
  deckCardIds: Set<number>;
  entry: DeckEntry;
  imageUrl: string | undefined;
  onClose: () => void;
  onSwapped: (next: EditionSource) => void;
}

function DeckEntryDetail({ deck, deckCardIds, entry, imageUrl, onClose, onSwapped }: DeckEntryDetailProps) {
  const deckId = deck.id;
  const commanderSlot = commanderSlotOf(deck, entry);
  const isCommander = commanderSlot !== null;
  const mover = useMoveEntry(deckId);
  const backImage = useBackImage(entry.scryfall_id);
  const status = entry.kind === 'pending' ? pendingStatus(entry.pending) : null;

  function ignore() {}

  function moveToBoard(next: Parameters<typeof mover.move>[1]) {
    mover
      .move(entry, next)
      .then((count) => notifications.show({ color: 'green', message: movedMessage(entry.name, count, next) }), ignore);
  }

  return (
    <Stack gap="lg">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <CardImage key={entry.key} name={entry.name} url={imageUrl} backUrl={backImage} loading={false} />
          <PrintPrice scryfallId={entry.scryfall_id} foil={entry.foil} ta="center" mt="xs" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7 }}>
          <Stack>
            <div>
              <Title order={3} size="h4">
                {entry.name}
              </Title>
              <Text size="sm" c="dimmed">
                {entry.set_code.toUpperCase()} · #{entry.collector_number}
              </Text>
              {(status || entry.foil || entry.proxy) && (
                <Group gap={6} mt={6}>
                  {status && <PendingBadge status={status} />}
                  {entry.foil && <FoilSticker size="sm" />}
                  {entry.proxy && <ProxySticker size="sm" />}
                </Group>
              )}
            </div>

            <CardRulesText scryfallId={entry.scryfall_id} />

            <CardTagsInput deckId={deckId} cardName={entry.name} />

            {mover.error && <Alert color="red">{errorMessage(mover.error)}</Alert>}

            <BoardPicker
              value={entry.board}
              onChange={moveToBoard}
              disabled={isCommander || mover.isPending}
              description={
                isCommander
                  ? 'Le commandant reste dans le deck principal.'
                  : entry.quantity > 1
                    ? `Les ${entry.quantity} exemplaires identiques changent de section ensemble.`
                    : undefined
              }
            />

            {(isCommander || isCommanderFormat(deck.format)) && (
              <CommanderControl
                deck={deck}
                name={entry.name}
                scryfallId={entry.scryfall_id}
                slot={commanderSlot}
                target={entry.kind === 'pending' ? { pendingId: entry.pending.id } : { cardId: entry.id }}
              />
            )}

            <Divider />
            {entry.kind === 'pending' ? (
              <DeckQuantityControl
                key={`${entry.pending.id}-${entry.quantity}`}
                deckId={deckId}
                card={entry}
                board={entry.board}
                source={{ kind: 'pending', item: entry.pending }}
                onChanged={(removedAll) => removedAll && onClose()}
              />
            ) : (
              <DeckQuantityControl
                deckId={deckId}
                card={entry}
                board={entry.board}
                source={{ kind: 'owned', copyIds: entry.copy_ids, commanderSlot }}
                onChanged={onClose}
              />
            )}

            <Divider />
            {entry.kind === 'pending' ? (
              <PendingCollectionSection deckId={deckId} entry={entry} onClose={onClose} />
            ) : (
              <OwnedStorageSection entry={entry} />
            )}
          </Stack>
        </Grid.Col>
      </Grid>
      <Divider />
      <EditionSwitcher
        deckId={deckId}
        source={
          entry.kind === 'pending'
            ? { kind: 'pending', item: entry.pending }
            : { kind: 'card', card: entry, board: entry.board }
        }
        deckCardIds={deckCardIds}
        commanderSlot={commanderSlot}
        onSwapped={onSwapped}
      />
    </Stack>
  );
}

function OwnedStorageSection({ entry }: { entry: OwnedEntry }) {
  const storageOptions = useStorageOptions();
  const storages = useAllStorages();
  const updateCard = useUpdateCard();
  const [storageId, setStorageId] = useState<string | null>(entry.storage_id ? String(entry.storage_id) : null);

  function moveToStorage(next: string | null) {
    const previous = storageId;
    setStorageId(next);
    updateCard.mutate(
      { id: entry.id, changes: { storage_id: next ? Number(next) : null } },
      {
        onSuccess: () => {
          const label = storages.data?.find((storage) => String(storage.id) === next)?.name;
          notifications.show({
            color: 'green',
            message: label ? `${entry.name} est rangée dans ${label}.` : `${entry.name} n'est plus dans un rangement.`,
          });
        },
        onError: () => setStorageId(previous),
      },
    );
  }

  return (
    <Stack gap="xs">
      {entry.quantity > 1 && (
        <Text size="sm" c="dimmed">
          {entry.quantity} exemplaires identiques dans ce deck (même édition, même rangement) : le rangement ne change
          que pour l'un d'eux.
        </Text>
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
      {updateCard.error && <Alert color="red">{errorMessage(updateCard.error)}</Alert>}
    </Stack>
  );
}

interface PendingCollectionSectionProps {
  deckId: string;
  entry: PendingEntry;
  onClose: () => void;
}

function PendingCollectionSection({ deckId, entry, onClose }: PendingCollectionSectionProps) {
  const commit = useCommitPendingCards();
  const storageOptions = useStorageOptions();
  const [storageId, setStorageId] = useState<string | null>(null);
  const [count, setCount] = useState<number | string>('');
  const total = entry.quantity;
  const status = pendingStatus(entry.pending);
  const selected = count === '' ? total : Math.min(total, Math.max(1, Math.floor(Number(count)) || 1));

  function copies(n: number, name: string) {
    return n > 1 ? `${n} exemplaires de ${name}` : name;
  }

  function addToCollection() {
    const n = selected;
    commit.mutate(
      { deckId, storageId: storageId ? Number(storageId) : null, pendingId: entry.pending.id, quantity: n },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: `${copies(n, entry.name)} ajouté${n > 1 ? 's' : 'e'} à ta collection.`,
          });
          setCount('');
          if (n >= total) {
            onClose();
          }
        },
      },
    );
  }

  return (
    <Stack gap="xs">
      <Text size="sm">
        {total > 1
          ? `Ces ${total} exemplaires ne sont pas encore dans ta collection.`
          : "Cette carte n'est pas encore dans ta collection."}
      </Text>
      {status.kind !== 'missing' && (
        <Text size="sm" c="teal">
          {pendingStatusDescription(status)} : choisis-en un dans « Changer d'édition » ci-dessous pour l'utiliser à la
          place.
        </Text>
      )}
      <Group align="flex-end" grow>
        {total > 1 && (
          <NumberInput
            label="Combien en ajouter"
            min={1}
            max={total}
            allowDecimal={false}
            value={count === '' ? total : count}
            onChange={setCount}
          />
        )}
        <Select
          label={<StorageFieldLabel>Rangement</StorageFieldLabel>}
          placeholder="Aucun rangement"
          data={storageOptions}
          value={storageId}
          onChange={setStorageId}
          clearable
          searchable
        />
      </Group>
      <Button color="orange" onClick={addToCollection} loading={commit.isPending}>
        {selected < total ? `Ajouter ${selected} sur ${total} à ma collection` : 'Ajouter à ma collection'}
      </Button>
      {commit.error && (
        <Alert color="red">
          {errorMessage(commit.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })}
        </Alert>
      )}
    </Stack>
  );
}
