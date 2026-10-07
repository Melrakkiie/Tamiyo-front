import { Alert, Button, Divider, Grid, Group, Modal, Select, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, PendingCard } from '../api/types';
import { CardImage } from '../cards/CardImage';
import { CardRulesText } from '../scryfall/CardRulesText';
import { commanderEligibility } from '../scryfall/commander';
import { useBackImage, useScryfallCard } from '../scryfall/hooks';
import { useStorageOptions } from '../storages/api';
import { isCommanderFormat, useCommitPendingCards, useRemovePendingCard, useUpdateDeck } from './api';
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
  const remove = useRemovePendingCard();
  const commit = useCommitPendingCards();
  const storageOptions = useStorageOptions();
  const [storageId, setStorageId] = useState<string | null>(null);

  function addToCollection() {
    if (!shown?.item) {
      return;
    }
    const { item: added } = shown;
    commit.mutate(
      { deckId, storageId: storageId ? Number(storageId) : null, pendingId: added.id },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message:
              added.quantity > 1
                ? `${added.quantity} exemplaires de ${added.name} ajoutés à ta collection.`
                : `${added.name} ajoutée à ta collection.`,
          });
          onClose();
        },
      },
    );
  }

  function removeFromDeck() {
    if (!shown?.item) {
      return;
    }
    const { item: removed } = shown;
    remove.mutate(
      { deckId, pendingId: removed.id },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: `${removed.name} a été retirée du deck.` });
          onClose();
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
                </div>
                <CardRulesText scryfallId={shown.card.scryfall_id} />
                {isCommanderFormat(deckFormat) && shown.item && (
                  <PendingCommanderControl
                    deckId={deckId}
                    item={shown.item}
                    isCommander={commanderPendingId === shown.item.id}
                    onDone={onClose}
                  />
                )}
                <Divider />
                <Text size="sm">
                  {shown.item && shown.item.quantity > 1
                    ? `Ces ${shown.item.quantity} exemplaires ne sont pas encore dans ta collection.`
                    : "Cette carte n'est pas encore dans ta collection."}
                </Text>
                <Group align="flex-end" grow>
                  <Select
                    label="Rangement"
                    placeholder="Aucun rangement"
                    data={storageOptions}
                    value={storageId}
                    onChange={setStorageId}
                    clearable
                    searchable
                  />
                  <Button color="orange" onClick={addToCollection} loading={commit.isPending} disabled={!shown.item}>
                    Ajouter à ma collection
                  </Button>
                </Group>
                {(commit.error || remove.error) && (
                  <Alert color="red">
                    {commit.error
                      ? errorMessage(commit.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })
                      : errorMessage(remove.error)}
                  </Alert>
                )}
                <Button color="red" variant="subtle" onClick={removeFromDeck} loading={remove.isPending}>
                  {shown.item && shown.item.quantity > 1
                    ? `Retirer les ${shown.item.quantity} exemplaires du deck`
                    : 'Retirer du deck'}
                </Button>
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
