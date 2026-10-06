import { Alert, Button, Divider, Grid, Group, Modal, Select, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, PendingCard } from '../api/types';
import { CardImage } from '../cards/CardImage';
import { CardRulesText } from '../scryfall/CardRulesText';
import { useStorageOptions } from '../storages/api';
import { useCommitPendingCards, useRemovePendingCard } from './api';

interface PendingCardModalProps {
  deckId: number;
  card: Card | null;
  item: PendingCard | undefined;
  imageUrl: string | undefined;
  onClose: () => void;
}

export function PendingCardModal({ deckId, card, item, imageUrl, onClose }: PendingCardModalProps) {
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
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <CardImage name={shown.card.name} url={shown.imageUrl} loading={false} />
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
      )}
    </Modal>
  );
}
