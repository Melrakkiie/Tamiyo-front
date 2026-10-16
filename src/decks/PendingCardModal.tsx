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
import type { Card, Deck, PendingCard } from '../api/types';
import { CardImage } from '../cards/CardImage';
import { PendingBadge, pendingStatusDescription } from '../cards/PendingBadge';
import { PrintPrice } from '../cards/price';
import { CardRulesText } from '../scryfall/CardRulesText';
import { useBackImage } from '../scryfall/hooks';
import { useStorageOptions } from '../storages/api';
import { StorageFieldLabel } from '../storages/StorageLabel';
import { FoilSticker, ProxySticker } from '../theme/Sticker';
import type { DeckBoard } from '../api/types';
import { isCommanderFormat, useCommitPendingCards, useMovePendingCard } from './api';
import { movedMessage } from './boards';
import { BoardPicker } from './BoardSection';
import { CardTagsInput } from './CardTagsInput';
import { CommanderControl } from './CommanderControl';
import { pendingSlot } from './commanders';
import { pendingStatus } from './pendingCards';
import { DeckQuantityControl } from './DeckQuantityControl';
import { type EditionSource, EditionSwitcher } from './EditionSwitcher';

interface PendingCardModalProps {
  deck: Deck;
  deckCardIds: Set<number>;
  card: Card | null;
  item: PendingCard | undefined;
  imageUrl: string | undefined;
  loading: boolean;
  onClose: () => void;
  onSwapped: (next: EditionSource) => void;
}

export function PendingCardModal({
  deck,
  deckCardIds,
  card,
  item,
  imageUrl,
  loading,
  onClose,
  onSwapped,
}: PendingCardModalProps) {
  const lastShown = useRef<{ card: Card; item: PendingCard | undefined; imageUrl: string | undefined } | null>(null);
  if (card && !loading) {
    lastShown.current = { card, item, imageUrl };
  }
  const shown = lastShown.current;
  const deckId = deck.id;
  const commanderSlot = shown?.item ? pendingSlot(deck, shown.item.id) : null;
  const commit = useCommitPendingCards();
  const storageOptions = useStorageOptions();
  const [storageId, setStorageId] = useState<string | null>(null);
  const [count, setCount] = useState<number | string>('');
  const total = shown?.item?.quantity ?? 1;
  const status = shown?.item ? pendingStatus(shown.item) : null;
  const selected = count === '' ? total : Math.min(total, Math.max(1, Math.floor(Number(count)) || 1));

  function copies(n: number, name: string) {
    return n > 1 ? `${n} exemplaires de ${name}` : name;
  }

  function addToCollection() {
    if (!shown?.item) {
      return;
    }
    const { item: added } = shown;
    const n = selected;
    commit.mutate(
      { deckId, storageId: storageId ? Number(storageId) : null, pendingId: added.id, quantity: n },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: `${copies(n, added.name)} ajouté${n > 1 ? 's' : 'e'} à ta collection.`,
          });
          setCount('');
          if (n >= added.quantity) {
            onClose();
          }
        },
      },
    );
  }

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
          <Stack gap="lg">
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, sm: 5 }}>
                <PendingCardImage card={shown.card} imageUrl={shown.imageUrl} />
                <PrintPrice scryfallId={shown.card.scryfall_id} foil={shown.card.foil} ta="center" mt="xs" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 7 }}>
                <Stack>
                  <div>
                    <Title order={3} size="h4">
                      {shown.card.name}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {shown.card.set_code.toUpperCase()} · #{shown.card.collector_number}
                    </Text>
                    {(status || shown.card.foil || shown.card.proxy) && (
                      <Group gap={6} mt={6}>
                        {status && <PendingBadge status={status} />}
                        {shown.card.foil && <FoilSticker size="sm" />}
                        {shown.card.proxy && <ProxySticker size="sm" />}
                      </Group>
                    )}
                  </div>
                  <CardRulesText scryfallId={shown.card.scryfall_id} />
                  <CardTagsInput deckId={deckId} cardName={shown.card.name} />
                  {shown.item && (
                    <PendingBoardPicker deckId={deckId} item={shown.item} isCommander={commanderSlot !== null} />
                  )}
                  {shown.item && (commanderSlot !== null || isCommanderFormat(deck.format)) && (
                    <CommanderControl
                      deck={deck}
                      name={shown.item.name}
                      scryfallId={shown.item.scryfall_id}
                      slot={commanderSlot}
                      target={{ pendingId: shown.item.id }}
                    />
                  )}
                  <Divider />
                  {shown.item && (
                    <DeckQuantityControl
                      key={`${shown.item.id}-${shown.item.quantity}`}
                      deckId={deckId}
                      card={shown.card}
                      board={shown.item.board}
                      source={{ kind: 'pending', item: shown.item }}
                      onChanged={(removedAll) => removedAll && onClose()}
                    />
                  )}
                  <Divider />
                  <Text size="sm">
                    {total > 1
                      ? `Ces ${total} exemplaires ne sont pas encore dans ta collection.`
                      : "Cette carte n'est pas encore dans ta collection."}
                  </Text>
                  {status && status.kind !== 'missing' && (
                    <Text size="sm" c="teal">
                      {pendingStatusDescription(status)} : choisis-en un dans « Changer d'édition » ci-dessous pour
                      l'utiliser à la place.
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
                  <Button color="orange" onClick={addToCollection} loading={commit.isPending} disabled={!shown.item}>
                    {selected < total ? `Ajouter ${selected} sur ${total} à ma collection` : 'Ajouter à ma collection'}
                  </Button>
                  {commit.error && (
                    <Alert color="red">
                      {errorMessage(commit.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })}
                    </Alert>
                  )}
                </Stack>
              </Grid.Col>
            </Grid>
            {shown.item && (
              <>
                <Divider />
                <EditionSwitcher
                  key={shown.item.id}
                  deckId={deckId}
                  source={{ kind: 'pending', item: shown.item }}
                  deckCardIds={deckCardIds}
                  commanderSlot={commanderSlot}
                  onSwapped={onSwapped}
                />
              </>
            )}
          </Stack>
        )
      )}
    </Modal>
  );
}

interface PendingBoardPickerProps {
  deckId: string;
  item: PendingCard;
  isCommander: boolean;
}

function PendingBoardPicker({ deckId, item, isCommander }: PendingBoardPickerProps) {
  const move = useMovePendingCard();

  function ignore() {}

  function moveTo(board: DeckBoard) {
    move
      .mutateAsync({ deckId, pendingId: item.id, board })
      .then(
        () => notifications.show({ color: 'green', message: movedMessage(item.name, item.quantity, board) }),
        ignore,
      );
  }

  return (
    <Stack gap={4}>
      <BoardPicker
        value={item.board}
        onChange={moveTo}
        disabled={isCommander || move.isPending}
        description={isCommander ? 'Le commandant reste dans le deck principal.' : undefined}
      />
      {move.error && (
        <Text size="xs" c="red">
          {errorMessage(move.error)}
        </Text>
      )}
    </Stack>
  );
}

function PendingCardImage({ card, imageUrl }: { card: Card; imageUrl: string | undefined }) {
  const backImage = useBackImage(card.scryfall_id);
  return <CardImage key={card.id} name={card.name} url={imageUrl} backUrl={backImage} loading={false} />;
}
