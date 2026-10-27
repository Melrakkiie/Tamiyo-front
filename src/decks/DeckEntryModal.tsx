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
import { useMemo, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck, DeckBoard } from '../api/types';
import { useUpdateCard } from '../cards/api';
import { CardImage } from '../cards/CardImage';
import { cardPrinting } from '../cards/cardLinks';
import { CardLinkTiles } from '../cards/CardLinkTiles';
import { PendingBadge, pendingStatusDescription } from '../cards/PendingBadge';
import { PrintPrice } from '../cards/price';
import { useLastShown } from '../layout/useLastShown';
import { CardRulesText } from '../scryfall/CardRulesText';
import { usePrintingFaces } from '../scryfall/hooks';
import { useAllStorages, useStorageOptions } from '../storages/api';
import { StorageFieldLabel } from '../storages/StorageLabel';
import { FoilSticker, ProxySticker } from '../theme/Sticker';
import { isCommanderFormat } from './api';
import { movedMessage } from './boards';
import { BoardPicker } from './BoardSection';
import { CardTagsInput } from './CardTagsInput';
import { CommanderControl } from './CommanderControl';
import { DeckQuantityControl } from './DeckQuantityControl';
import { type DeckEntry, type OwnedEntry, type PendingEntry, entrySlotTarget } from './deckEntries';
import { EditionSwitcher } from './EditionSwitcher';
import { heldSlot } from './entryMutations/slots';
import { useDeckEntryMutations } from './entryMutations/useDeckEntryMutations';
import { pendingStatus } from './pendingCards';

interface DeckEntryModalProps {
  deck: Deck;
  deckCardIds: Set<number>;
  entry: DeckEntry | null;
  imageUrl: string | undefined;
  loading: boolean;
  onClose: () => void;
  onSwapped: (next: DeckEntry) => void;
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
  const shown = useLastShown(
    useMemo(() => (entry && !loading ? { entry, imageUrl } : null), [entry, imageUrl, loading]),
  );

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
  onSwapped: (next: DeckEntry) => void;
}

function DeckEntryDetail({ deck, deckCardIds, entry, imageUrl, onClose, onSwapped }: DeckEntryDetailProps) {
  const deckId = deck.id;
  const commanderSlot = heldSlot(deck, entry)?.slot ?? null;
  const isCommander = commanderSlot !== null;
  const mutations = useDeckEntryMutations(deck);
  const faces = usePrintingFaces([entry.scryfall_id]).data[entry.scryfall_id];
  const status = entry.kind === 'pending' ? pendingStatus(entry.pending) : null;
  const linkedPrinting = cardPrinting(entry);

  async function moveToBoard(board: DeckBoard) {
    try {
      const { affected } = await mutations.run(entry, { kind: 'moveToBoard', board });
      notifications.show({ color: 'green', message: movedMessage(entry.name, affected, board) });
    } catch {
      return;
    }
  }

  return (
    <Stack gap="lg">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <CardImage key={entry.key} name={entry.name} frontUrl={imageUrl} back={faces?.back} loading={false} />
          <PrintPrice scryfallId={entry.scryfall_id} foil={entry.foil} ta="center" mt="xs" />
          <CardLinkTiles printing={linkedPrinting} />
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

            {mutations.error && <Alert color="red">{errorMessage(mutations.error)}</Alert>}

            <BoardPicker
              value={entry.board}
              onChange={moveToBoard}
              disabled={isCommander || mutations.isPending}
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
                target={entrySlotTarget(entry)}
              />
            )}

            <Divider />
            <DeckQuantityControl
              key={`${entry.key}-${entry.quantity}`}
              deck={deck}
              entry={entry}
              onChanged={(removedAll) => (removedAll || entry.kind === 'owned') && onClose()}
            />

            <Divider />
            {entry.kind === 'pending' ? (
              <PendingCollectionSection deck={deck} entry={entry} onClose={onClose} />
            ) : (
              <OwnedStorageSection entry={entry} />
            )}
          </Stack>
        </Grid.Col>
      </Grid>
      <Divider />
      <EditionSwitcher
        deck={deck}
        entry={entry}
        deckCardIds={deckCardIds}
        commanderSlot={commanderSlot}
        onSwapped={onSwapped}
      />
    </Stack>
  );
}

interface StorageSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

function StorageSelect({ value, onChange, disabled }: StorageSelectProps) {
  const storageOptions = useStorageOptions();

  return (
    <Select
      label={<StorageFieldLabel>Rangement</StorageFieldLabel>}
      placeholder="Aucun rangement"
      data={storageOptions}
      value={value}
      onChange={onChange}
      clearable
      searchable
      disabled={disabled}
    />
  );
}

function OwnedStorageSection({ entry }: { entry: OwnedEntry }) {
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
      <StorageSelect value={storageId} onChange={moveToStorage} disabled={updateCard.isPending} />
      {updateCard.error && <Alert color="red">{errorMessage(updateCard.error)}</Alert>}
    </Stack>
  );
}

interface PendingCollectionSectionProps {
  deck: Deck;
  entry: PendingEntry;
  onClose: () => void;
}

function PendingCollectionSection({ deck, entry, onClose }: PendingCollectionSectionProps) {
  const mutations = useDeckEntryMutations(deck);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [count, setCount] = useState<number | string>('');
  const total = entry.quantity;
  const status = pendingStatus(entry.pending);
  const selected = count === '' ? total : Math.min(total, Math.max(1, Math.floor(Number(count)) || 1));

  function copies(n: number, name: string) {
    return n > 1 ? `${n} exemplaires de ${name}` : name;
  }

  async function addToCollection() {
    const n = selected;
    try {
      await mutations.run(entry, {
        kind: 'addToCollection',
        storageId: storageId ? Number(storageId) : null,
        count: n,
      });
    } catch {
      return;
    }
    notifications.show({
      color: 'green',
      message: `${copies(n, entry.name)} ajouté${n > 1 ? 's' : 'e'} à ta collection.`,
    });
    setCount('');
    if (n >= total) {
      onClose();
    }
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
        <StorageSelect value={storageId} onChange={setStorageId} />
      </Group>
      <Button color="orange" onClick={addToCollection} loading={mutations.isPending}>
        {selected < total ? `Ajouter ${selected} sur ${total} à ma collection` : 'Ajouter à ma collection'}
      </Button>
      {mutations.error && (
        <Alert color="red">
          {errorMessage(mutations.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })}
        </Alert>
      )}
    </Stack>
  );
}
