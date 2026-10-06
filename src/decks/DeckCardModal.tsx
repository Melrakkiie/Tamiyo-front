import { Alert, Button, Grid, Modal, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef } from 'react';

import { errorMessage } from '../api/errors';
import type { Card } from '../api/types';
import { CardImage } from '../cards/CardImage';
import { isCommanderFormat, useRemoveCardFromDeck, useUpdateDeck } from './api';

interface DeckCardModalProps {
  deckId: number;
  deckFormat: string;
  commanderId: number | null | undefined;
  card: Card | null;
  imageUrl: string | undefined;
  onClose: () => void;
}

export function DeckCardModal({ deckId, deckFormat, commanderId, card, imageUrl, onClose }: DeckCardModalProps) {
  const lastShown = useRef<{ card: Card; imageUrl: string | undefined } | null>(null);
  if (card) {
    lastShown.current = { card, imageUrl };
  }
  const shown = lastShown.current;

  return (
    <Modal opened={card !== null} onClose={onClose} title={shown?.card.name} size="lg">
      {shown && (
        <DeckCardDetail
          key={shown.card.id}
          deckId={deckId}
          canBeCommander={isCommanderFormat(deckFormat) || commanderId === shown.card.id}
          isCommander={commanderId === shown.card.id}
          card={shown.card}
          imageUrl={shown.imageUrl}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

interface DeckCardDetailProps {
  deckId: number;
  canBeCommander: boolean;
  isCommander: boolean;
  card: Card;
  imageUrl: string | undefined;
  onClose: () => void;
}

function DeckCardDetail({ deckId, canBeCommander, isCommander, card, imageUrl, onClose }: DeckCardDetailProps) {
  const remove = useRemoveCardFromDeck();
  const update = useUpdateDeck();

  function removeFromDeck() {
    remove.mutate(
      { deckId, cardId: card.id, isCommander },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: `${card.name} a été retirée du deck.` });
          onClose();
        },
      },
    );
  }

  function makeCommander() {
    update.mutate(
      { id: deckId, changes: { commander_id: card.id } },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', message: `${card.name} est maintenant le commandant du deck.` });
          onClose();
        },
      },
    );
  }

  const error = remove.error ?? update.error;

  return (
    <Grid gutter="lg">
      <Grid.Col span={{ base: 12, sm: 5 }}>
        <CardImage name={card.name} url={imageUrl} loading={false} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 7 }}>
        <Stack>
          <div>
            <Title order={3} size="h4">
              {card.name}
            </Title>
            <Text size="sm" c="dimmed">
              {card.set_code.toUpperCase()} · #{card.collector_number} · coût de mana {card.mana_value}
              {card.foil ? ' · foil' : ''}
            </Text>
          </div>

          {error && <Alert color="red">{errorMessage(error)}</Alert>}

          {isCommander ? (
            <Text size="sm">C'est le commandant de ce deck.</Text>
          ) : (
            canBeCommander && (
              <Button variant="light" onClick={makeCommander} loading={update.isPending}>
                Définir comme commandant
              </Button>
            )
          )}
          <Button color="red" variant="subtle" onClick={removeFromDeck} loading={remove.isPending}>
            Retirer du deck
          </Button>
          <Text size="xs" c="dimmed">
            Retirer une carte du deck ne la supprime pas de ta collection.
          </Text>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
