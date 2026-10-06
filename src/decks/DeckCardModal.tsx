import { Alert, Button, Divider, Grid, Modal, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef } from 'react';

import { errorMessage } from '../api/errors';
import type { Card } from '../api/types';
import { CardImage } from '../cards/CardImage';
import { commanderEligibility } from '../scryfall/commander';
import { useScryfallCard } from '../scryfall/hooks';
import { isCommanderFormat, useRemoveCardFromDeck, useUpdateDeck } from './api';
import { EditionSwitcher } from './EditionSwitcher';

interface DeckCardModalProps {
  deckId: number;
  deckFormat: string;
  commanderId: number | null | undefined;
  deckCardIds: Set<number>;
  card: Card | null;
  imageUrl: string | undefined;
  onClose: () => void;
}

export function DeckCardModal({
  deckId,
  deckFormat,
  commanderId,
  deckCardIds,
  card,
  imageUrl,
  onClose,
}: DeckCardModalProps) {
  const lastShown = useRef<{ card: Card; imageUrl: string | undefined } | null>(null);
  if (card) {
    lastShown.current = { card, imageUrl };
  }
  const shown = lastShown.current;

  return (
    <Modal opened={card !== null} onClose={onClose} title={shown?.card.name} size="xl">
      {shown && (
        <DeckCardDetail
          key={shown.card.id}
          deckId={deckId}
          commanderFormat={isCommanderFormat(deckFormat)}
          isCommander={commanderId === shown.card.id}
          deckCardIds={deckCardIds}
          card={shown.card}
          imageUrl={shown.imageUrl}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

const ineligibilityMessages = {
  not_eligible:
    "Cette carte ne peut pas être commandant : il faut une créature légendaire, un véhicule légendaire avec force et endurance, ou une carte qui précise qu'elle peut être ton commandant.",
  banned: 'Cette carte est bannie en Commander.',
} as const;

interface DeckCardDetailProps {
  deckId: number;
  commanderFormat: boolean;
  isCommander: boolean;
  deckCardIds: Set<number>;
  card: Card;
  imageUrl: string | undefined;
  onClose: () => void;
}

function DeckCardDetail({
  deckId,
  commanderFormat,
  isCommander,
  deckCardIds,
  card,
  imageUrl,
  onClose,
}: DeckCardDetailProps) {
  const remove = useRemoveCardFromDeck();
  const update = useUpdateDeck();
  const scryfallCard = useScryfallCard(commanderFormat ? card.scryfall_id : null);
  const eligibility = scryfallCard.data ? commanderEligibility(scryfallCard.data) : null;

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
    <Stack gap="lg">
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
              <Stack gap={4}>
                <Text size="sm">C'est le commandant de ce deck.</Text>
                {commanderFormat && eligibility && eligibility !== 'eligible' && (
                  <Text size="sm" c="orange">
                    {ineligibilityMessages[eligibility]}
                  </Text>
                )}
              </Stack>
            ) : (
              commanderFormat &&
              (scryfallCard.isLoading ? (
                <Button variant="light" loading disabled>
                  Définir comme commandant
                </Button>
              ) : scryfallCard.error || !scryfallCard.data ? (
                <Text size="sm" c="dimmed">
                  Impossible de vérifier sur Scryfall si cette carte peut être commandant. Réessaie plus tard.
                </Text>
              ) : eligibility === 'eligible' ? (
                <Button variant="light" onClick={makeCommander} loading={update.isPending}>
                  Définir comme commandant
                </Button>
              ) : (
                eligibility && (
                  <Text size="sm" c="dimmed">
                    {ineligibilityMessages[eligibility]}
                  </Text>
                )
              ))
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
      <Divider />
      <EditionSwitcher
        deckId={deckId}
        card={card}
        deckCardIds={deckCardIds}
        isCommander={isCommander}
        onSwapped={onClose}
      />
    </Stack>
  );
}
