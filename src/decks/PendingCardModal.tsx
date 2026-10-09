import { Alert, Button, Divider, Grid, Group, Modal, NumberInput, Select, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, PendingCard } from '../api/types';
import { CardImage } from '../cards/CardImage';
import { PendingBadge, pendingStatusDescription } from '../cards/PendingBadge';
import { CardRulesText } from '../scryfall/CardRulesText';
import { commanderEligibility } from '../scryfall/commander';
import { useBackImage, useScryfallCard } from '../scryfall/hooks';
import { useStorageOptions } from '../storages/api';
import { StorageFieldLabel } from '../storages/StorageLabel';
import type { DeckBoard } from '../api/types';
import { isCommanderFormat, useCommitPendingCards, useMovePendingCard, useUpdateDeck } from './api';
import { movedMessage } from './boards';
import { BoardPicker } from './BoardSection';
import { CardTagsInput } from './CardTagsInput';
import { pendingStatus } from './pendingCards';
import { DeckQuantityControl } from './DeckQuantityControl';
import { EditionSwitcher } from './EditionSwitcher';

interface PendingCardModalProps {
  deckId: string;
  deckFormat: string;
  commanderPendingId: number | null | undefined;
  deckCardIds: Set<number>;
  card: Card | null;
  item: PendingCard | undefined;
  imageUrl: string | undefined;
  onClose: () => void;
}

export function PendingCardModal({
  deckId,
  deckFormat,
  commanderPendingId,
  deckCardIds,
  card,
  item,
  imageUrl,
  onClose,
}: PendingCardModalProps) {
  const lastShown = useRef<{ card: Card; item: PendingCard | undefined; imageUrl: string | undefined } | null>(null);
  if (card) {
    lastShown.current = { card, item, imageUrl };
  }
  const shown = lastShown.current;
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
    <Modal opened={card !== null} onClose={onClose} title={shown?.card.name} size="xl">
      {shown && (
        <Stack gap="lg">
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <PendingCardImage card={shown.card} imageUrl={shown.imageUrl} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 7 }}>
              <Stack>
                <div>
                  <Title order={3} size="h4">
                    {shown.card.name}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {shown.card.set_code.toUpperCase()} · #{shown.card.collector_number}
                    {shown.card.foil ? ' · foil' : ''}
                  </Text>
                  {status && (
                    <Group mt={6}>
                      <PendingBadge status={status} />
                    </Group>
                  )}
                </div>
                <CardRulesText scryfallId={shown.card.scryfall_id} />
                <CardTagsInput deckId={deckId} cardName={shown.card.name} />
                {shown.item && (
                  <PendingBoardPicker
                    deckId={deckId}
                    item={shown.item}
                    isCommander={commanderPendingId === shown.item.id}
                    onMoved={onClose}
                  />
                )}
                {isCommanderFormat(deckFormat) && shown.item && (
                  <PendingCommanderControl
                    deckId={deckId}
                    item={shown.item}
                    isCommander={commanderPendingId === shown.item.id}
                    onDone={onClose}
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
                isCommander={commanderPendingId === shown.item.id}
                onSwapped={onClose}
              />
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}

interface PendingBoardPickerProps {
  deckId: string;
  item: PendingCard;
  isCommander: boolean;
  onMoved: () => void;
}

function PendingBoardPicker({ deckId, item, isCommander, onMoved }: PendingBoardPickerProps) {
  const move = useMovePendingCard();

  function moveTo(board: DeckBoard) {
    move.mutate(
      { deckId, pendingId: item.id, board },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: movedMessage(item.name, item.quantity, board) });
          onMoved();
        },
      },
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

const ineligibilityMessages = {
  not_eligible:
    "Cette carte ne peut pas être commandant : il faut une créature légendaire, un véhicule légendaire avec force et endurance, ou une carte qui précise qu'elle peut être ton commandant.",
  banned: 'Cette carte est bannie en Commander.',
} as const;

interface PendingCommanderControlProps {
  deckId: string;
  item: PendingCard;
  isCommander: boolean;
  onDone: () => void;
}

function PendingCommanderControl({ deckId, item, isCommander, onDone }: PendingCommanderControlProps) {
  const scryfallCard = useScryfallCard(isCommander ? null : item.scryfall_id);
  const eligibility = scryfallCard.data ? commanderEligibility(scryfallCard.data) : null;
  const update = useUpdateDeck();

  if (isCommander) {
    return <Text size="sm">C'est le commandant de ce deck.</Text>;
  }

  function makeCommander() {
    update.mutate(
      { id: deckId, changes: { commander_pending_id: item.id } },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: `${item.name} est maintenant le commandant du deck.` });
          onDone();
        },
      },
    );
  }

  if (scryfallCard.isLoading) {
    return (
      <Button variant="light" loading disabled>
        Définir comme commandant
      </Button>
    );
  }
  if (!scryfallCard.data) {
    return (
      <Text size="sm" c="dimmed">
        Impossible de vérifier sur Scryfall si cette carte peut être commandant. Réessaie plus tard.
      </Text>
    );
  }
  if (eligibility !== 'eligible') {
    return eligibility ? (
      <Text size="sm" c="dimmed">
        {ineligibilityMessages[eligibility]}
      </Text>
    ) : null;
  }
  return (
    <Stack gap={4}>
      <Button variant="light" onClick={makeCommander} loading={update.isPending}>
        Définir comme commandant
      </Button>
      {update.error && (
        <Text size="xs" c="red">
          {errorMessage(update.error)}
        </Text>
      )}
    </Stack>
  );
}
